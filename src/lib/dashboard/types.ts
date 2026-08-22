// Shared types for the dashboard market-data layer.

/** A data point we may or may not be able to source, depending on configuration. */
export type Availability = 'live' | 'unavailable';

export interface WindowStats {
  buys: number;
  sells: number;
  volumeUsd: number;
  priceChangePct: number;
}

/** Trading windows DexScreener exposes without an API key. */
export interface ActivityStats {
  m5: WindowStats;
  h1: WindowStats;
  h6: WindowStats;
  h24: WindowStats;
  /** Longer windows need an indexed provider; null until one is configured. */
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
}

export interface ProviderStatus {
  dexscreener: Availability;
  holders: Availability;
  extendedWindows: Availability;
  /** Human-readable reason shown in the UI when something is unavailable. */
  notes: string[];
}

/** Full payload served by /api/dashboard/snapshot and the dashboard page load. */
export interface DashboardSnapshot {
  overview: TokenOverview | null;
  activity: ActivityStats | null;
  distribution: Distribution | null;
  totalHolders: number | null;
  status: ProviderStatus;
  updatedAt: number;
}
