// Composition layer: turns the individual providers into the payloads the
// dashboard routes serve. Every panel degrades independently, so one dead
// provider never takes the whole page down.

import { ANSEM_MINT } from '$lib/tiers';
import { cached } from './cache';
import { getMarketStats } from './coingecko';
import { getDexScreenerData, poolAddresses, type DexScreenerResult } from './dexscreener';
import { entityMap } from './entities';
import { getPriceSeries, getRecentTrades, getTokenMeta, type TokenMeta } from './geckoterminal';
import { getSupply, holdersAvailable, indexHolders, type HolderIndex } from './holders';
import { getDepthLadder } from './jupiter';
import { buildWalletRank } from './rank';
import { buildRiskProfile } from './risk';
import { isRedisReady } from '$lib/server/redis';
import { getMintAuthorities } from './security';
import type {
  ActivityStats,
  WalletRank,
  DepthLadder,
  RiskProfile,
  ChartRange,
  DashboardSnapshot,
  MarketStats,
  PriceSeries,
  ProviderStatus,
  SecurityInfo,
  TokenOverview,
  TradeEvent,
  WindowStats
} from '$lib/dashboard/types';

const OVERVIEW_TTL_SEC = 30;
const HOLDERS_TTL_SEC = 900; // holder sets move slowly and cost 10 RPC pages
const META_TTL_SEC = 3600; // coingecko id and graduation state are effectively static
const RANKING_TTL_SEC = 300; // CoinGecko free tier is rate-limited; do not hammer it
const SECURITY_TTL_SEC = 600; // authorities change at most once, on revocation
const TRADES_TTL_SEC = 20; // the tape is the one panel that should feel live
const DEPTH_TTL_SEC = 120; // eight sequential router quotes; do not run them often

/**
 * How long each provider's last good payload stays usable when a refresh
 * fails. GeckoTerminal and CoinGecko both rate-limit the free tier, and a
 * dashboard that blanks a panel on one 429 is worse than one showing a candle
 * a few minutes old next to an honest "synced" stamp.
 */
const STALE = {
  market: 600,
  supply: 3600,
  meta: 86_400,
  chart: 3600,
  trades: 300,
  depth: 1800,
  ranking: 3600,
  authorities: 86_400,
  holders: 7200
} as const;

/** Short windows redraw often; long ones barely move, so they cache far longer. */
const CHART_TTL_SEC: Record<ChartRange, number> = {
  '1h': 30,
  '24h': 60,
  '7d': 300,
  '30d': 900,
  all: 1800
};

async function loadMarket(): Promise<DexScreenerResult | null> {
  return cached(
    'dash:market:v1',
    OVERVIEW_TTL_SEC,
    async () => {
      try {
        return await getDexScreenerData(ANSEM_MINT);
      } catch (error) {
        console.error('[market] DexScreener fetch failed:', error);
        return null;
      }
    },
    { staleTtlSec: STALE.market }
  );
}

const DEFAULT_DECIMALS = 6;

/**
 * Returns null rather than a zeroed placeholder when the RPC is unreachable,
 * so a transient failure is never cached as "supply is 0".
 */
async function loadSupply(): Promise<{ totalSupply: number; decimals: number } | null> {
  return cached(
    'dash:supply:v1',
    300,
    async () => {
      try {
        return await getSupply(ANSEM_MINT);
      } catch (error) {
        console.error('[market] getTokenSupply failed:', error);
        return null;
      }
    },
    { staleTtlSec: STALE.supply }
  );
}

async function loadTokenMeta(): Promise<TokenMeta | null> {
  return cached(
    'dash:meta:v1',
    META_TTL_SEC,
    async () => {
      try {
        return await getTokenMeta(ANSEM_MINT);
      } catch (error) {
        console.error('[market] GeckoTerminal token meta failed:', error);
        return null;
      }
    },
    { staleTtlSec: STALE.meta }
  );
}

/**
 * The deepest pool is the chart and tape reference — the same pool the price
 * is quoted from, and the hardest one to move with a single trade.
 */
async function primaryPool(): Promise<string | null> {
  const market = await loadMarket();
  const deepest = market?.overview.pairs[0]?.pairAddress;
  if (deepest) return deepest;

  // DexScreener down: fall back to whatever GeckoTerminal considers the top pool.
  const meta = await loadTokenMeta();
  return meta?.topPoolAddress ?? null;
}

