// Fixed-window rate limiter backed by Upstash Redis.
// Shared across Vercel instances; when Redis is absent it fails open, since
// blocking real users is worse than letting abuse through on a dev instance.

import { redis, isRedisReady } from '$lib/server/redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  if (!redis || !isRedisReady()) {
    return { allowed: true, remaining: limit, retryAfterSec: 0 };
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
      retryAfterSec: hits > limit ? windowSec : 0
    };
  } catch {
    return { allowed: true, remaining: limit, retryAfterSec: 0 };
  }
}

/** Best-effort client identity: Vercel sets x-forwarded-for on every request. */
export function clientKey(request: Request, fallback = 'unknown'): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || fallback;
}
