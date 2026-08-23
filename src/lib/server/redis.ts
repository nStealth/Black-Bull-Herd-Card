// Upstash Redis client, shared by the rate limiter, the RPC queue and the
// dashboard cache.
//
// Lives under `$lib/server` so the credentials can be read through
// `$env/dynamic/private`, which SvelteKit refuses to bundle into client code.
// It previously sat in `$lib` and guarded `typeof process`, because the
// solana -> rpcQueue import chain dragged it into the browser bundle; that
// chain is gone, so the guard is gone with it.

import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

const url = env.REDIS_URL;
const token = env.REDIS_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;

export function isRedisReady(): boolean {
  return redis !== null;
}
