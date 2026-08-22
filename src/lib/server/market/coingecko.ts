// CoinGecko client — cross-market context that on-chain sources cannot provide.
//
// Rank, all-time high/low and the 7d/30d price changes are computed by
// CoinGecko across every venue a token trades on, not just its Solana pools.
// The free tier allows roughly 10-30 calls/min and needs no key, so this is
// cached hard and treated as strictly optional: if the id is unknown or the
// call fails, the dashboard drops the panel instead of guessing.

import type { MarketStats } from '$lib/dashboard/types';

const BASE = 'https://api.coingecko.com/api/v3';
const TIMEOUT_MS = 10_000;

function num(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function date(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

interface CoinResponse {
  market_cap_rank?: number | null;
  market_data?: {
    ath?: Record<string, number>;
    ath_date?: Record<string, string>;
    ath_change_percentage?: Record<string, number>;
    atl?: Record<string, number>;
    atl_date?: Record<string, string>;
    high_24h?: Record<string, number>;
    low_24h?: Record<string, number>;
    price_change_percentage_7d?: number;
    price_change_percentage_30d?: number;
  };
}

export async function getMarketStats(coinId: string): Promise<MarketStats | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `${BASE}/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      { signal: controller.signal, headers: { accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);

    const body = (await res.json()) as CoinResponse;
    const m = body.market_data;
    if (!m) return null;

    return {
      rank: body.market_cap_rank ?? null,
      ath: num(m.ath?.usd),
      athDate: date(m.ath_date?.usd),
      athChangePct: num(m.ath_change_percentage?.usd),
      atl: num(m.atl?.usd),
      atlDate: date(m.atl_date?.usd),
      high24h: num(m.high_24h?.usd),
      low24h: num(m.low_24h?.usd),
      change7dPct: num(m.price_change_percentage_7d),
      change30dPct: num(m.price_change_percentage_30d),
      // Filled from the OHLCV series, which is the only free source for them.
      volume7dUsd: null,
      volume30dUsd: null
    };
  } finally {
    clearTimeout(timer);
  }
}
