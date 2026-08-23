<script lang="ts">
  // Buy vs sell breakdown per window, summed across every pool.
  //
  // Up to 24h the source publishes trade counts, so the row draws the buy/sell
  // split. Beyond that only price and volume exist, so those rows drop the bar
  // rather than implying a 50/50 split that was never measured.
  import type { ActivityStats, WindowStats } from '$lib/dashboard/types';
  import { compact, count, usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';

  export let activity: ActivityStats | null;

  $: rows = [
    { key: 'h1', label: '1H', stats: activity?.h1 ?? null },
    { key: 'h6', label: '6H', stats: activity?.h6 ?? null },
    { key: 'h24', label: '24H', stats: activity?.h24 ?? null },
    { key: 'd7', label: '7D', stats: activity?.d7 ?? null },
    { key: 'd30', label: '30D', stats: activity?.d30 ?? null }
  ];

  /** A row can draw the split only when both counts were actually reported. */
  function counted(
    stats: WindowStats | null
  ): stats is WindowStats & { buys: number; sells: number } {
    return stats !== null && stats.buys !== null && stats.sells !== null;
  }

  function buyShare(buys: number, sells: number): number {
    const total = buys + sells;
    return total === 0 ? 50 : (buys / total) * 100;
  }
</script>

<section class="d-card overflow-hidden">
  <header class="border-b px-5 py-3.5" style="border-color: var(--d-border);">
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">Trading Activity
      <InfoTip label="Trading Activity" text="Buys against sells in each window, summed across every pool. Up to 24h the source publishes real trade counts; the 7D and 30D rows carry price and volume from candle history, with counts left blank because no free provider breaks them out beyond a day." />
    </h2>
  </header>

  <div>
    {#each rows as row, i (row.key)}
      <div class="px-5 py-3.5" style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};">
        {#if row.stats}
          <div class="flex items-center justify-between gap-3">
            <span class="d-numeric text-xs font-semibold" style="color: var(--d-text-2);">
              {row.label}
            </span>
            <div
              class="d-numeric flex items-center gap-3 text-[0.6875rem]"
              style="color: var(--d-text-3);"
            >
              <span>{usdCompact(row.stats.volumeUsd)}</span>
              <span
                style="color: {row.stats.priceChangePct >= 0 ? 'var(--d-up)' : 'var(--d-down)'};"
              >
                {row.stats.priceChangePct >= 0 ? '+' : ''}{row.stats.priceChangePct.toFixed(2)}%
              </span>
            </div>
          </div>

          {#if counted(row.stats)}
            {@const share = buyShare(row.stats.buys, row.stats.sells)}
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
            <p class="mt-2 text-[0.6875rem]" style="color: var(--d-text-3);">
              Price and volume from OHLCV history · trade counts not published beyond 24h
            </p>
          {/if}
        {:else}
          <div class="flex items-center justify-between gap-3">
            <span class="d-numeric text-xs font-semibold" style="color: var(--d-text-3);">
              {row.label}
            </span>
            <span class="text-[0.6875rem]" style="color: var(--d-text-3);">Unavailable</span>
          </div>
          <div class="mt-2.5 h-1 rounded-full" style="background: var(--d-border);" aria-hidden="true" />
        {/if}
      </div>
    {/each}
  </div>
</section>
