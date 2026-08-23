// Shared types for the dashboard market-data layer.

/** A data point we may or may not be able to source, depending on configuration. */
export type Availability = 'live' | 'unavailable';

export interface WindowStats {
  /** Null on windows whose source reports price and volume but not trade counts. */
  buys: number | null;
  sells: number | null;
  volumeUsd: number;
  priceChangePct: number;
}

/** Trading windows DexScreener exposes without an API key. */
export interface ActivityStats {
  m5: WindowStats;
  h1: WindowStats;
  h6: WindowStats;
  h24: WindowStats;
  /** Sourced from OHLCV history and cross-market stats; no per-trade counts. */
  d7: WindowStats | null;
  d30: WindowStats | null;
}

export interface PairInfo {
  dexId: string;
  pairAddress: string;
  url: string;
  quoteSymbol: string;
  liquidityUsd: number;
  volume24hUsd: number;
  labels: string[];
}

export interface TokenOverview {
  mint: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  priceUsd: number;
  priceNative: number;
  marketCapUsd: number;
  fdvUsd: number;
  liquidityUsd: number;
  totalSupply: number;
  circulatingSupply: number;
  decimals: number;
  pairCreatedAt: number | null;
  pairs: PairInfo[];
  socials: { type: string; url: string }[];
}

export interface Holder {
  rank: number;
  owner: string;
  balance: number;
  percentSupply: number;
  /** Set when the address is a known AMM pool / program account rather than a person. */
  entity: string | null;
  tierId: string;
}

export interface HoldersPage {
  holders: Holder[];
  page: number;
  pageSize: number;
  /** Number of holders we were able to index (capped by MAX_HOLDERS). */
  indexed: number;
  totalHolders: number;
  hasMore: boolean;
}

export interface Distribution {
  top10Pct: number;
  top50Pct: number;
  top100Pct: number;
  /** Gini coefficient over indexed holders: 0 = perfectly even, 1 = fully concentrated. */
  gini: number;
  tierCounts: { tierId: string; count: number; supplyPct: number }[];
  /** True when the token-account walk reached the end rather than the page cap. */
  complete: boolean;
  /** Share of total supply held by the accounts actually enumerated. */
  coveragePct: number;
  /** Rows kept for the leaderboard (capped). */
  rankedCount: number;
  /** Unique owners found across the whole walk. */
  ownerCount: number;
}

/** One OHLCV bar. Short keys — a 500-bar series crosses the wire on every load. */
export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export type ChartRange = '1h' | '24h' | '7d' | '30d' | 'all';

export interface PriceSeries {
  range: ChartRange;
  candles: Candle[];
  /** Close-to-close change across the window, in percent. */
  changePct: number;
  high: number;
  low: number;
  volumeUsd: number;
}

export interface TradeEvent {
  kind: 'buy' | 'sell';
  amountUsd: number;
  tokenAmount: number;
  priceUsd: number;
  wallet: string;
  txHash: string;
  timestamp: number;
}

/**
 * Contract-level safety signals. Every field is read from the chain or from a
 * provider — nothing here is inferred, so an unknown stays null rather than
 * defaulting to "safe".
 */
export interface SecurityInfo {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  mintRevoked: boolean;
  freezeRevoked: boolean;
  /** pump.fun bonding-curve completion, when the token launched there. */
  graduated: boolean | null;
  graduatedAt: number | null;
  topHolderPct: number | null;
  liquidityUsd: number;
}

/** Cross-market context that DexScreener does not carry. */
export interface MarketStats {
  rank: number | null;
  ath: number | null;
  athDate: number | null;
  athChangePct: number | null;
  atl: number | null;
  atlDate: number | null;
  high24h: number | null;
  low24h: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  volume7dUsd: number | null;
  volume30dUsd: number | null;
}

/** One rung of the depth ladder: what a trade of this size costs in slippage. */
export interface DepthStep {
  usd: number;
  /** Null when the router could not fill this size at all. */
  impactPct: number | null;
}

export interface DepthLadder {
  buys: DepthStep[];
  sells: DepthStep[];
  maxRoutableUsd: number | null;
}

/** Standard risk measures over the daily close history. */
export interface RiskProfile {
  /** Annualised standard deviation of daily log returns, in percent. */
  volatilityPct: number;
  /** Worst peak-to-trough inside the measured window. */
  maxDrawdownPct: number;
  /** Worst peak-to-trough across the token's whole history. */
  maxDrawdownAllPct: number;
  currentDrawdownPct: number;
  bestDayPct: number;
  worstDayPct: number;
  /** Share of days that closed green, in percent. */
  upDayRatio: number;
  /** Days in the measured window. */
  days: number;
  /** Days of price history available in total. */
  historyDays: number;
}

export interface ProviderStatus {
  dexscreener: Availability;
  holders: Availability;
  extendedWindows: Availability;
  chart: Availability;
  trades: Availability;
  depth: Availability;
  risk: Availability;
  /**
   * 'shared' when Upstash Redis is wired up and every serverless instance
   * reads one cache; 'instance' when each instance keeps its own, which means
   * cold starts rebuild expensive things like the holder walk from scratch.
   */
  cache: 'shared' | 'instance';
  security: Availability;
  ranking: Availability;
  /** Human-readable reason shown in the UI when something is unavailable. */
  notes: string[];
}

/** Full payload served by /api/dashboard/snapshot and the dashboard page load. */
export interface DashboardSnapshot {
  overview: TokenOverview | null;
  activity: ActivityStats | null;
  distribution: Distribution | null;
  totalHolders: number | null;
  security: SecurityInfo | null;
  market: MarketStats | null;
  depth: DepthLadder | null;
  risk: RiskProfile | null;
  status: ProviderStatus;
  updatedAt: number;
}
