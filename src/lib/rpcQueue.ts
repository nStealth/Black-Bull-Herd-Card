// Distributed RPC Request Queue via Upstash Redis
// Limits outgoing Helius RPC calls to ~10 req/s across ALL Vercel instances.
// Uses a Redis-based lock so every instance coordinates through the same Redis.

import { redis, isRedisReady } from './redis';

const MAX_RPS = 10;               // Helius free plan
const LOCK_TTL_MS = 100;          // 1000ms / 10 rps = 100ms between requests
const MAX_RETRIES = 3;
const BASE_RETRY_MS = 500;
const LOCK_KEY = 'rpc:lock';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isRateLimited(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  );
}

/**
 * Try to acquire a distributed lock via Redis.
 * Returns true if we got the lock, false if someone else holds it.
 */
async function acquireLock(): Promise<boolean> {
  if (!redis || !isRedisReady()) return true; // fallback: no lock = go ahead
  try {
    const now = Date.now().toString();
    const ok = await redis.set(LOCK_KEY, now, { nx: true, px: LOCK_TTL_MS });
    return ok === 'OK';
  } catch {
    // Redis is unreachable. Proceed unthrottled rather than stalling the queue;
    // the per-request retry logic still absorbs any 429s that result.
    return true;
  }
}

/**
 * Wait until we acquire the distributed lock, polling every 25ms.
 */
async function waitForLock(): Promise<void> {
  while (!(await acquireLock())) {
    await delay(25);
  }
}

interface QueuedTask<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  retries: number;
}

const localQueue: Array<QueuedTask<unknown>> = [];
let running = false;

async function runNext() {
  if (running) return;
  running = true;

  try {
    await drainQueue();
  } finally {
    // Without this, a throw from the Redis lock leaves `running` stuck at true
    // and every later rpcQueue() call hangs forever on this instance.
    running = false;
  }
}

async function drainQueue() {
  while (localQueue.length > 0) {
    // Distributed rate-limiting: wait for global lock
    await waitForLock();

    const task = localQueue.shift();
    if (!task) continue;

    let lastError: unknown;
    let success = false;

    try {
      const result = await task.execute();
      task.resolve(result);
      success = true;
    } catch (error) {
      lastError = error;
      if (isRateLimited(error) && task.retries < MAX_RETRIES) {
        task.retries += 1;
        const backoff = BASE_RETRY_MS * Math.pow(2, task.retries - 1);
        await delay(backoff);
        localQueue.unshift(task); // retry this task next
      } else {
        task.reject(error);
      }
    }

    // If we retried and the task is back in queue, loop again immediately
    // Otherwise wait for lock TTL to naturally expire before next request
    if (!success && localQueue[0] === task) {
      // Task was re-queued for retry — loop will grab it
      continue;
    }
  }
}

/**
 * Enqueue an async function so it runs respecting the global RPC rate limit.
 * All Vercel instances share the same Redis lock, so the limit is truly global.
 */
export function rpcQueue<T>(execute: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    localQueue.push({
      execute: execute as () => Promise<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
      retries: 0,
    });
    runNext();
  });
}
