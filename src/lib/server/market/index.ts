// Composition layer: turns the individual providers into the payloads the
// dashboard routes serve. Every panel degrades independently, so one dead
// provider never takes the whole page down.

import { ANSEM_MINT } from '$lib/tiers';
import { cached } from './cache';
import { getDexScreenerData, poolAddresses, type DexScreenerResult } from './dexscreener';
import { entityMap } from './entities';
import { getSupply, holdersAvailable, indexHolders, type HolderIndex } from './holders';
import type {
  ActivityStats,
  DashboardSnapshot,
  Distribution,
  ProviderStatus,
  TokenOverview
} from '$lib/dashboard/types';

const OVERVIEW_TTL_SEC = 30;
const HOLDERS_TTL_SEC = 900; // holder sets move slowly and cost 10 RPC pages

async function loadMarket(): Promise<DexScreenerResult | null> {
  return cached('dash:market:v1', OVERVIEW_TTL_SEC, async () => {
    try {
      return await getDexScreenerData(ANSEM_MINT);
    } catch (error) {
      console.error('[market] DexScreener fetch failed:', error);
      return null;
    }
  });
}

const DEFAULT_DECIMALS = 6;

/**
 * Returns null rather than a zeroed placeholder when the RPC is unreachable,
 * so a transient failure is never cached as "supply is 0".
 */
async function loadSupply(): Promise<{ totalSupply: number; decimals: number } | null> {
  return cached('dash:supply:v1', 300, async () => {
    try {
      return await getSupply(ANSEM_MINT);
    } catch (error) {
      console.error('[market] getTokenSupply failed:', error);
      return null;
    }
  });
}

export async function loadHolderIndex(): Promise<HolderIndex | null> {
  if (!holdersAvailable()) return null;

  return cached('dash:holders:v1', HOLDERS_TTL_SEC, async () => {
    const [market, supply] = await Promise.all([loadMarket(), loadSupply()]);
    if (!supply) return null;
    const pools = market ? poolAddresses(market) : new Set<string>();

    try {
      return await indexHolders(ANSEM_MINT, supply.totalSupply, supply.decimals, entityMap(pools));
    } catch (error) {
      console.error('[market] holder index failed:', error);
      return null;
    }
  });
}

export async function loadSnapshot(): Promise<DashboardSnapshot> {
  const [market, supply, holderIndex] = await Promise.all([
    loadMarket(),
    loadSupply(),
    loadHolderIndex()
  ]);

  const notes: string[] = [];
  if (!market) {
    notes.push('DexScreener is not responding — price and volume are stale.');
  }
  if (!supply) {
    notes.push('The Solana RPC did not return the token supply on this refresh.');
  }
  if (!holdersAvailable()) {
    notes.push(
      'Holder analytics need an indexing provider. Set HELIUS_API_KEY to enable the holder leaderboard.'
    );
  }
  notes.push(
    '7-day and 30-day trade counts require an indexed history provider and are not sourced from a free endpoint.'
  );

  const status: ProviderStatus = {
    dexscreener: market ? 'live' : 'unavailable',
    holders: holderIndex ? 'live' : 'unavailable',
    extendedWindows: 'unavailable',
    notes
  };

  const overview: TokenOverview | null = market
    ? {
        ...market.overview,
        totalSupply: supply?.totalSupply ?? 0,
        circulatingSupply: supply?.totalSupply ?? 0,
        decimals: supply?.decimals ?? DEFAULT_DECIMALS
      }
    : null;

  const activity: ActivityStats | null = market
    ? { ...market.activity, d7: null, d30: null }
    : null;

  return {
    overview,
    activity,
    distribution: holderIndex?.distribution ?? null,
    totalHolders: holderIndex?.totalHolders ?? null,
    status,
    updatedAt: Date.now()
  };
}

export { holdersAvailable };
export type {
  ActivityStats,
  DashboardSnapshot,
  Distribution,
  Holder,
  HoldersPage,
  ProviderStatus,
  TokenOverview
} from '$lib/dashboard/types';
