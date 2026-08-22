// Holder indexing.
//
// Token supply comes from any Solana RPC and works on the free public endpoint.
// The holder *list* does not: enumerating token accounts needs either
// `getProgramAccounts` (which public RPC rate-limits into uselessness) or the
// Helius DAS `getTokenAccounts` method. So holders stay `unavailable` until a
// Helius key is configured, rather than being faked or partially guessed.

import { ANSEM_MINT, TIERS } from '$lib/tiers';
import type { Distribution, Holder } from '$lib/dashboard/types';

const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';
const DAS_PAGE_SIZE = 1000;
const MAX_HOLDERS = 10_000;
const TIMEOUT_MS = 12_000;

function heliusKey(): string | null {
  const direct = process.env.HELIUS_API_KEY?.trim();
  if (direct) return direct;

  // Also accept a full Helius RPC URL, which is how .env.example documents it.
  const rpc = process.env.RPC_URL?.trim();
  if (rpc && rpc.includes('helius')) {
    const key = new URL(rpc).searchParams.get('api-key');
    if (key) return key;
  }
  return null;
}

export function holdersAvailable(): boolean {
  return heliusKey() !== null;
}

function rpcUrl(): string {
  const key = heliusKey();
  if (key) return `https://mainnet.helius-rpc.com/?api-key=${key}`;
  return process.env.RPC_URL?.trim() || PUBLIC_RPC;
}

async function rpcCall<T>(method: string, params: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(rpcUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 'dashboard', method, params }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`RPC ${method} responded ${res.status}`);

    const body = (await res.json()) as { result?: T; error?: { message: string } };
    if (body.error) throw new Error(`RPC ${method}: ${body.error.message}`);
    if (body.result === undefined) throw new Error(`RPC ${method} returned no result`);
    return body.result;
  } finally {
    clearTimeout(timer);
  }
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
): Promise<Map<string, number>> {
  const balances = new Map<string, number>();
  const maxPages = Math.ceil(MAX_HOLDERS / DAS_PAGE_SIZE) + 2;
  const scale = 10 ** decimals;

  for (let page = 1; page <= maxPages; page++) {
    const result = await rpcCall<{ token_accounts?: DasTokenAccount[] }>('getTokenAccounts', {
      mint,
      page,
      limit: DAS_PAGE_SIZE,
      options: { showZeroBalance: false }
    });

    const accounts = result.token_accounts ?? [];
    if (accounts.length === 0) break;

    for (const account of accounts) {
      const raw = typeof account.amount === 'string' ? Number(account.amount) : account.amount;
      if (!Number.isFinite(raw) || raw <= 0) continue;
      balances.set(account.owner, (balances.get(account.owner) ?? 0) + raw / scale);
    }

    if (accounts.length < DAS_PAGE_SIZE) break;
  }

  return balances;
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

  const balances = await fetchOwnerBalances(mint, decimals);
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
    distribution: buildDistribution(ranked, totalSupply)
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

function buildDistribution(holders: Holder[], totalSupply: number): Distribution {
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
    tierCounts
  };
}
