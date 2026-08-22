// Shared Solana JSON-RPC transport for the dashboard providers.
//
// This is the single place `RPC_URL` is resolved for dashboard traffic, so the
// holder indexer, the supply read and the mint-security check can never drift
// onto different endpoints. `$env/dynamic/private` keeps the value server-side
// and still resolves a local `.env` in dev.

import { env } from '$env/dynamic/private';

export const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';

const TIMEOUT_MS = 12_000;

/**
 * A Helius key unlocks the DAS methods the free public RPC will not serve.
 * Accepted either directly or embedded in a Helius `RPC_URL`.
 */
export function heliusKey(): string | null {
  const direct = env.HELIUS_API_KEY?.trim();
  if (direct) return direct;

  // Parsing is guarded: `new URL` throws on a malformed value, and this runs
  // outside any try/catch on the dashboard's load path.
  const rpc = env.RPC_URL?.trim();
  if (rpc && rpc.includes('helius')) {
    try {
      const key = new URL(rpc).searchParams.get('api-key');
      if (key) return key;
    } catch {
      // Misconfigured RPC_URL — fall through to "no indexing provider".
    }
  }
  return null;
}

export function rpcUrl(): string {
  const key = heliusKey();
  if (key) return `https://mainnet.helius-rpc.com/?api-key=${key}`;
  return env.RPC_URL?.trim() || PUBLIC_RPC;
}

export async function rpcCall<T>(method: string, params: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(rpcUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 'dashboard', method, params }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`RPC ${method} responded ${res.status}`);

    const body = (await res.json()) as { result?: T; error?: { message: string } };
    if (body.error) throw new Error(`RPC ${method}: ${body.error.message}`);
    if (body.result === undefined) throw new Error(`RPC ${method} returned no result`);
    return body.result;
  } finally {
    clearTimeout(timer);
  }
}
