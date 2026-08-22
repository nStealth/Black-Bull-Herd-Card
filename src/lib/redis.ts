import { Redis } from '@upstash/redis';

// `process` does not exist in the browser bundle, and this module is reachable
// from client code through the solana -> rpcQueue import chain. Guarding the
// lookup keeps that path from throwing at module-init time.
const env = typeof process !== 'undefined' ? process.env : ({} as Record<string, string | undefined>);

const url = env.REDIS_URL;
const token = env.REDIS_TOKEN;

export const redis = url && token
  ? new Redis({ url, token })
  : null;

export function isRedisReady(): boolean {
  return redis !== null;
}
