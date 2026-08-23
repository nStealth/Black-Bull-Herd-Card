// Fixed-window rate limiter backed by Upstash Redis.
// Shared across Vercel instances; when Redis is absent it fails open, since
// blocking real users is worse than letting abuse through on a dev instance.

import { redis, isRedisReady } from '$lib/server/redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
  /**
   * Why the limiter let a request through, surfaced so "no 429s" can be told
   * apart from "the limiter is not running". It failed open silently once and
   * looked identical to working from the outside.
   */
  state: 'counted' | 'no-redis' | 'error';
  hits: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  if (!redis || !isRedisReady()) {
    return { allowed: true, remaining: limit, retryAfterSec: 0, state: 'no-redis', hits: 0 };
  }

  const bucket = `ratelimit:${key}:${Math.floor(Date.now() / (windowSec * 1000))}`;

  try {
    const hits = await redis.incr(bucket);
    if (hits === 1) {
      await redis.expire(bucket, windowSec);
    }
    return {
      allowed: hits <= limit,
      remaining: Math.max(0, limit - hits),
      retryAfterSec: hits > limit ? windowSec : 0,
      state: 'counted',
      hits
    };
  } catch (error) {
    console.error('[rateLimit] Redis counter failed:', error);
    return { allowed: true, remaining: limit, retryAfterSec: 0, state: 'error', hits: 0 };
  }
}

/**
 * Client identity for rate limiting.
 *
 * Order matters. This site sits behind Cloudflare in front of Vercel, and
 * `x-forwarded-for` is not stable there: the chain varies with the edge node
 * that handled the request, so bucketing on it handed the same visitor a
 * different counter per node and multiplied the effective limit by however
 * many nodes were in play. Observed directly — the remaining count moved
 * 22 → 25 → 17 → 21 across consecutive requests from one machine, which a
 * single shared counter cannot do.
 *
 * `cf-connecting-ip` is Cloudflare's canonical client address and does not
 * move between nodes, so it is preferred wherever present.
 */
export function clientKey(request: Request, fallback = 'unknown'): string {
  const h = request.headers;

  const direct = h.get('cf-connecting-ip')?.trim() || h.get('true-client-ip')?.trim();
  if (direct) return direct;

  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return h.get('x-real-ip')?.trim() || fallback;
}
