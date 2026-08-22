// GeckoTerminal client — OHLCV price history and the recent-trade feed.
//
// Chosen because it is the only free, key-less source for both. DexScreener
// publishes aggregates but no candles and no trade tape; Birdeye and Helius
// both gate that behind a key. The public tier here allows ~30 calls/min, so
// every call in this module goes through the shared cache.
//
// Docs: https://api.geckoterminal.com/docs/index.html

import type { Candle, ChartRange, PriceSeries, TradeEvent } from '$lib/dashboard/types';

const BASE = 'https://api.geckoterminal.com/api/v2';
const NETWORK = 'solana';
const TIMEOUT_MS = 10_000;

async function gt<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`GeckoTerminal ${path} responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Candle granularity per range. Each range asks for the coarsest resolution
 * that still draws a readable line, which keeps the payload small and stays
 * well inside the public rate limit.
 */
const RANGE_QUERY: Record<ChartRange, { timeframe: string; aggregate: number; limit: number }> = {
  '1h': { timeframe: 'minute', aggregate: 1, limit: 60 },
  '24h': { timeframe: 'minute', aggregate: 15, limit: 96 },
  '7d': { timeframe: 'hour', aggregate: 1, limit: 168 },
  '30d': { timeframe: 'hour', aggregate: 4, limit: 180 },
  all: { timeframe: 'day', aggregate: 1, limit: 365 }
};

interface OhlcvResponse {
  data?: { attributes?: { ohlcv_list?: number[][] } };
}

/**
 * Fetch one OHLCV window for a pool.
 *
 * GeckoTerminal returns newest-first; charts read left-to-right, so the list is
 * reversed here rather than in every consumer.
 */
export async function getPriceSeries(
  poolAddress: string,
  range: ChartRange
): Promise<PriceSeries | null> {
  const q = RANGE_QUERY[range];
  const body = await gt<OhlcvResponse>(
    `/networks/${NETWORK}/pools/${poolAddress}/ohlcv/${q.timeframe}?aggregate=${q.aggregate}&limit=${q.limit}&currency=usd`
  );

  const rows = body.data?.attributes?.ohlcv_list ?? [];
  if (rows.length === 0) return null;

  const candles: Candle[] = rows
    .map((r) => ({
      t: num(r[0]) * 1000,
      o: num(r[1]),
      h: num(r[2]),
      l: num(r[3]),
      c: num(r[4]),
      v: num(r[5])
    }))
    .filter((c) => c.c > 0)
    .reverse();

  if (candles.length === 0) return null;

  const first = candles[0];
  const last = candles[candles.length - 1];

  return {
    range,
    candles,
    changePct: first.o > 0 ? ((last.c - first.o) / first.o) * 100 : 0,
    high: Math.max(...candles.map((c) => c.h)),
    low: Math.min(...candles.map((c) => c.l)),
    volumeUsd: candles.reduce((sum, c) => sum + c.v, 0)
  };
}

interface TradesResponse {
  data?: {
    attributes?: {
      block_timestamp?: string;
      tx_hash?: string;
      tx_from_address?: string;
      kind?: string;
      volume_in_usd?: string;
      from_token_amount?: string;
      to_token_amount?: string;
      price_to_in_usd?: string;
      price_from_in_usd?: string;
    };
  }[];
}

/**
 * Recent swaps on a pool, largest-first filtering applied upstream.
 *
 * `minUsd` is passed to the API rather than filtered locally so the response
 * stays small: the endpoint caps at 300 trades, and without a floor those 300
 * are mostly dust that would crowd out the whale prints worth watching.
 */
export async function getRecentTrades(
  poolAddress: string,
  minUsd = 250,
  limit = 60
): Promise<TradeEvent[]> {
  const body = await gt<TradesResponse>(
    `/networks/${NETWORK}/pools/${poolAddress}/trades?trade_volume_in_usd_greater_than=${minUsd}`
  );

  const trades: TradeEvent[] = [];

  for (const row of body.data ?? []) {
    const a = row.attributes;
    if (!a) continue;

    const kind = a.kind === 'buy' ? 'buy' : 'sell';
    const timestamp = a.block_timestamp ? Date.parse(a.block_timestamp) : NaN;
    if (!Number.isFinite(timestamp)) continue;

    // On a buy the token is the "to" side, on a sell it is the "from" side.
    const tokenAmount = kind === 'buy' ? num(a.to_token_amount) : num(a.from_token_amount);
    const priceUsd = kind === 'buy' ? num(a.price_to_in_usd) : num(a.price_from_in_usd);

    trades.push({
      kind,
      amountUsd: num(a.volume_in_usd),
      tokenAmount,
      priceUsd,
      wallet: a.tx_from_address ?? '',
      txHash: a.tx_hash ?? '',
      timestamp
    });
  }

  return trades.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export interface TokenMeta {
  coingeckoId: string | null;
  graduated: boolean | null;
  graduatedAt: number | null;
  topPoolAddress: string | null;
}

interface TokenResponse {
  data?: {
    attributes?: {
      coingecko_coin_id?: string | null;
      launchpad_details?: {
        completed?: boolean;
        completed_at?: string | null;
      } | null;
    };
    relationships?: {
      top_pools?: { data?: { id?: string }[] };
    };
  };
}

/**
 * Token-level metadata: the CoinGecko id that unlocks ranking/ATH data, and
 * the launchpad graduation state for tokens that started on a bonding curve.
 */
export async function getTokenMeta(mint: string): Promise<TokenMeta | null> {
  const body = await gt<TokenResponse>(`/networks/${NETWORK}/tokens/${mint}`);
  const attrs = body.data?.attributes;
  if (!attrs) return null;

  const launchpad = attrs.launchpad_details ?? null;
  const completedAt = launchpad?.completed_at ? Date.parse(launchpad.completed_at) : NaN;

  // Pool ids come back namespaced as "solana_<address>".
  const topPoolId = body.data?.relationships?.top_pools?.data?.[0]?.id ?? null;

  return {
    coingeckoId: attrs.coingecko_coin_id ?? null,
    graduated: launchpad ? launchpad.completed === true : null,
    graduatedAt: Number.isFinite(completedAt) ? completedAt : null,
    topPoolAddress: topPoolId ? topPoolId.replace(`${NETWORK}_`, '') : null
  };
}
