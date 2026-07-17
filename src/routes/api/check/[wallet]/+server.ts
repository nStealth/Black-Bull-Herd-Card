// API: Wallet Check
// GET /api/check/[wallet]
// Fetches ANSEM balance, computes tier, saves to DB

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAnsemBalance } from '$lib/solana';
import { getTier, getRankTier } from '$lib/tiers';
import { getEntry, saveEntry } from '$lib/db';
import { redis, isRedisReady } from '$lib/redis';

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

export const GET: RequestHandler = async ({ params }) => {
  const { wallet } = params;

  // Validate wallet format
  if (!wallet || wallet.length < 32 || wallet.length > 44) {
    return json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  // Check distributed Redis cache first
  const cached = await getCached(wallet);
  if (cached) {
    return json(cached);
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
