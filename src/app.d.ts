// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      isSolflare?: boolean;
      connect: ((options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>);
      disconnect: () => Promise<void>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      off: (event: string, callback: (...args: unknown[]) => void) => void;
      signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    };
  }
}

export {};
