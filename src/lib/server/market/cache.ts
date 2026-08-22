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
  if (memory.size > 128) {
    const now = Date.now();
    for (const [k, v] of memory) {
      if (v.expiresAt < now) memory.delete(k);
    }
  }
}

async function readShared<T>(key: string): Promise<T | null> {
  if (!redis || !isRedisReady()) return null;
  try {
    const raw = await redis.get<string>(key);
    if (!raw) return null;
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) as T;
  } catch {
    return null;
  }
}

async function writeShared(key: string, value: unknown, ttlSec: number): Promise<void> {
  if (!redis || !isRedisReady()) return;
  try {
    await redis.setex(key, ttlSec, JSON.stringify(value));
  } catch {
    // best-effort only
  }
}

interface CacheOptions {
  /**
   * How long a value stays usable as an emergency fallback after its normal TTL
   * expires. Set this for providers that rate-limit: a 429 then serves the last
   * good payload instead of blanking the panel.
   */
  staleTtlSec?: number;
}

const staleKey = (key: string) => `${key}:stale`;

/**
 * Fetches currently in flight, keyed by cache key.
 *
 * Without this, concurrent misses for the same key each hit the provider: the
 * page load and the snapshot endpoint both call loadSnapshot(), and a cold
 * cache turned that into duplicate OHLCV requests that burned the free tier's
 * per-minute budget and 429'd. Callers that arrive during a fetch now await the
 * one already running.
 */
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Run `fetcher` unless a fresh cached value exists.
 *
 * Cache *failures* never propagate — a missing cache is better than a failed
 * request. Failed *fetches* are never stored fresh: `null` and `undefined` are
 * treated as "no result", so one flaky upstream call cannot pin a broken panel
 * in place for the whole TTL.
 *
 * With `staleTtlSec`, the last successful payload is kept under a separate key
 * and returned when a refresh fails. A slightly old candle is worth far more to
 * someone watching the tape than an empty card, so long as the page keeps
 * showing when it last synced — which the header does.
 */
export async function cached<T>(
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const local = readMemory<T>(key);
  if (local !== null) return local;

  const shared = await readShared<T>(key);
  if (shared !== null) {
    writeMemory(key, shared, Math.min(ttlSec, 30));
    return shared;
  }

  let fresh: T;
  try {
    const running = inFlight.get(key) as Promise<T> | undefined;
    if (running) {
      fresh = await running;
    } else {
      const run = fetcher();
      inFlight.set(key, run);
      try {
        fresh = await run;
      } finally {
        inFlight.delete(key);
      }
    }
  } catch {
    // A throwing provider is the same as an empty one as far as callers care;
    // the provider modules already log the cause.
    fresh = null as T;
  }

  if (fresh === null || fresh === undefined) {
    if (options.staleTtlSec) {
      const stale =
        readMemory<T>(staleKey(key)) ?? (await readShared<T>(staleKey(key)));
      if (stale !== null && stale !== undefined) return stale;
    }
    return fresh;
  }

  writeMemory(key, fresh, Math.min(ttlSec, 30));
  await writeShared(key, fresh, ttlSec);

  if (options.staleTtlSec) {
    writeMemory(staleKey(key), fresh, options.staleTtlSec);
    await writeShared(staleKey(key), fresh, options.staleTtlSec);
  }

  return fresh;
}
