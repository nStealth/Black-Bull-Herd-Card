// Outbound links shown in both footers.
//
// The marketing site and the dashboard style these very differently — the site
// is dark-only with hard-coded colours, the dashboard follows a light/dark
// theme — but the destinations are the same, so the list lives here and each
// footer supplies its own presentation.

export type SocialIconName =
  | 'globe'
  | 'coinmarketcap'
  | 'coingecko'
  | 'bullpen'
  | 'x'
  | 'github';

export interface SocialLink {
  href: string;
  label: string;
  icon: SocialIconName;
  /** Rendered with the gold accent treatment on the marketing site. */
  vip?: boolean;
}

export const OFFICIAL_LINKS: SocialLink[] = [
  { href: 'https://www.blackbullsol.com/', label: 'Official Website', icon: 'globe' },
  {
    href: 'https://coinmarketcap.com/de/currencies/the-black-bull/',
    label: 'CoinMarketCap',
    icon: 'coinmarketcap'
  },
  {
    href: 'https://www.coingecko.com/de/munze/the-black-bull',
    label: 'CoinGecko',
    icon: 'coingecko'
  },
  { href: 'https://app.bullpen.fi/', label: 'BullPen', icon: 'bullpen' },
  { href: 'https://x.com/blackbullsol', label: 'Black Bull on X', icon: 'x' },
  { href: 'https://x.com/blknoiz06', label: 'Ansem on X', icon: 'x', vip: true }
];

export const CREATOR_LINKS: SocialLink[] = [
  { href: 'https://github.com/nStealth', label: 'GitHub — nStealth', icon: 'github' },
  { href: 'https://x.com/nstealth666', label: 'X — nStealth', icon: 'x' }
];
