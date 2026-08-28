<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Message from '$lib/components/ui/Message.svelte';
  import { CAMPAIGN_CLOSED, CAMPAIGN_CLOSED_ON } from '$lib/campaign';

  export let balance: number;
  export let hasSubmitted: boolean;
  export let onShare: () => void;
  export let onSubmit: () => void;
  export let onDownload: () => void;
</script>

<div class="flex flex-col gap-3 mt-6">
  {#if balance >= 1}
    {#if !hasSubmitted}
      <Button variant="primary" fullWidth on:click={onShare}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
        {CAMPAIGN_CLOSED ? 'Share your card 🐂' : 'Share & Get Your NFT! 🐂'}
      </Button>
      {#if CAMPAIGN_CLOSED}
        <p class="text-center text-xs text-text-muted">
          Entries closed on {CAMPAIGN_CLOSED_ON}. The card is still yours to share and download.
        </p>
      {:else}
        <Button variant="secondary" fullWidth on:click={onSubmit}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
          Submit Tweet Link
        </Button>
      {/if}
    {:else}
      <div class="flex flex-col items-center gap-3 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center animate-glow">
        <span class="text-5xl">🎉</span>
        <h3 class="text-2xl font-bold text-accent-green">You're In!</h3>
        <p class="text-text-secondary">Your NFT is reserved and will be airdropped after the campaign ends!</p>
        <p class="text-xs text-text-muted">Keep your tweet public until then.</p>
      </div>
    {/if}
  {:else}
    <div class="flex flex-col items-center gap-2 p-5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-amber-500">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p class="font-medium">You need at least 1 $ANSEM to get an NFT card!</p>
      <p class="text-text-muted text-sm">But you can still join the community and follow us on X.</p>
    </div>
    <Button variant="secondary" fullWidth on:click={onShare}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
      Join Community Anyway
    </Button>
  {/if}
  <Button variant="outline" fullWidth on:click={onDownload}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
    Download Card
  </Button>
</div>
