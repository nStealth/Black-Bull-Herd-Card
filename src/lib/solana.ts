// Solana blockchain interaction module
// Uses @solana/web3.js for read-only token balance lookup

import { Connection, PublicKey } from '@solana/web3.js';
import { ANSEM_MINT } from './tiers';
import { rpcQueue } from './rpcQueue';

const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';

/**
 * Read the RPC endpoint server-side only.
 *
 * This module is also imported by browser code (connectWallet / disconnectWallet),
 * so `process` is guarded. It is deliberately not a VITE_ variable: those are
 * inlined into the client bundle, which would publish the API key.
 */
function rpcEndpoint(): string {
  if (typeof process === 'undefined' || !process.env) return PUBLIC_RPC;
  return process.env.RPC_URL?.trim() || PUBLIC_RPC;
}

let connection: Connection | null = null;

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(rpcEndpoint(), {
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

    const balance = typeof totalBalance === 'bigint' 
      ? Number(totalBalance) 
      : totalBalance;

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

/**
 * Validate Solana public key format
 */
export function isValidPublicKey(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) {
    return false;
  }
  
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
}

/**
 * Check if Phantom wallet is available
 */
export function isPhantomAvailable(): boolean {
  if (typeof window === 'undefined' || !window.solana) {
    return false;
  }
  return window.solana.isPhantom === true;
}

/**
 * Connect to Phantom wallet
 * Returns the public key if successful
 */
export async function connectWallet(): Promise<string | null> {
  // Check if we're in browser
  if (typeof window === 'undefined') {
    console.error('Cannot connect wallet - not in browser');
    return null;
  }

  // Check for Phantom
  if (!window.solana?.isPhantom) {
    console.error('Phantom wallet not found');
    return null;
  }

  try {
    // Request connection to Phantom
    const response = await window.solana.connect();
    
    if (response?.publicKey) {
      return response.publicKey.toString();
    }
    
    return null;
  } catch (error) {
    // User rejected or error occurred
    console.error('Wallet connection failed:', error);
    return null;
  }
}

/**
 * Disconnect from wallet
 */
export async function disconnectWallet(): Promise<void> {
  if (typeof window !== 'undefined' && window.solana) {
    try {
      await window.solana.disconnect();
    } catch (error) {
      console.error('Wallet disconnect failed:', error);
    }
  }
}

/**
 * Check if wallet is already connected (trusted connection)
 */
export async function getConnectedWallet(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.solana?.isPhantom) {
    return null;
  }

    try {
    // This doesn't trigger a popup if already connected
    const response = await window.solana.connect({ onlyIfTrusted: true });
    if (response?.publicKey) {
      return response.publicKey.toString();
    }
    return null;
  } catch {
    // Wallet not connected or user rejected
    return null;
  }
}

/**
 * Listen for wallet changes (account switch, disconnect)
 */
export function onWalletChange(callback: (publicKey: string | null) => void): () => void {
  if (typeof window === 'undefined' || !window.solana) {
    return () => {};
  }

  const handleConnect = (args: unknown) => {
    const publicKey = (args as { publicKey?: { toString: () => string } })?.publicKey;
    callback(publicKey?.toString() || null);
  };

  const handleDisconnect = () => {
    callback(null);
  };

  window.solana.on('connect', handleConnect);
  window.solana.on('disconnect', handleDisconnect);

  // Return cleanup function
  return () => {
    window.solana?.off('connect', handleConnect);
    window.solana?.off('disconnect', handleDisconnect);
  };
}