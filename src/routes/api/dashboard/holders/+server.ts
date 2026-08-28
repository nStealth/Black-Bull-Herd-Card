// API: Holder leaderboard
// GET /api/dashboard/holders?page=1&pageSize=50
// Returns a ranked page of holders, or 503 when no indexing provider is set.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadHolderIndex } from '$lib/server/market';
import type { HoldersPage } from '$lib/dashboard/types';
import { publicWindow } from '$lib/server/cacheWindow';

export const config = { maxDuration: 60 };

const MAX_PAGE_SIZE = 250;

function intParam(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
  const page = intParam(url.searchParams.get('page'), 1, 1, 1000);
  const pageSize = intParam(url.searchParams.get('pageSize'), 50, 1, MAX_PAGE_SIZE);

  try {
    const index = await loadHolderIndex();

    if (!index) {
      return json(
        {
          error: 'holders_unavailable',
          message:
            'Holder analytics require an indexing provider. Set HELIUS_API_KEY to enable this panel.'
        },
        { status: 503 }
      );
    }

    const start = (page - 1) * pageSize;
    const slice = index.holders.slice(start, start + pageSize);

    const payload: HoldersPage = {
      holders: slice,
      page,
      pageSize,
      indexed: index.holders.length,
      totalHolders: index.totalHolders,
      hasMore: start + pageSize < index.holders.length
    };

    setHeaders({
      // Read-only, cached and free of user data, so cross-origin reads are
      // welcome: other sites and bots can surface this token's numbers.
      'access-control-allow-origin': '*',

      'cache-control': publicWindow
    });

    return json(payload);
  } catch (error) {
    console.error('Holder page failed:', error);
    return json({ error: 'Failed to load holders' }, { status: 502 });
  }
};
