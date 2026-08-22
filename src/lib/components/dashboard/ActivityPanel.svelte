<script lang="ts">
  // Buy vs sell breakdown per trading window, aggregated across every pool.
  import type { ActivityStats, WindowStats } from '$lib/dashboard/types';
  import { compact, count, signedPct, usdCompact } from '$lib/dashboard/format';

  export let activity: ActivityStats | null;
  export let loading = false;

  interface Row {
    key: string;
    label: string;
    stats: WindowStats | null;
    /** Windows we cannot source from a free provider render as locked. */
    locked: boolean;
  }

  $: rows = [
    { key: 'h1', label: '1 Hour', stats: activity?.h1 ?? null, locked: false },
    { key: 'h6', label: '6 Hours', stats: activity?.h6 ?? null, locked: false },
    { key: 'h24', label: '24 Hours', stats: activity?.h24 ?? null, locked: false },
    { key: 'd7', label: '7 Days', stats: activity?.d7 ?? null, locked: !activity?.d7 },
    { key: 'd30', label: '30 Days', stats: activity?.d30 ?? null, locked: !activity?.d30 }
  ] satisfies Row[];

  function buyShare(stats: WindowStats): number {
    const total = stats.buys + stats.sells;
    return total === 0 ? 50 : (stats.buys / total) * 100;
  }
</script>

<section class="d-card p-6 max-md:p-4">
  <header class="mb-5 flex items-baseline justify-between gap-3">
    <div>
      <h2 class="text-lg font-bold" style="color: var(--d-text);">Trading Activity</h2>
      <p class="mt-0.5 text-xs" style="color: var(--d-text-muted);">
        Buys vs sells across all liquidity pools
      </p>
    </div>
  </header>

  <div class="flex flex-col gap-3">
    {#each rows as row (row.key)}
      <div
        class="rounded-2xl border p-4 transition-colors"
        style="border-color: var(--d-border); background: var(--d-surface-solid);"
        class:opacity-55={row.locked}
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-sm font-semibold" style="color: var(--d-text);">{row.label}</span>

          {#if row.locked}
            <span
              class="rounded-md px-2 py-0.5 text-[0.6875rem] font-medium"
              style="color: var(--d-text-muted); background: var(--d-border);"
            >
              Needs an indexed history provider
            </span>
          {:else if row.stats && !loading}
            <div class="d-numeric flex items-center gap-3 text-xs">
              <span style="color: var(--d-text-muted);">{usdCompact(row.stats.volumeUsd)} vol</span>
              <span
                style="color: {row.stats.priceChangePct >= 0
                  ? 'var(--d-buy)'
                  : 'var(--d-sell)'};">{signedPct(row.stats.priceChangePct)}</span
              >
            </div>
          {/if}
        </div>

        {#if row.stats && !row.locked}
          {@const share = buyShare(row.stats)}
          <div class="mt-3 flex items-center gap-3">
            <span class="d-numeric w-16 shrink-0 text-sm font-bold" style="color: var(--d-buy);">
              {count(row.stats.buys)}
            </span>

            <div
              class="relative h-2.5 flex-1 overflow-hidden rounded-full"
              style="background: color-mix(in srgb, var(--d-sell) 30%, transparent);"
              role="img"
              aria-label="{share.toFixed(0)} percent buys"
            >
              <div
                class="h-full rounded-full transition-[width] duration-700 ease-out"
                style="width: {share}%; background: var(--d-buy);"
              />
            </div>

            <span
              class="d-numeric w-16 shrink-0 text-right text-sm font-bold"
              style="color: var(--d-sell);"
            >
              {count(row.stats.sells)}
            </span>
          </div>

          <div class="mt-1.5 flex justify-between text-[0.6875rem]" style="color: var(--d-text-muted);">
            <span>{share.toFixed(1)}% buys</span>
            <span>{compact(row.stats.buys + row.stats.sells)} trades</span>
            <span>{(100 - share).toFixed(1)}% sells</span>
          </div>
        {:else if row.locked}
          <div class="mt-3 h-2.5 rounded-full" style="background: var(--d-border);" aria-hidden="true" />
        {/if}
      </div>
    {/each}
  </div>
</section>
