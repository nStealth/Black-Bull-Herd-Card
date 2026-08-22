// API: Live trade tape
// GET /api/dashboard/trades
// Recent swaps on the deepest pool, newest first, dust filtered out upstream.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadTrades } from '$lib/server/market';

export const config = { maxDuration: 30 };

export const GET: RequestHandler = async ({ setHeaders }) => {
  try {
    const trades = await loadTrades();

    if (!trades) {
      return json(
        {
          error: 'trades_unavailable',
          message: 'The trade feed is temporarily unavailable from the provider.'
        },
        { status: 503 }
      );
    }

    setHeaders({
      'cache-control': 'public, max-age=15, stale-while-revalidate=60'
    });

    return json({ trades, updatedAt: Date.now() });
  } catch (error) {
    console.error('Trade feed failed:', error);
    return json({ error: 'Failed to load trades' }, { status: 502 });
  }
};
