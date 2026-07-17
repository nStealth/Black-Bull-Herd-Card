// Database connection and operations
// NeonDB Postgres with Drizzle ORM + In-memory Map fallback

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, isNotNull } from 'drizzle-orm';
import { herdEntries, type HerdEntry, type NewHerdEntry } from './schema';

// In-memory fallback for development without DB
const memoryStore = new Map<string, HerdEntry>();

let db: ReturnType<typeof drizzle> | null = null;
let useMemoryFallback = false;

// Initialize database connection
function initDb() {
  if (typeof window !== 'undefined') {
    // Client-side: use memory fallback
    useMemoryFallback = true;
    return;
  }

  // Server-side: try to connect to NeonDB
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.warn('DATABASE_URL not set, using in-memory fallback');
      useMemoryFallback = true;
      return;
    }

    const client = postgres(databaseUrl, {
      ssl: 'require',
      max: 1 // Single connection for serverless
    });
    
    db = drizzle(client);
  } catch (error) {
    console.error('Failed to connect to database:', error);
    useMemoryFallback = true;
  }
}

// Initialize on module load
if (typeof process !== 'undefined' && process.env) {
  initDb();
}

export { db, useMemoryFallback };

// Get database instance
export function getDb() {
  if (useMemoryFallback || !db) {
    return null;
  }
  return db;
}

// Get an entry by wallet address
export async function getEntry(wallet: string): Promise<HerdEntry | null> {
  if (useMemoryFallback) {
    return memoryStore.get(wallet) || null;
  }

  try {
    const result = await db!.select().from(herdEntries).where(eq(herdEntries.wallet, wallet)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error getting entry:', error);
    return memoryStore.get(wallet) || null;
  }
}

// Save or update an entry
export async function saveEntry(data: {
  wallet: string;
  balance: number;
  tier: string;
  percentSupply: number;
  rank?: string;
}): Promise<HerdEntry> {
  const entry: HerdEntry = {
    wallet: data.wallet,
    balance: data.balance,
    tier: data.tier,
    percentSupply: data.percentSupply,
    rank: data.rank || null,
    tweetUrl: null,
    verified: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (useMemoryFallback) {
    const existing = memoryStore.get(data.wallet);
    if (existing) {
      // Preserve existing tweet URL
      entry.tweetUrl = existing.tweetUrl;
      entry.verified = existing.verified;
      entry.createdAt = existing.createdAt;
    }
    entry.updatedAt = new Date();
    memoryStore.set(data.wallet, entry);
    return entry;
  }

  try {
    // Upsert: insert or update on conflict
    const result = await db!.insert(herdEntries).values({
      wallet: data.wallet,
      balance: data.balance,
      tier: data.tier,
      percentSupply: data.percentSupply,
      rank: data.rank
    }).onConflictDoUpdate({
      target: herdEntries.wallet,
      set: {
        balance: data.balance,
        tier: data.tier,
        percentSupply: data.percentSupply,
        rank: data.rank,
        updatedAt: new Date()
      }
    }).returning();
    
    return result[0] || entry;
  } catch (error) {
    console.error('Error saving entry:', error);
    // Fallback to memory
    const existing = memoryStore.get(data.wallet);
    if (existing) {
      entry.tweetUrl = existing.tweetUrl;
      entry.verified = existing.verified;
      entry.createdAt = existing.createdAt;
    }
    entry.updatedAt = new Date();
    memoryStore.set(data.wallet, entry);
    return entry;
  }
}

// Save tweet URL for a wallet
export async function saveTweet(wallet: string, tweetUrl: string): Promise<{ success: boolean; error?: string }> {
  if (useMemoryFallback) {
    const existing = memoryStore.get(wallet);
    if (!existing) {
      return { success: false, error: 'wallet_not_found' };
    }
    if (existing.tweetUrl) {
      return { success: false, error: 'already_submitted' };
    }
    existing.tweetUrl = tweetUrl;
    existing.updatedAt = new Date();
    memoryStore.set(wallet, existing);
    return { success: true };
  }

  try {
    // Check if wallet exists
    const existing = await db!.select().from(herdEntries).where(eq(herdEntries.wallet, wallet)).limit(1);
    
    if (!existing[0]) {
      return { success: false, error: 'wallet_not_found' };
    }
    
    if (existing[0].tweetUrl) {
      return { success: false, error: 'already_submitted' };
    }

    // Update tweet URL
    await db!.update(herdEntries)
      .set({ tweetUrl, updatedAt: new Date() })
      .where(eq(herdEntries.wallet, wallet));
    
    return { success: true };
  } catch (error) {
    console.error('Error saving tweet:', error);
    return { success: false, error: 'database_error' };
  }
}

// Get total count of entries with tweet URLs (for 20k cap)
export async function getSubmittedCount(): Promise<number> {
  if (useMemoryFallback) {
    let count = 0;
    memoryStore.forEach(entry => {
      if (entry.tweetUrl) count++;
    });
    return count;
  }

  try {
    const result = await db!.select().from(herdEntries).where(isNotNull(herdEntries.tweetUrl));
    return result.length;
  } catch {
    return 0;
  }
}
