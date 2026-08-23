// Relative performance against the chain the token lives on.
//
// A token being up 60% means something different depending on whether Solana
// was up 5% or 50% over the same stretch. Comparing the two separates the
// token's own move from the market it was carried by.

const BASE = 'https://api.coingecko.com/api/v3';
const TIMEOUT_MS = 10_000;

export interface Benchmark {
  symbol: string;
  name: string;
  change7dPct: number | null;
  change30dPct: number | null;
}

interface ChartResponse {
  prices?: [number, number][];
}

/** Close-to-close change over the last `days` of a daily price series. */
function changeOver(prices: [number, number][], days: number): number | null {
  if (prices.length < 2) return null;
  const last = prices[prices.length - 1][1];
  // The series is oldest-first and one point per day, so step back from the end.
  const start = prices[Math.max(0, prices.length - 1 - days)][1];
  if (!(start > 0)) return null;
  return (last / start - 1) * 100;
}

export async function getSolBenchmark(): Promise<Benchmark | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `${BASE}/coins/solana/market_chart?vs_currency=usd&days=31&interval=daily`,
      { signal: controller.signal, headers: { accept: 'application/json' } }
    );
    if (!res.ok) return null;

    const body = (await res.json()) as ChartResponse;
    const prices = body.prices ?? [];
    if (prices.length < 8) return null;

    return {
      symbol: 'SOL',
      name: 'Solana',
      change7dPct: changeOver(prices, 7),
      change30dPct: changeOver(prices, 30)
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
