// DexScreener client — the one market-data source that needs no API key.
// Covers price, market cap, liquidity, volume and buy/sell counts up to 24h.
// Docs: https://docs.dexscreener.com/api/reference

import { ANSEM_MINT } from '$lib/tiers';
import type { ActivityStats, TokenOverview, WindowStats } from '$lib/dashboard/types';

const ENDPOINT = 'https://api.dexscreener.com/latest/dex/tokens';
const TIMEOUT_MS = 8000;

interface DsWindow {
  buys: number;
  sells: number;
}

interface DsPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd?: string;
  txns: Record<string, DsWindow>;
  volume: Record<string, number>;
  priceChange: Record<string, number>;
  liquidity?: { usd?: number; base?: number; quote?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    socials?: { type: string; url: string }[];
  };
}

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function fetchPairs(mint: string): Promise<DsPair[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${ENDPOINT}/${mint}`, {
      signal: controller.signal,
      headers: { accept: 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`DexScreener responded ${res.status}`);
    }
    const body = (await res.json()) as { pairs: DsPair[] | null };
    return (body.pairs ?? []).filter((p) => p.chainId === 'solana');
  } finally {
    clearTimeout(timer);
  }
}

/** The deepest pool decides the quoted price — it is the hardest to manipulate. */
function primaryPair(pairs: DsPair[]): DsPair | null {
  if (pairs.length === 0) return null;
  return pairs.reduce((best, p) =>
    num(p.liquidity?.usd) > num(best.liquidity?.usd) ? p : best
  );
}

/**
 * Counts and volume are genuinely additive across pools, so they are summed.
 *
 * Price change is not: it is a rate, and averaging it across pools lets a
 * single stale micro-pool poison the number (one Meteora bin on this token
 * reports a six-figure percentage). The deepest pool is the canonical price
 * reference — the same one DexScreener and CoinMarketCap quote — so its change
 * is used verbatim.
 */
function aggregateWindow(pairs: DsPair[], primary: DsPair, key: string): WindowStats {
  let buys = 0;
  let sells = 0;
  let volumeUsd = 0;

  for (const pair of pairs) {
    buys += num(pair.txns?.[key]?.buys);
    sells += num(pair.txns?.[key]?.sells);
    volumeUsd += num(pair.volume?.[key]);
  }

  return {
    buys,
    sells,
    volumeUsd,
    priceChangePct: num(primary.priceChange?.[key])
  };
}

export interface DexScreenerResult {
  overview: Omit<TokenOverview, 'totalSupply' | 'circulatingSupply' | 'decimals'>;
  activity: Pick<ActivityStats, 'm5' | 'h1' | 'h6' | 'h24'>;
}

export async function getDexScreenerData(
  mint: string = ANSEM_MINT
): Promise<DexScreenerResult | null> {
  const pairs = await fetchPairs(mint);
  const primary = primaryPair(pairs);
  if (!primary) return null;

  const liquidityUsd = pairs.reduce((sum, p) => sum + num(p.liquidity?.usd), 0);

  return {
    overview: {
      mint,
      name: primary.baseToken.name,
      symbol: primary.baseToken.symbol,
      imageUrl: primary.info?.imageUrl ?? null,
      priceUsd: num(primary.priceUsd),
      priceNative: num(primary.priceNative),
      marketCapUsd: num(primary.marketCap),
      fdvUsd: num(primary.fdv),
      liquidityUsd,
      pairCreatedAt: primary.pairCreatedAt ?? null,
      pairs: pairs
        .map((p) => ({
          dexId: p.dexId,
          pairAddress: p.pairAddress,
          url: p.url,
          quoteSymbol: p.quoteToken.symbol,
          liquidityUsd: num(p.liquidity?.usd),
          volume24hUsd: num(p.volume?.h24),
          labels: p.labels ?? []
        }))
        .sort((a, b) => b.liquidityUsd - a.liquidityUsd),
      socials: primary.info?.socials ?? []
    },
    activity: {
      m5: aggregateWindow(pairs, primary, 'm5'),
      h1: aggregateWindow(pairs, primary, 'h1'),
      h6: aggregateWindow(pairs, primary, 'h6'),
      h24: aggregateWindow(pairs, primary, 'h24')
    }
  };
}

/** Pool addresses are not people — the holders table labels them separately. */
export function poolAddresses(result: DexScreenerResult): Set<string> {
  return new Set(result.overview.pairs.map((p) => p.pairAddress));
}
