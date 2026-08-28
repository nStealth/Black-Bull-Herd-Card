// Database connection and operations
// NeonDB Postgres with Drizzle ORM + In-memory Map fallback

import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, isNotNull } from 'drizzle-orm';
import { herdEntries, watchedWallets, type HerdEntry, type NewHerdEntry } from './schema';
import { sql } from 'drizzle-orm';

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
    // $env/dynamic/private, not process.env: the latter does not read .env in
    // dev, so a correctly configured local database would silently fall back
    // to the in-memory store and look broken.
    const databaseUrl = env.DATABASE_URL;
    
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

/**
 * Record that somebody asked to follow a wallet.
 *
 * Fire-and-forget from the caller's point of view: a visitor saving an address
 * to their own list must not fail because the database is unreachable, so this
 * reports success or failure and never throws.
 *
 * Nothing about the visitor is written — see the table comment in schema.ts.
 */
export async function saveWatchedWallet(entry: {
  wallet: string;
  rank: number | null;
  balance: number;
  percentSupply: number;
  tierId: string | null;
}): Promise<{ stored: boolean }> {
  if (useMemoryFallback || !db) return { stored: false };

  try {
    await db
      .insert(watchedWallets)
      .values({
        wallet: entry.wallet,
        rank: entry.rank,
        balance: entry.balance,
        percentSupply: entry.percentSupply,
        tierId: entry.tierId
      })
      .onConflictDoUpdate({
        target: watchedWallets.wallet,
        set: {
          rank: entry.rank,
          balance: entry.balance,
          percentSupply: entry.percentSupply,
          tierId: entry.tierId,
          saves: sql`${watchedWallets.saves} + 1`,
          lastSavedAt: new Date()
        }
      });
    return { stored: true };
  } catch (error) {
    console.error('Error saving watched wallet:', error);
    return { stored: false };
  }
}

/** How many distinct wallets have been saved. Null when there is no database. */
export async function watchedWalletCount(): Promise<number | null> {
  if (useMemoryFallback || !db) return null;
  try {
    const rows = await db.select({ n: sql<number>`count(*)::int` }).from(watchedWallets);
    return rows[0]?.n ?? 0;
  } catch {
    return null;
  }
}
