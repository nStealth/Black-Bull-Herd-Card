// Record that a visitor asked to follow a wallet.
//
// The only write endpoint on the dashboard, so it is the only one that needs
// real guarding: the address is validated to the same shape as the rank
// lookup, the figures are re-read from the server's own index rather than
// trusted from the body, and the whole thing is rate limited per IP.
//
// Re-reading matters. If the client supplied the balance and rank, anyone
// could post a row claiming any wallet holds anything, and the table would be
// a record of what people typed rather than what is true on chain.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadWalletRank } from '$lib/server/market';
import { saveWatchedWallet } from '$lib/db';
import { isValidPublicKey } from '$lib/solana';
import { clientKey, rateLimit } from '$lib/server/rateLimit';

const LIMIT_PER_MIN = 20;

export const POST: RequestHandler = async ({ request }) => {
  const limit = await rateLimit(`watch:${clientKey(request)}`, LIMIT_PER_MIN, 60);
  if (!limit.allowed) {
    return json(
      { message: 'Too many saves — give it a minute.' },
      { status: 429, headers: { 'retry-after': '60' } }
    );
  }

  let wallet = '';
  try {
    const body = (await request.json()) as { wallet?: unknown };
    wallet = typeof body.wallet === 'string' ? body.wallet.trim() : '';
  } catch {
    return json({ message: 'Expected a JSON body with a wallet field.' }, { status: 400 });
  }

  if (!isValidPublicKey(wallet)) {
    return json({ message: 'That does not look like a Solana address.' }, { status: 400 });
  }

  // Figures come from our own index, never from the request body.
  const rank = await loadWalletRank(wallet, null);
  if (!rank) {
    return json({ message: 'Holder index unavailable.' }, { status: 503 });
  }

  const { stored } = await saveWatchedWallet({
    wallet,
    rank: rank.rank,
    balance: rank.balance,
    percentSupply: rank.percentSupply,
    tierId: rank.tierId ?? null
  });

  // A missing database is not an error the visitor should see: their own list
  // still works, it simply is not mirrored anywhere.
  return json({ wallet, stored });
};
