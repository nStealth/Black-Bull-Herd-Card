// API: Tweet Submit
// POST /api/submit
// Validates tweet URL and saves to database

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEntry, saveTweet, getSubmittedCount } from '$lib/db';
import { CAMPAIGN_CLOSED } from '$lib/campaign';
import { clientKey, rateLimit } from '$lib/server/rateLimit';

const RATE_LIMIT = 10;
const RATE_WINDOW_SEC = 60;

// Validate Twitter/X URL format
function isValidTweetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    
    // Must be twitter.com or x.com
    if (!['twitter.com', 'x.com'].includes(hostname)) {
      return false;
    }
    
    // Must have username and tweet ID
    // Format: /username/status/123456789
    if (pathParts.length < 3 || pathParts[0] === 'i' || pathParts[1] !== 'status') {
      return false;
    }
    
    // Tweet ID must be numeric
    const tweetId = pathParts[2];
    if (!/^\d+$/.test(tweetId)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export const POST: RequestHandler = async ({ request }) => {
  // Closed means closed, and the server is where that has to be enforced —
  // hiding the button only stops people who use the button.
  if (CAMPAIGN_CLOSED) {
    return json({ ok: false, reason: 'campaign_closed' }, { status: 410 });
  }

  try {
    const limit = await rateLimit(`submit:${clientKey(request)}`, RATE_LIMIT, RATE_WINDOW_SEC);
    if (!limit.allowed) {
      return json(
        { ok: false, reason: 'rate_limited' },
        { status: 429, headers: { 'retry-after': String(limit.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const { wallet, tweetUrl } = body;
    
    // Validate required fields
    if (!wallet || typeof wallet !== 'string') {
      return json({ ok: false, reason: 'invalid_request' }, { status: 400 });
    }
    
    if (!tweetUrl || typeof tweetUrl !== 'string') {
      return json({ ok: false, reason: 'invalid_request' }, { status: 400 });
    }
    
    // Validate wallet format
    if (wallet.length < 32 || wallet.length > 44) {
      return json({ ok: false, reason: 'invalid_wallet' }, { status: 400 });
    }
    
    // Validate tweet URL
    if (!isValidTweetUrl(tweetUrl)) {
      return json({ ok: false, reason: 'invalid_url' }, { status: 400 });
    }
    
    // Check wallet exists in our system
    const entry = await getEntry(wallet);
    if (!entry) {
      return json({ ok: false, reason: 'wallet_not_found' }, { status: 404 });
    }
    
    // Check eligibility (must have balance >= 1)
    if (entry.balance < 1) {
      return json({ ok: false, reason: 'not_eligible' }, { status: 403 });
    }
    
    // Check 20K cap
    const submittedCount = await getSubmittedCount();
    if (submittedCount >= 20000) {
      return json({ ok: false, reason: 'cap_reached' }, { status: 403 });
    }
    
    // Check if already submitted
    if (entry.tweetUrl) {
      return json({ ok: false, reason: 'already_submitted' }, { status: 409 });
    }
    
    // Save tweet URL
    const result = await saveTweet(wallet, tweetUrl);
    
    if (!result.success) {
      if (result.error === 'already_submitted') {
        return json({ ok: false, reason: 'already_submitted' }, { status: 409 });
      }
      if (result.error === 'wallet_not_found') {
        return json({ ok: false, reason: 'wallet_not_found' }, { status: 404 });
      }
      return json({ ok: false, reason: 'save_failed' }, { status: 500 });
    }
    
    return json({ ok: true });
  } catch (error) {
    console.error('Submit error:', error);
    return json({ ok: false, reason: 'server_error' }, { status: 500 });
  }
};
