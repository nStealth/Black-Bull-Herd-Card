// API: Live trade tape
// GET /api/dashboard/trades
// Recent swaps on the deepest pool, newest first, dust filtered out upstream.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadTrades } from '$lib/server/market';
import { publicWindow } from '$lib/server/cacheWindow';

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
      // Read-only, cached and free of user data, so cross-origin reads are
      // welcome: other sites and bots can surface this token's numbers.
      'access-control-allow-origin': '*',

      'cache-control': publicWindow
    });

    return json({ trades, updatedAt: Date.now() });
  } catch (error) {
    console.error('Trade feed failed:', error);
    return json({ error: 'Failed to load trades' }, { status: 502 });
  }
};
