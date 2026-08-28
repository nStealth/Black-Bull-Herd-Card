/**
 * Where each panel's numbers actually come from.
 *
 * Kept in one file so a provider swap is a single edit, and so the strings on
 * the panels cannot drift away from the ones in the page footer. Every entry
 * names a provider this codebase really calls — see src/lib/server/market.
 */
export const SOURCES = {
  /** api.dexscreener.com — aggregated over every $ANSEM pair. */
  dexscreener: 'DexScreener, aggregated across every $ANSEM pool',
  /** api.geckoterminal.com OHLCV for the deepest pool. */
  candles: 'GeckoTerminal OHLCV for the deepest pool',
  /** api.geckoterminal.com trade tape for the deepest pool. */
  tape: 'GeckoTerminal trade tape for the deepest pool',
  /** api.coingecko.com /coins/markets and /coins/{id}. */
  coingecko: 'CoinGecko',
  /** Helius DAS getTokenAccounts walk. */
  holders: 'Helius token-account index',
  /** Solana JSON-RPC against mainnet. */
  chain: 'Solana mainnet RPC',
  /** lite-api.jup.ag quote endpoint, live per request. */
  jupiter: 'Jupiter router, quoted live'
} as const;

/** Panels whose figures are computed here from another panel's raw feed. */
export const DERIVED = {
  fromCandlesDaily: `Derived from daily closes — ${SOURCES.candles}`,
  fromCandlesHourly: `Derived from hourly candles — ${SOURCES.candles}`,
  fromActivity: `Derived from 24h activity — ${SOURCES.dexscreener}`,
  fromTapeAndHolders: `${SOURCES.tape}, matched against the ${SOURCES.holders}`
} as const;
