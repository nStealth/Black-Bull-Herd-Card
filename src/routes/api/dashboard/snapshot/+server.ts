// API: Dashboard snapshot
// GET /api/dashboard/snapshot
// Price, market cap, liquidity, supply, trading activity and provider status.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadSnapshot } from '$lib/server/market';

export const config = { maxDuration: 30 };

export const GET: RequestHandler = async ({ setHeaders }) => {
  try {
    const snapshot = await loadSnapshot();

    setHeaders({
      'cache-control': 'public, max-age=15, stale-while-revalidate=60'
    });

    return json(snapshot);
  } catch (error) {
    console.error('Dashboard snapshot failed:', error);
    return json({ error: 'Failed to load dashboard data' }, { status: 502 });
  }
};
