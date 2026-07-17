<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import { onMount } from 'svelte';

  export let open: boolean;
  export let onClose: () => void;
  export let className: string = '';
  export let showCloseButton: boolean = true;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn',
      className
    )}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    on:click|self={onClose}
  >
    <!-- Modal panel -->
    <div class="bg-cyber-bg-card border border-cyber-border rounded-3xl p-8 w-full max-w-md mx-4 relative animate-slideUp shadow-2xl">
      {#if showCloseButton}
        <button
          class="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg bg-cyber-bg-secondary text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors"
          on:click={onClose}
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      {/if}
      <slot />
    </div>
  </div>
{/if}
