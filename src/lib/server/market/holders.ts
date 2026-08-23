// Holder indexing.
//
// Token supply comes from any Solana RPC and works on the free public endpoint.
// The holder *list* does not: enumerating token accounts needs either
// `getProgramAccounts` (which public RPC rate-limits into uselessness) or the
// Helius DAS `getTokenAccounts` method. So holders stay `unavailable` until a
// Helius key is configured, rather than being faked or partially guessed.
//
// The endpoint resolution and JSON-RPC transport live in ./rpc so the supply
// read, the holder index and the mint-security check all share one RPC_URL.

import { ANSEM_MINT, TIERS } from '$lib/tiers';
import type { Distribution, Holder } from '$lib/dashboard/types';
import { heliusKey, rpcCall } from './rpc';

const DAS_PAGE_SIZE = 1000;
/** Ranked rows kept for display. Enumeration itself is not capped by this. */
const MAX_HOLDERS = 10_000;
/**
 * Hard ceiling on enumeration, as a safety valve rather than a target.
 *
 * This used to be `ceil(MAX_HOLDERS / DAS_PAGE_SIZE) + 2` — twelve pages —
 * which quietly truncated the walk. DAS returns token accounts in arbitrary
 * order, not by balance, so stopping early does not mean "we have the biggest
 * holders": it means we have an arbitrary subset. On this mint that left 36% of
 * supply in accounts nobody ever fetched, and any wallet in that 36% was
 * invisible to the leaderboard no matter how large.
 */
const MAX_PAGES = 60;
/**
 * Wall-clock budget for the walk.
 *
 * Page count alone does not bound how long this takes — sixty sequential RPC
 * round-trips can outlast the serverless invocation that started them, and a
 * timeout there costs the whole dashboard load, not just this panel. Stopping
 * on elapsed time keeps the page responsive and simply reports the result as
 * partial, which the panel already knows how to say out loud.
 */
const WALK_BUDGET_MS = 20_000;

export function holdersAvailable(): boolean {
  return heliusKey() !== null;
}

export interface SupplyInfo {
  totalSupply: number;
  decimals: number;
}

export async function getSupply(mint: string = ANSEM_MINT): Promise<SupplyInfo> {
  const result = await rpcCall<{ value: { uiAmount: number | null; decimals: number } }>(
    'getTokenSupply',
    [mint]
  );
  return {
    totalSupply: result.value.uiAmount ?? 0,
    decimals: result.value.decimals
  };
}

interface DasTokenAccount {
  address: string;
  owner: string;
  amount: number | string;
}

/**
 * Walk the DAS token-account pages and fold them into per-owner balances.
 * One owner can hold several token accounts, so balances are summed by owner.
 */
async function fetchOwnerBalances(
  mint: string,
  decimals: number
): Promise<{ balances: Map<string, number>; complete: boolean }> {
  const balances = new Map<string, number>();
  const scale = 10 ** decimals;
  const deadline = Date.now() + WALK_BUDGET_MS;
  let complete = false;

  for (let page = 1; page <= MAX_PAGES; page++) {
    if (Date.now() > deadline) break;

    const result = await rpcCall<{ token_accounts?: DasTokenAccount[] }>('getTokenAccounts', {
      mint,
      page,
      limit: DAS_PAGE_SIZE,
      options: { showZeroBalance: false }
    });

    const accounts = result.token_accounts ?? [];
    if (accounts.length === 0) {
      complete = true;
      break;
    }

    for (const account of accounts) {
      const raw = typeof account.amount === 'string' ? Number(account.amount) : account.amount;
      if (!Number.isFinite(raw) || raw <= 0) continue;
      balances.set(account.owner, (balances.get(account.owner) ?? 0) + raw / scale);
    }

    // A short page is the only reliable signal that the walk is exhausted.
    if (accounts.length < DAS_PAGE_SIZE) {
      complete = true;
      break;
    }
  }

  return { balances, complete };
}

function tierFor(balance: number): string {
  const sorted = [...TIERS].sort((a, b) => b.minBalance - a.minBalance);
  return sorted.find((t) => balance >= t.minBalance)?.id ?? TIERS[0].id;
}

export interface HolderIndex {
  holders: Holder[];
  totalHolders: number;
  distribution: Distribution;
}

/**
 * Build the full ranked holder list. Returns null when no indexing provider is
 * configured, which the API surfaces as `holders: 'unavailable'`.
 */
export async function indexHolders(
  mint: string,
  totalSupply: number,
  decimals: number,
  knownPools: Map<string, string>
): Promise<HolderIndex | null> {
  if (!holdersAvailable()) return null;

  const { balances, complete } = await fetchOwnerBalances(mint, decimals);
  const indexedSupply = [...balances.values()].reduce((sum, b) => sum + b, 0);
  const ranked = [...balances.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_HOLDERS)
    .map<Holder>(([owner, balance], i) => ({
      rank: i + 1,
      owner,
      balance,
      percentSupply: totalSupply > 0 ? (balance / totalSupply) * 100 : 0,
      entity: knownPools.get(owner) ?? null,
      tierId: tierFor(balance)
    }));

  return {
    holders: ranked,
    totalHolders: balances.size,
    distribution: buildDistribution(ranked, totalSupply, {
      complete,
      coveragePct: totalSupply > 0 ? (indexedSupply / totalSupply) * 100 : 0,
      rankedCount: ranked.length,
      ownerCount: balances.size
    })
  };
}

function sumPct(holders: Holder[], count: number): number {
  return holders.slice(0, count).reduce((sum, h) => sum + h.percentSupply, 0);
}

/**
 * Gini over the indexed holders. Balances must already be sorted descending;
 * the standard formula wants ascending order, so the index is mirrored.
 */
function gini(holders: Holder[]): number {
  const n = holders.length;
  if (n < 2) return 0;

  let total = 0;
  let weighted = 0;
  for (let i = 0; i < n; i++) {
    const balance = holders[n - 1 - i].balance; // ascending
    total += balance;
    weighted += (i + 1) * balance;
  }
  if (total === 0) return 0;

  return (2 * weighted) / (n * total) - (n + 1) / n;
}

interface Coverage {
  complete: boolean;
  coveragePct: number;
  rankedCount: number;
  ownerCount: number;
}

function buildDistribution(
  holders: Holder[],
  totalSupply: number,
  coverage: Coverage
): Distribution {
  const tierCounts = TIERS.map((tier) => {
    const members = holders.filter((h) => h.tierId === tier.id);
    const supply = members.reduce((sum, h) => sum + h.balance, 0);
    return {
      tierId: tier.id,
      count: members.length,
      supplyPct: totalSupply > 0 ? (supply / totalSupply) * 100 : 0
    };
  });

  return {
    top10Pct: sumPct(holders, 10),
    top50Pct: sumPct(holders, 50),
    top100Pct: sumPct(holders, 100),
    gini: gini(holders),
    tierCounts,
    ...coverage
  };
}
