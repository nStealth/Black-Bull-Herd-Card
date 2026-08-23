// Where one wallet sits among every holder.
//
// The ranked slice is exact for the top MAX_HOLDERS, which in practice covers
// anyone holding more than dust: on this mint rank 5,000 already holds ten
// tokens and rank 10,000 holds none. A wallet below that gets its real balance
// and tier but no rank number, because ordering dust by dust is precision about
// nothing.

import { getTier, TIERS } from '$lib/tiers';
import type { WalletRank } from '$lib/dashboard/types';
import type { HolderIndex } from './holders';

export function buildWalletRank(
  wallet: string,
  index: HolderIndex,
  priceUsd: number,
  /** Exact on-chain balance, used when the wallet is outside the ranked slice. */
  fallbackBalance: number | null
): WalletRank | null {
  const hit = index.holders.find((h) => h.owner === wallet);

  const balance = hit ? hit.balance : (fallbackBalance ?? 0);
  const { tier, percentSupply } = getTier(balance);

  // Tiers are declared ascending, so the next one up is the first with a
  // higher floor than the balance.
  const next = TIERS.find((t) => t.minBalance > balance) ?? null;

  const rank = hit ? hit.rank : null;
  const percentile =
    rank !== null && index.totalHolders > 0
      ? ((index.totalHolders - rank) / index.totalHolders) * 100
      : null;

  return {
    wallet,
    balance,
    valueUsd: balance * priceUsd,
    // A holder found in the index already carries its share of supply; a
    // fallback lookup gets it from the tier calculation instead.
    percentSupply: hit ? hit.percentSupply : percentSupply,
    tierId: tier.id,
    tierName: tier.name,
    tierColor: tier.color,
    rank,
    percentile,
    totalHolders: index.totalHolders,
    rankedCount: index.holders.length,
    toNextTier: next
      ? { tokens: next.minBalance - balance, tierName: next.name, tierColor: next.color }
      : null,
    isPool: hit?.entity != null,
    poolLabel: hit?.entity ?? null
  };
}
