// The two X accounts the project tracks, and the search queries offered for them.
//
// Ranking and keyword filtering cannot be done in-app: X exposes no like,
// repost or view counts without a paid API tier, and impression counts are
// restricted to the account owner even then. Rather than invent numbers, these
// build real X search queries and hand them to X, which does rank for real.

export interface XAccount {
  handle: string;
  name: string;
  blurb: string;
  badge: string;
  accent: string;
}

export const X_ACCOUNTS: XAccount[] = [
  {
    handle: 'blackbullsol',
    name: 'Black Bull',
    blurb: 'Official $ANSEM project account',
    badge: '🐂',
    accent: '#f59e0b'
  },
  {
    handle: 'blknoiz06',
    name: 'Ansem',
    blurb: 'The man himself',
    badge: '👑',
    accent: '#ffd700'
  }
];

export interface TimeWindow {
  key: string;
  label: string;
  days: number;
}

export const TIME_WINDOWS: TimeWindow[] = [
  { key: '1', label: '24h', days: 1 },
  { key: '7', label: '7d', days: 7 },
  { key: '30', label: '30d', days: 30 },
  { key: 'all', label: 'All', days: 0 }
];

/** `since:` clause for a rolling window, empty for all-time. */
function since(days: number): string {
  if (days <= 0) return '';
  const d = new Date(Date.now() - days * 86_400_000);
  return ` since:${d.toISOString().slice(0, 10)}`;
}

function searchUrl(query: string, sort: 'top' | 'live'): string {
  return `https://x.com/search?q=${encodeURIComponent(query)}&f=${sort}`;
}

export interface XFilter {
  key: string;
  label: string;
  hint: string;
  url: string;
}

export function buildFilters(handle: string, days: number): XFilter[] {
  const window = since(days);
  return [
    {
      key: 'top',
      label: 'Most liked',
      hint: 'ranked by X, 100+ likes',
      url: searchUrl(`(from:${handle}) min_faves:100${window}`, 'top')
    },
    {
      key: 'retweets',
      label: 'Most reposted',
      hint: '50+ reposts',
      url: searchUrl(`(from:${handle}) min_retweets:50${window}`, 'top')
    },
    {
      key: 'ansem',
      label: 'Mentions “ansem”',
      hint: 'keyword match',
      url: searchUrl(`(from:${handle}) ansem${window}`, 'top')
    },
    {
      key: 'media',
      label: 'Charts & media',
      hint: 'images and video',
      url: searchUrl(`(from:${handle}) filter:media${window}`, 'top')
    },
    {
      key: 'threads',
      label: 'Threads',
      hint: 'excludes replies',
      url: searchUrl(`(from:${handle}) -filter:replies${window}`, 'live')
    }
  ];
}