export async function loadPriceSeries(range: ChartRange): Promise<PriceSeries | null> {
  return cached(
    `dash:chart:${range}:v1`,
    CHART_TTL_SEC[range],
    async () => {
      const pool = await primaryPool();
      if (!pool) return null;

      try {
        return await getPriceSeries(pool, range);
      } catch (error) {
        console.error(`[market] OHLCV ${range} failed:`, error);
        return null;
      }
    },
    { staleTtlSec: STALE.chart }
  );
}

export async function loadTrades(): Promise<TradeEvent[] | null> {
  return cached(
    'dash:trades:v1',
    TRADES_TTL_SEC,
    async () => {
      const pool = await primaryPool();
      if (!pool) return null;

      try {
        const trades = await getRecentTrades(pool);
        return trades.length > 0 ? trades : null;
      } catch (error) {
        console.error('[market] trade feed failed:', error);
        return null;
      }
    },
    { staleTtlSec: STALE.trades }
  );
}

/**
 * Slippage ladder from the router. Depends on spot price and decimals, so it
 * runs after the market and supply loads rather than alongside them.
 */
async function loadDepth(): Promise<DepthLadder | null> {
  const [market, supply] = await Promise.all([loadMarket(), loadSupply()]);
  const priceUsd = market?.overview.priceUsd ?? 0;
  if (!priceUsd) return null;

  return cached(
    'dash:depth:v1',
    DEPTH_TTL_SEC,
    async () => {
      try {
        return await getDepthLadder(ANSEM_MINT, supply?.decimals ?? DEFAULT_DECIMALS, priceUsd);
      } catch (error) {
        console.error('[market] depth ladder failed:', error);
        return null;
      }
    },
    { staleTtlSec: STALE.depth }
  );
}

async function loadRanking(): Promise<MarketStats | null> {
  const meta = await loadTokenMeta();
  if (!meta?.coingeckoId) return null;

  return cached(
    `dash:rank:${meta.coingeckoId}:v1`,
    RANKING_TTL_SEC,
    async () => {
      try {
        return await getMarketStats(meta.coingeckoId as string);
      } catch (error) {
        console.error('[market] CoinGecko stats failed:', error);
        return null;
      }
    },
    { staleTtlSec: STALE.ranking }
  );
}

export async function loadHolderIndex(): Promise<HolderIndex | null> {
  if (!holdersAvailable()) return null;

  return cached(
    // v2: the payload gained coverage fields when the walk stopped truncating.
    // Bumping the key stops the new code being handed a cached v1 object that
    // lacks them, which would render as "covers 0% of supply".
    'dash:holders:v2',
    HOLDERS_TTL_SEC,
    async () => {
      const [market, supply] = await Promise.all([loadMarket(), loadSupply()]);
      if (!supply) return null;
      const pools = market ? poolAddresses(market) : new Set<string>();

      try {
        return await indexHolders(ANSEM_MINT, supply.totalSupply, supply.decimals, entityMap(pools));
      } catch (error) {
        console.error('[market] holder index failed:', error);
        return null;
      }
    },
    { staleTtlSec: STALE.holders, serveStaleWhileRevalidating: true }
  );
}

async function loadAuthorities(): Promise<{
  mintAuthority: string | null;
  freezeAuthority: string | null;
} | null> {
  return cached(
    'dash:authorities:v1',
    SECURITY_TTL_SEC,
    async () => {
      try {
        return await getMintAuthorities(ANSEM_MINT);
      } catch (error) {
        console.error('[market] mint authority read failed:', error);
        return null;
      }
    },
    { staleTtlSec: STALE.authorities }
  );
}

/**
 * Largest *individual* holder as a share of supply. AMM pools and program
 * accounts are excluded — a deep pool holding 20% is liquidity, not a whale,
 * and counting it would misreport concentration risk.
 */
function largestWalletPct(holderIndex: HolderIndex | null): number | null {
  const first = holderIndex?.holders.find((h) => h.entity === null);
  return first ? first.percentSupply : null;
}

/**
 * Build a long-window stat from the sources that can actually serve one.
 * Trade counts stay null: no free provider breaks buys/sells out beyond 24h,
 * and a zero there would read as "nobody traded" rather than "not measured".
 */
