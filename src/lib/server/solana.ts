// Server-side Solana RPC access: read-only $ANSEM balance lookup.
//
// Lives under `$lib/server` because it reads `RPC_URL`, which is private — a
// Helius endpoint carries its API key in the query string. The browser never
// talks to the RPC directly; it goes through `/api/check/[wallet]`, which calls
// in here.
//
// Keeping this out of `$lib/solana` also keeps @solana/web3.js, the Upstash
// client and the RPC queue out of the client bundle. They were shipped to every
// visitor purely because the wallet-connect helpers shared a module with this
// function.

import { env } from '$env/dynamic/private';
import { Connection, PublicKey } from '@solana/web3.js';
import { ANSEM_MINT } from '$lib/tiers';
import { isValidPublicKey } from '$lib/solana';
import { rpcQueue } from './rpcQueue';

const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';

let connection: Connection | null = null;

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(env.RPC_URL?.trim() || PUBLIC_RPC, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    });
  }
  return connection;
}

export interface BalanceResult {
  balance: number;
  success: boolean;
  error?: string;
}

/**
 * Get $ANSEM token balance for a wallet address
 * Uses getParsedTokenAccountsByOwner for accurate balance lookup
 */
export async function getAnsemBalance(walletAddress: string): Promise<BalanceResult> {
  try {
    // Validate address format
    if (!isValidPublicKey(walletAddress)) {
      return { balance: 0, success: false, error: 'Invalid wallet address format' };
    }

    const conn = getConnection();
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(ANSEM_MINT);

    // Fetch all token accounts for this wallet that match the $ANSEM mint
    // Queued so we don't burst past the RPC provider's rate limit.
    const response = await rpcQueue(() =>
      conn.getParsedTokenAccountsByOwner(walletPubkey, {
        mint: mintPubkey
      })
    );

    // Sum up all token balances (user might have multiple accounts)
    let totalBalance = 0;

    for (const account of response.value) {
      const accountData = account.account.data;
      if (accountData && 'parsed' in accountData && accountData.parsed) {
        const info = accountData.parsed.info;
        if (info && typeof info.tokenAmount === 'object') {
          const amount = info.tokenAmount;
          if (amount.uiAmount !== null && amount.uiAmount !== undefined) {
            totalBalance += amount.uiAmount;
          } else {
            totalBalance += Number(BigInt(amount.amount)) / Math.pow(10, amount.decimals);
          }
        }
      }
    }

    const balance = typeof totalBalance === 'bigint' ? Number(totalBalance) : totalBalance;

    return { balance, success: true };
  } catch (error) {
    console.error('Error fetching ANSEM balance:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid public key')) {
        return { balance: 0, success: false, error: 'Invalid wallet address' };
      }
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return { balance: 0, success: false, error: 'Rate limited. Please try again.' };
      }
    }

    return {
      balance: 0,
      success: false,
      error: 'Failed to fetch balance. Please try again.'
    };
  }
}
