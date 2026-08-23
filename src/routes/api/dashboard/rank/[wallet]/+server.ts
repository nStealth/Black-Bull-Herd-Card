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
  if (!limit.allowed) {
    return json(
      { error: 'Too many requests', retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSec) } }
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

    setHeaders({ 'cache-control': 'private, max-age=30' });
    return json(result);
  } catch (error) {
    console.error('Wallet rank failed:', error);
    return json({ error: 'Failed to look up wallet' }, { status: 502 });
  }
};
