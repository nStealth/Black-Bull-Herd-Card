// Sitemap.
//
// Generated rather than static so the route list cannot drift from the app —
// the previous robots.txt pointed at a sitemap on a domain this site does not
// even use, which is the failure mode a hand-maintained file invites.

import type { RequestHandler } from './$types';

const SITE = 'https://ansemherd.online';

interface Entry {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  priority: string;
}

const PAGES: Entry[] = [
  // The dashboard is the live product and the page worth ranking.
  { path: '/dashboard', changefreq: 'hourly', priority: '1.0' },
  { path: '/dashboard/docs', changefreq: 'weekly', priority: '0.8' },
  { path: '/dashboard/about', changefreq: 'weekly', priority: '0.7' },
  { path: '/dashboard/api', changefreq: 'weekly', priority: '0.7' },
  { path: '/', changefreq: 'monthly', priority: '0.5' },
  { path: '/rules', changefreq: 'monthly', priority: '0.3' }
];

export const GET: RequestHandler = async ({ setHeaders }) => {
  const today = new Date().toISOString().slice(0, 10);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(
  (p) => `  <url>
    <loc>${SITE}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
).join('\n')}
</urlset>
`;

  setHeaders({
    'content-type': 'application/xml',
    'cache-control': 'public, max-age=3600'
  });

  return new Response(body);
};
