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

/** Where a single wallet sits in the holder index. */
export interface WalletRank {
  wallet: string;
  balance: number;
  valueUsd: number;
  percentSupply: number;
  tierId: string;
  tierName: string;
  tierColor: string;
  /**
   * Position among all holders, best first. Null when the wallet falls outside
   * the ranked slice — everyone below it holds dust, so a number there would be
   * precise about something meaningless.
   */
  rank: number | null;
  /** Share of holders this wallet is ahead of, in percent. Null without a rank. */
  percentile: number | null;
  /** Holders the index knows about, for context next to the rank. */
  totalHolders: number;
  /** Depth of the ranked slice, so the UI can explain an absent rank. */
  rankedCount: number;
  /** Tokens still needed for the next tier, and its name. Null at the top tier. */
  toNextTier: { tokens: number; tierName: string; tierColor: string } | null;
  /** True when this address is a known AMM pool rather than someone's wallet. */
  isPool: boolean;
  poolLabel: string | null;
}

/** Same-period move of the chain this token trades on, for comparison. */
export interface Benchmark {
  symbol: string;
  name: string;
  change7dPct: number | null;
  change30dPct: number | null;
}

/** How hard the token is trading right now, relative to its own baseline. */
export interface MarketPulse {
  /** Current hour's volume divided by the 24h average hour. 1 = normal. */
  volumePace: number | null;
  hourVolumeUsd: number;
  dayVolumeUsd: number;
  buyShareNow: number | null;
  buyShare6h: number | null;
  buyShareDay: number | null;
  /** Percentage points the buy share has moved versus the 24h figure. */
  buyShareShift: number | null;
  /** 24h volume as a multiple of pooled liquidity. */
  liquidityTurnover: number | null;
  /** 24h volume as a fraction of market cap. */
  marketCapTurnover: number | null;
}

/** Average volume per UTC hour, folded from a week of hourly candles. */
export interface TradingRhythm {
  /** 24 entries, index = UTC hour. */
  hours: number[];
  peakHourUtc: number;
  quietHourUtc: number;
  peakVolumeUsd: number;
  daysCovered: number;
}

/** One wallet's net position change across the tape window. */
export interface WalletFlow {
  wallet: string;
  /** Bought minus sold, in USD. Positive means accumulating. */
  netUsd: number;
  boughtUsd: number;
  soldUsd: number;
  trades: number;
  /** Position in the holder index, when the wallet appears in it. */
  rank: number | null;
  /** Set when the address is a known pool rather than someone's wallet. */
  entity: string | null;
}

export interface TradeFlow {
  accumulators: WalletFlow[];
  distributors: WalletFlow[];
  netUsd: number;
  buyVolumeUsd: number;
  sellVolumeUsd: number;
  uniqueWallets: number;
  tradeCount: number;
  /** Minutes the analysed tape actually spans — not a day. */
  windowMinutes: number;
  /** Share of volume by trade size, so retail and whale flow can be told apart. */
  sizeSplit: { retailPct: number; midPct: number; whalePct: number };
}

/** One meme coin ANSEM is measured against. */
export interface PeerCoin {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  marketCapUsd: number;
  /** Reconstructed from all-time-high price and today's supply, so an upper bound. */
  athMarketCapUsd: number | null;
  priceUsd: number;
}

/**
 * Peer market caps alongside ANSEM's own, all on a circulating-supply basis so
 * the ratios between them mean something.
 */
export interface PeerComparison {
  peers: PeerCoin[];
  ansem: {
    priceUsd: number;
    marketCapUsd: number;
    circulatingSupply: number;
    athPriceUsd: number | null;
  };
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
  benchmark: Benchmark | null;
  pulse: MarketPulse | null;
  rhythm: TradingRhythm | null;
  flow: TradeFlow | null;
  peers: PeerComparison | null;
  status: ProviderStatus;
  updatedAt: number;
}
