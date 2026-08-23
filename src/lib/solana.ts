// Browser-side wallet module.
//
// Everything here talks to the injected Phantom provider — no RPC, no network,
// no secrets, no dependencies. Balance lookups need an RPC endpoint and live in
// `$lib/server/solana`, which the browser reaches via `/api/check/[wallet]`.

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