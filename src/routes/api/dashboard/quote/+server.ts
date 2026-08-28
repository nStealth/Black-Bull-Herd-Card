// API: Slippage quote
// GET /api/dashboard/quote?usd=25000&side=buy
// What one specific trade size would cost, routed live.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadQuote } from '$lib/server/market';
import { clientKey, rateLimit } from '$lib/server/rateLimit';
import { publicWindow } from '$lib/server/cacheWindow';

export const config = { maxDuration: 20 };

/** Each call is a live router request, so this is tighter than the read routes. */
const LIMIT_PER_MIN = 40;
const MIN_USD = 10;
const MAX_USD = 100_000_000;

export const GET: RequestHandler = async ({ url, request, setHeaders }) => {
  const usd = Number(url.searchParams.get('usd'));
  const side = url.searchParams.get('side') === 'sell' ? 'sell' : 'buy';

  if (!Number.isFinite(usd) || usd < MIN_USD || usd > MAX_USD) {
    return json(
      { error: 'invalid_amount', message: `Amount must be between $${MIN_USD} and $${MAX_USD}.` },
      { status: 400 }
    );
  }

  const limit = await rateLimit(`quote:${clientKey(request)}`, LIMIT_PER_MIN, 60);
  if (!limit.allowed) {
    return json(
      { error: 'Too many requests', retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSec) } }
    );
  }

  try {
    const quote = await loadQuote(usd, side);
    if (!quote) {
      return json(
        { error: 'quote_unavailable', message: 'The router did not return a quote for that size.' },
        { status: 503 }
      );
    }

    setHeaders({ 'cache-control': publicWindow });
    return json(quote);
  } catch (error) {
    console.error('Quote failed:', error);
    return json({ error: 'Failed to quote' }, { status: 502 });
  }
};
