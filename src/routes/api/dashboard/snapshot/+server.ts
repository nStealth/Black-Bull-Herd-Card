// API: Dashboard snapshot
// GET /api/dashboard/snapshot
// Price, market cap, liquidity, supply, trading activity and provider status.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadSnapshot } from '$lib/server/market';
import { publicWindow } from '$lib/server/cacheWindow';

export const config = { maxDuration: 30 };

export const GET: RequestHandler = async ({ setHeaders }) => {
  try {
    const snapshot = await loadSnapshot();

    setHeaders({
      // Read-only, cached and free of user data, so cross-origin reads are
      // welcome: other sites and bots can surface this token's numbers.
      'access-control-allow-origin': '*',

      'cache-control': publicWindow
    });

    return json(snapshot);
  } catch (error) {
    console.error('Dashboard snapshot failed:', error);
    return json({ error: 'Failed to load dashboard data' }, { status: 502 });
  }
};
