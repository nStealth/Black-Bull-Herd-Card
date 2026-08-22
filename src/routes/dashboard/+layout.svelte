<script lang="ts">
  // Standalone dashboard shell.
  //
  // The marketing site lives under the (site) route group with its own layout,
  // so this branch renders none of its header, footer or nav. There are
  // deliberately no links from here back to the marketing site.
  import { onDestroy, onMount } from 'svelte';
  import { applyTheme, clearTheme, theme } from '$lib/dashboard/theme';
  import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';

  onMount(() => applyTheme($theme));
  onDestroy(clearTheme);
</script>

<div class="flex min-h-screen flex-col" style="background: var(--d-bg);">
  <header
    class="sticky top-0 z-50 border-b backdrop-blur-xl"
    style="border-color: var(--d-border); background: color-mix(in srgb, var(--d-bg) 86%, transparent);"
  >
    <div class="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-6 max-md:px-4">
      <div class="flex items-center gap-2.5">
        <div
          class="grid h-7 w-7 place-items-center rounded-md text-[0.8125rem] font-bold"
          style="background: var(--d-accent-soft); color: var(--d-accent);"
          aria-hidden="true"
        >
          ◈
        </div>
        <span class="text-sm font-semibold tracking-tight" style="color: var(--d-text);">
          ANSEM Analytics
        </span>
        <span
          class="rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider"
          style="background: var(--d-accent-soft); color: var(--d-accent);"
        >
          Solana
        </span>
      </div>

      <ThemeToggle />
    </div>
  </header>

  <main class="flex-1">
    <slot />
  </main>

  <footer class="border-t" style="border-color: var(--d-border);">
    <div
      class="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs max-md:px-4"
      style="color: var(--d-text-3);"
    >
      <span>Market data from DexScreener · chain data from Solana mainnet</span>
      <span>Not financial advice</span>
    </div>
  </footer>
</div>
