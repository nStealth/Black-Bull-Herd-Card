// Server load for the dashboard.
// Renders with real numbers on first paint; the client refreshes from
// /api/dashboard/snapshot afterwards.

import type { PageServerLoad } from './$types';
import { loadHolderIndex, loadPriceSeries, loadSnapshot, loadTrades } from '$lib/server/market';

const INITIAL_HOLDER_ROWS = 110; // top 10 podium + first 100 table rows

export const config = { maxDuration: 60 };

export const load: PageServerLoad = async ({ setHeaders }) => {
  // The chart and tape are fetched here as well as client-side so the first
  // paint is never an empty frame. Every one of these is individually cached
  // and independently nullable, so a slow provider costs a panel, not the page.
  const [snapshot, holderIndex, chart, trades] = await Promise.all([
    loadSnapshot(),
    loadHolderIndex(),
    loadPriceSeries('24h'),
    loadTrades()
  ]);

  setHeaders({
    'cache-control': 'public, max-age=15, stale-while-revalidate=120'
  });

  return {
    snapshot,
    holders: holderIndex?.holders.slice(0, INITIAL_HOLDER_ROWS) ?? [],
    indexed: holderIndex?.holders.length ?? 0,
    chart,
    trades: trades ?? []
  };
};
