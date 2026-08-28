<script lang="ts">
  import { CAMPAIGN_CLOSED_ON } from '$lib/campaign';
  import { connectWallet, disconnectWallet } from '$lib/solana';
  import Button from '$lib/components/ui/Button.svelte';
  import { cn } from '$lib/utils/cn';

  export let walletAddress: string = '';
  export let isConnected: boolean = false;
  export let isLoading: boolean = false;
  export let hasWallet: boolean = false;
  export let walletChecked: boolean = false;
  export let onConnect: (address: string) => void;
  export let onDisconnect: () => void;

  async function handleConnect() {
    const address = await connectWallet();
    if (address) {
      onConnect(address);
    }
  }

  async function handleDisconnect() {
    await disconnectWallet();
    onDisconnect();
  }
</script>

{#if isConnected}
  <div class="flex flex-col gap-4">
    <!-- Connected wallet info -->
    <div class="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
      <div class="w-10 h-10 rounded-full bg-accent-green flex items-center justify-center text-white shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <div class="flex-1 flex flex-col min-w-0">
        <span class="text-xs font-semibold uppercase tracking-wider text-accent-green">Connected</span>
        <span class="font-mono text-sm text-text-primary truncate">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </span>
      </div>
      <button
        class="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-text-secondary hover:bg-red-500/20 hover:text-red-500 transition-colors"
        on:click={handleDisconnect}
        aria-label="Disconnect wallet"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  </div>
{:else}
  <!-- Not connected -->
  {#if !walletChecked}
    <div class="flex items-center justify-center gap-3 py-4 text-text-muted">
      <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="animate-pulse">Checking for Phantom...</span>
    </div>
  {:else if hasWallet}
    <Button variant="phantom" size="lg" fullWidth loading={isLoading} on:click={handleConnect}>
      <svg width="24" height="24" viewBox="0 0 128 128" fill="none" class="shrink-0">
        <rect width="128" height="128" rx="32" fill="url(#phantom-gradient)" />
        <path
          d="M110.584 64.9142C110.584 79.0642 91.574 90.6542 63.684 90.6542C35.794 90.6542 16.784 79.0642 16.784 64.9142C16.784 50.7642 35.794 39.1742 63.684 39.1742C91.574 39.1742 110.584 50.7642 110.584 64.9142Z"
          fill="white"
        />
        <path
          d="M64.774 69.5942C78.114 69.5942 89.064 66.0342 89.064 61.7942C89.064 57.5542 78.114 53.9942 64.774 53.9942C51.434 53.9942 40.484 57.5542 40.484 61.7942C40.484 66.0342 51.434 69.5942 64.774 69.5942Z"
          fill="#AB9FF2"
        />
        <defs>
          <linearGradient id="phantom-gradient" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
            <stop stop-color="#5500FF" />
            <stop offset="1" stop-color="#A259FF" />
          </linearGradient>
        </defs>
      </svg>
      Connect Phantom Wallet
    </Button>
  {:else}
    <div class="flex flex-col items-center gap-3 p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
      <span class="text-3xl">⚠️</span>
      <p class="text-red-500 font-semibold">Phantom wallet not found!</p>
      <p class="text-text-muted text-sm">
        Phantom is only needed to look up your tier and generate a card. Claiming closed on
        {CAMPAIGN_CLOSED_ON}.
      </p>
      <a
        href="https://phantom.app/download"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 mt-2 px-6 py-3 bg-gradient-to-br from-[#5500ff] to-[#a259ff] text-white font-semibold rounded-xl hover:-translate-y-0.5 transition-transform shadow-lg shadow-purple-900/40 text-sm"
      >
        📥 Install Phantom Wallet
      </a>
    </div>
  {/if}
{/if}
