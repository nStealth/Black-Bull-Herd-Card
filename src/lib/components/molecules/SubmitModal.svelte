<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Message from '$lib/components/ui/Message.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';

  export let open: boolean = false;
  export let tweetUrl: string = '';
  export let tweetUrlError: string = '';
  export let isSubmitting: boolean = false;
  export let onClose: () => void;
  export let onSubmit: () => void;

  function validateAndSubmit() {
    if (!tweetUrl.trim()) {
      tweetUrlError = 'Please enter a valid Twitter/X URL';
      return;
    }
    onSubmit();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') validateAndSubmit();
  }
</script>

<Modal {open} {onClose}>
  <div class="flex flex-col items-center text-center mb-6">
    <div class="w-14 h-14 rounded-2xl bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center text-accent-purple mb-4">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    </div>
    <h3 class="text-xl font-bold mb-2">🎯 Submit Your Tweet</h3>
    <p class="text-text-secondary text-sm leading-relaxed">
      Share the campaign on X and paste your tweet link to complete your entry!
    </p>
  </div>

  <div class="flex flex-col gap-1">
    <input
      type="text"
      class="w-full px-4 py-3.5 bg-cyber-bg-secondary border border-cyber-border rounded-xl text-sm placeholder:text-text-muted focus:border-accent-purple focus:ring-1 focus:ring-accent-purple/30 transition-all"
      placeholder="https://x.com/username/status/123..."
      bind:value={tweetUrl}
      on:keydown={handleKeydown}
    />
    {#if tweetUrlError}
      <Message variant="error" message={tweetUrlError} className="mt-2" />
    {/if}
  </div>

  <div class="flex flex-col gap-3 mt-6">
    <Button variant="primary" fullWidth loading={isSubmitting} on:click={validateAndSubmit}>
      Confirm & Get My NFT! 🎉
    </Button>
    <Button variant="secondary" fullWidth on:click={onClose}>
      Cancel
    </Button>
  </div>
</Modal>
