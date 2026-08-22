<script lang="ts">
  import { theme, toggleTheme } from '$lib/dashboard/theme';
</script>

<button
  type="button"
  class="grid h-8 w-8 place-items-center rounded-lg border transition-colors"
  style="border-color: var(--d-border); background: var(--d-surface); color: var(--d-text-2);"
  on:click={toggleTheme}
  aria-label="Switch to {$theme === 'dark' ? 'light' : 'dark'} theme"
>
  {#if $theme === 'dark'}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  {:else}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  {/if}
</button>
