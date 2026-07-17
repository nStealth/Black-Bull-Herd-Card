<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';

  export let open: boolean = false;
  export let onClose: () => void;
</script>

<Modal {open} {onClose} showCloseButton={false}>
  <div class="flex flex-col items-center text-center py-4">
    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-green to-green-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-green-900/30">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
    <h3 class="text-2xl font-bold mb-3">🎉 YOU'RE IN THE HERD!</h3>
    <p class="text-text-secondary leading-relaxed mb-1">
      Your Black Bull Herd Card NFT is RESERVED! 🐂🀄️
    </p>
    <p class="text-text-secondary leading-relaxed text-sm mb-4">
      It will be airdropped to your wallet when the 30-day campaign ends.
      <br />
      Make sure to keep your wallet active!
    </p>
    <p class="text-xs text-text-muted mb-6">Keep your tweet public until then.</p>
    <Button variant="primary" fullWidth on:click={onClose}>
      Let's Go! ⚡ CHARGE FORWARD!
    </Button>
  </div>
</Modal>