function longWindow(
  changePct: number | null,
  series: PriceSeries | null
): WindowStats | null {
  if (changePct === null && !series) return null;

  return {
    buys: null,
    sells: null,
    volumeUsd: series?.volumeUsd ?? 0,
    priceChangePct: changePct ?? series?.changePct ?? 0
  };
}

/**
 * Look one wallet up in the holder index.
 *
 * Deliberately server-side: ranking against 89k holders needs the whole list,
 * and shipping that to the browser to answer one question would cost megabytes
 * per visitor. The caller sends an address and gets back a single row.
 */
export async function loadWalletRank(
  wallet: string,
  fallbackBalance: number | null
): Promise<WalletRank | null> {
  const [index, market] = await Promise.all([loadHolderIndex(), loadMarket()]);
  if (!index) return null;

  return buildWalletRank(wallet, index, market?.overview.priceUsd ?? 0, fallbackBalance);
}

export async function loadSnapshot(): Promise<DashboardSnapshot> {
  const [
    market,
    supply,
    holderIndex,
    ranking,
    authorities,
    meta,
    series7d,
    series30d,
    seriesAll,
    depth
  ] = await Promise.all([
    loadMarket(),
    loadSupply(),
    loadHolderIndex(),
    loadRanking(),
    loadAuthorities(),
    loadTokenMeta(),
    loadPriceSeries('7d'),
    loadPriceSeries('30d'),
    loadPriceSeries('all'),
    loadDepth()
  ]);

  // Daily closes are the right granularity for volatility and drawdown, and
  // the 'all' series is already cached for the chart's ALL range.
  const risk: RiskProfile | null = seriesAll ? buildRiskProfile(seriesAll.candles) : null;

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
  if (!ranking) {
    notes.push('Rank and all-time-high context are unavailable — CoinGecko did not respond.');
  }
  notes.push(
    'Buy/sell counts are published up to 24h only. The 7d and 30d rows carry price and volume from OHLCV history, with trade counts left blank rather than estimated.'
  );

  const security: SecurityInfo | null = authorities
    ? {
        mintAuthority: authorities.mintAuthority,
        freezeAuthority: authorities.freezeAuthority,
        mintRevoked: authorities.mintAuthority === null,
        freezeRevoked: authorities.freezeAuthority === null,
        graduated: meta?.graduated ?? null,
        graduatedAt: meta?.graduatedAt ?? null,
        topHolderPct: largestWalletPct(holderIndex),
        liquidityUsd: market?.overview.liquidityUsd ?? 0
      }
    : null;

  const marketStats: MarketStats | null = ranking
    ? {
        ...ranking,
        volume7dUsd: series7d?.volumeUsd ?? null,
        volume30dUsd: series30d?.volumeUsd ?? null
      }
    : null;

  const status: ProviderStatus = {
    dexscreener: market ? 'live' : 'unavailable',
    holders: holderIndex ? 'live' : 'unavailable',
    extendedWindows: series7d || ranking ? 'live' : 'unavailable',
    chart: series7d ? 'live' : 'unavailable',
    trades: 'live', // the tape loads client-side; its own panel reports failure
    depth: depth ? 'live' : 'unavailable',
    risk: risk ? 'live' : 'unavailable',
    cache: isRedisReady() ? 'shared' : 'instance',
    security: security ? 'live' : 'unavailable',
    ranking: ranking ? 'live' : 'unavailable',
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
    ? {
        ...market.activity,
        d7: longWindow(ranking?.change7dPct ?? null, series7d),
        d30: longWindow(ranking?.change30dPct ?? null, series30d)
      }
    : null;

  return {
    overview,
    activity,
    distribution: holderIndex?.distribution ?? null,
    totalHolders: holderIndex?.totalHolders ?? null,
    security,
    market: marketStats,
    depth,
    risk,
    status,
    updatedAt: Date.now()
  };
}

export { holdersAvailable };
export type {
  ActivityStats,
  Candle,
  WalletRank,
  DepthLadder,
  RiskProfile,
  ChartRange,
  DashboardSnapshot,
  Distribution,
  Holder,
  HoldersPage,
  MarketStats,
  PriceSeries,
  ProviderStatus,
  SecurityInfo,
  TokenOverview,
  TradeEvent
} from '$lib/dashboard/types';
