// Best-effort cache for dashboard data.
// Uses Upstash Redis when configured so all Vercel instances share one cache,
// and falls back to a per-instance in-memory map otherwise.

import { redis, isRedisReady } from '$lib/redis';

interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

const memory = new Map<string, MemoryEntry>();

function readMemory<T>(key: string): T | null {
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return hit.value as T;
}

function writeMemory(key: string, value: unknown, ttlSec: number): void {
  memory.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
  // Keep the map from growing without bound on long-lived instances.
  if (memory.size > 64) {
    const now = Date.now();
    for (const [k, v] of memory) {
      if (v.expiresAt < now) memory.delete(k);
    }
  }
}

/**
 * Run `fetcher` unless a fresh cached value exists.
 *
 * Cache *failures* never propagate — a missing cache is better than a failed
 * request. Failed *fetches* are never stored: `null` and `undefined` are
 * treated as "no result", so one flaky upstream call cannot pin a broken panel
 * in place for the whole TTL.
 */
export async function cached<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const local = readMemory<T>(key);
  if (local !== null) return local;

  if (redis && isRedisReady()) {
    try {
      const raw = await redis.get<string>(key);
      if (raw) {
        const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
        writeMemory(key, parsed, Math.min(ttlSec, 30));
        return parsed;
      }
    } catch {
      // fall through to a live fetch
    }
  }

  const fresh = await fetcher();
  if (fresh === null || fresh === undefined) return fresh;

  writeMemory(key, fresh, Math.min(ttlSec, 30));

  if (redis && isRedisReady()) {
    try {
      await redis.setex(key, ttlSec, JSON.stringify(fresh));
    } catch {
      // best-effort only
    }
  }

  return fresh;
}
