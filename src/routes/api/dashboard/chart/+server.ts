// API: Price history
// GET /api/dashboard/chart?range=24h
// OHLCV candles for the deepest pool, or 503 when the provider is unreachable.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadPriceSeries } from '$lib/server/market';
import type { ChartRange } from '$lib/dashboard/types';

export const config = { maxDuration: 30 };

const RANGES: ChartRange[] = ['1h', '24h', '7d', '30d', 'all'];

function parseRange(value: string | null): ChartRange {
  return RANGES.includes(value as ChartRange) ? (value as ChartRange) : '24h';
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
  const range = parseRange(url.searchParams.get('range'));

  try {
    const series = await loadPriceSeries(range);

    if (!series) {
      return json(
        {
          error: 'chart_unavailable',
          message: 'Price history is temporarily unavailable from the OHLCV provider.'
        },
        { status: 503 }
      );
    }

    // Mirrors the server-side TTL for this range so a shared CDN and the
    // in-process cache expire together rather than serving mismatched candles.
    const maxAge = range === '1h' ? 30 : range === '24h' ? 60 : 300;
    setHeaders({
      // Read-only, cached and free of user data, so cross-origin reads are
      // welcome: other sites and bots can surface this token's numbers.
      'access-control-allow-origin': '*',

      'cache-control': `public, max-age=${maxAge}, stale-while-revalidate=600`
    });

    return json(series);
  } catch (error) {
    console.error('Price series failed:', error);
    return json({ error: 'Failed to load price history' }, { status: 502 });
  }
};
