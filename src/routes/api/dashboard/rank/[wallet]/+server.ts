// API: Wallet rank
// GET /api/dashboard/rank/[wallet]
// Where one address sits in the holder index, plus its tier and value.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadWalletRank } from '$lib/server/market';
import { getAnsemBalance } from '$lib/server/solana';
import { isValidPublicKey } from '$lib/solana';
import { clientKey, rateLimit } from '$lib/server/rateLimit';

export const config = { maxDuration: 30 };

/** Same budget as the wallet check: enough to explore, not enough to scrape. */
const LIMIT_PER_MIN = 30;

export const GET: RequestHandler = async ({ params, request, setHeaders }) => {
  const wallet = params.wallet;

  // Reject the address shape before any index or RPC work.
  if (!wallet || !isValidPublicKey(wallet)) {
    return json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const limit = await rateLimit(`rank:${clientKey(request)}`, LIMIT_PER_MIN, 60);
  // The counter headers go on the 429 too. Sending them only on success meant
  // the one response a client most needs them on — the rejection — arrived
  // without them.
  const limitHeaders = {
    'x-ratelimit-limit': String(LIMIT_PER_MIN),
    'x-ratelimit-remaining': String(limit.remaining),
    'x-ratelimit-state': limit.state
  };

  if (!limit.allowed) {
    return json(
      { error: 'Too many requests', retryAfterSec: limit.retryAfterSec },
      {
        status: 429,
        headers: { ...limitHeaders, 'retry-after': String(limit.retryAfterSec) }
      }
    );
  }

  try {
    // Try the index first; it answers without touching an RPC. Only fall back
    // to an on-chain read when the wallet sits outside the ranked slice, which
    // is also the only case where the index cannot supply a balance.
    let result = await loadWalletRank(wallet, null);

    if (!result) {
      return json(
        {
          error: 'index_unavailable',
          message: 'The holder index is not available right now.'
        },
        { status: 503 }
      );
    }

    if (result.rank === null) {
      const onChain = await getAnsemBalance(wallet);
      if (onChain.success) {
        result = await loadWalletRank(wallet, onChain.balance);
      }
    }

    // Observable on purpose: a limiter that fails open is indistinguishable
    // from one that is working until you can see the counter.
    setHeaders({ 'cache-control': 'private, max-age=30', ...limitHeaders });
    return json(result);
  } catch (error) {
    console.error('Wallet rank failed:', error);
    return json({ error: 'Failed to look up wallet' }, { status: 502 });
  }
};
