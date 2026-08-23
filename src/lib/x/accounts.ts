// The two X accounts the project tracks.
//
// There is deliberately no embedded timeline and no in-app ranking here.
// Neither can be made to work without a paid X API tier:
//   - Timeline embeds are rate-limited (the syndication endpoint answers 429)
//     and, since 2026, only render for viewers already logged in to X.
//   - Search deep links (`from:`, `min_faves:`, `since:`) return a login wall
//     to anyone not signed in, so the "top posts" chips they powered were
//     dead ends for most visitors.
//   - Like, repost and view counts are not exposed without a paid key, and
//     impression counts are restricted to the account owner even then.
// A plain profile link is the one thing that reliably works, so that is what
// this panel offers rather than a broken feed.

export interface XAccount {
  handle: string;
  name: string;
  blurb: string;
  badge: string;
}

export const X_ACCOUNTS: XAccount[] = [
  {
    handle: 'blackbullsol',
    name: 'Black Bull',
    blurb: 'Official project account',
    badge: '🐂'
  },
  {
    handle: 'blknoiz06',
    name: 'Ansem',
    blurb: 'The man himself',
    badge: '👑'
  }
];
