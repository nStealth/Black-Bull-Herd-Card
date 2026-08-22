<script lang="ts">
  // Buy vs sell breakdown per window, summed across every pool.
  import type { ActivityStats, WindowStats } from '$lib/dashboard/types';
  import { compact, count, usdCompact } from '$lib/dashboard/format';

  export let activity: ActivityStats | null;

  $: rows = [
    { key: 'h1', label: '1H', stats: activity?.h1 ?? null },
    { key: 'h6', label: '6H', stats: activity?.h6 ?? null },
    { key: 'h24', label: '24H', stats: activity?.h24 ?? null },
    { key: 'd7', label: '7D', stats: activity?.d7 ?? null },
    { key: 'd30', label: '30D', stats: activity?.d30 ?? null }
  ];

  function buyShare(stats: WindowStats): number {
    const total = stats.buys + stats.sells;
    return total === 0 ? 50 : (stats.buys / total) * 100;
  }
</script>

<section class="d-card overflow-hidden">
  <header class="border-b px-5 py-3.5" style="border-color: var(--d-border);">
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">Trading Activity</h2>
  </header>

  <div>
    {#each rows as row, i (row.key)}
      <div
        class="px-5 py-3.5"
        style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};"
      >
        {#if row.stats}
          {@const share = buyShare(row.stats)}
          <div class="flex items-center justify-between gap-3">
            <span class="d-numeric text-xs font-semibold" style="color: var(--d-text-2);">
              {row.label}
            </span>
            <div class="d-numeric flex items-center gap-3 text-[0.6875rem]" style="color: var(--d-text-3);">
              <span>{usdCompact(row.stats.volumeUsd)}</span>
              <span
                style="color: {row.stats.priceChangePct >= 0 ? 'var(--d-up)' : 'var(--d-down)'};"
              >
                {row.stats.priceChangePct >= 0 ? '+' : ''}{row.stats.priceChangePct.toFixed(2)}%
              </span>
            </div>
          </div>

          <div class="mt-2.5 flex items-center gap-2.5">
            <span class="d-numeric w-14 shrink-0 text-xs font-semibold" style="color: var(--d-up);">
              {count(row.stats.buys)}
            </span>
            <div
              class="relative h-1 flex-1 overflow-hidden rounded-full"
              style="background: color-mix(in srgb, var(--d-down) 34%, transparent);"
              role="img"
              aria-label="{share.toFixed(0)} percent buys"
            >
              <div
                class="h-full rounded-full transition-[width] duration-500"
                style="width: {share}%; background: var(--d-up);"
              />
            </div>
            <span
              class="d-numeric w-14 shrink-0 text-right text-xs font-semibold"
              style="color: var(--d-down);"
            >
              {count(row.stats.sells)}
            </span>
          </div>

          <p class="mt-1.5 text-[0.6875rem]" style="color: var(--d-text-3);">
            {share.toFixed(1)}% buy pressure · {compact(row.stats.buys + row.stats.sells)} trades
          </p>
        {:else}
          <div class="flex items-center justify-between gap-3">
            <span class="d-numeric text-xs font-semibold" style="color: var(--d-text-3);">
              {row.label}
            </span>
            <span class="text-[0.6875rem]" style="color: var(--d-text-3);">
              Requires an indexed history provider
            </span>
          </div>
          <div class="mt-2.5 h-1 rounded-full" style="background: var(--d-border);" aria-hidden="true" />
        {/if}
      </div>
    {/each}
  </div>
</section>
