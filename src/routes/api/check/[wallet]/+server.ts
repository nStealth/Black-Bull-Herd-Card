// API: Wallet Check
// GET /api/check/[wallet]
// Fetches ANSEM balance, computes tier, saves to DB

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTier, getRankTier } from '$lib/tiers';
import { getAnsemBalance, isValidPublicKey } from '$lib/solana';
import { getEntry, saveEntry } from '$lib/db';
import { redis, isRedisReady } from '$lib/redis';
import { clientKey, rateLimit } from '$lib/server/rateLimit';

// Every miss writes a row, so an unthrottled caller could grow the table with
// arbitrary well-formed addresses.
const RATE_LIMIT = 30;
const RATE_WINDOW_SEC = 60;

const CACHE_TTL_SEC = 30; // 30 seconds

function cacheKey(wallet: string): string {
  return `cache:wallet:${wallet}`;
}

async function getCached(wallet: string): Promise<unknown | null> {
  if (!redis || !isRedisReady()) return null;
  try {
    const val = await redis.get<string>(cacheKey(wallet));
    if (!val) return null;
    return JSON.parse(val);
  } catch {
    return null;
  }
}

async function setCached(wallet: string, data: unknown): Promise<void> {
  if (!redis || !isRedisReady()) return;
  try {
    await redis.setex(cacheKey(wallet), CACHE_TTL_SEC, JSON.stringify(data));
  } catch {
    // silently fail — cache is best-effort
  }
}

export const GET: RequestHandler = async ({ params, request }) => {
  const { wallet } = params;

  // Validate wallet format, including the base58 charset, before any
  // cache lookup, RPC call or database write.
  if (!wallet || !isValidPublicKey(wallet)) {
    return json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  // Check distributed Redis cache first — cache hits are not rate limited.
  const cached = await getCached(wallet);
  if (cached) {
    return json(cached);
  }

  const limit = await rateLimit(`check:${clientKey(request)}`, RATE_LIMIT, RATE_WINDOW_SEC);
  if (!limit.allowed) {
    return json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSec) } }
    );
  }

  try {
    // Fetch balance from Solana
    const balanceResult = await getAnsemBalance(wallet);
    
    if (!balanceResult.success) {
      return json({ 
        error: balanceResult.error || 'Failed to fetch balance',
        wallet 
      }, { status: 500 });
    }
    
    const balance = balanceResult.balance;
    
    // Calculate tier
    const { tier, percentSupply } = getTier(balance);
    const rank = getRankTier(percentSupply);
    
    // Check if entry exists and preserve tweet URL
    const existingEntry = await getEntry(wallet);
    
    // Save/update entry in database
    const entry = await saveEntry({
      wallet,
      balance,
      tier: tier.id,
      percentSupply,
      rank
    });
    
    const response = {
      wallet,
      balance,
      tier: tier.id,
      tierName: tier.name,
      percent: percentSupply,
      rank,
      eligible: balance >= tier.minBalance,
      color: tier.color,
      hasSubmitted: !!existingEntry?.tweetUrl || !!entry.tweetUrl
    };
    
    // Cache the result in Redis (shared across all instances)
    await setCached(wallet, response);

    return json(response);
  } catch (error) {
    console.error('Wallet check error:', error);
    return json({ 
      error: 'Internal server error',
      wallet 
    }, { status: 500 });
  }
};
