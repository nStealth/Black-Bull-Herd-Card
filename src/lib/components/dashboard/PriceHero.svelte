<script lang="ts">
  // The one line somebody wants before anything else.
  //
  // Previously price sat in a grid of ten equally-weighted tiles, so "Market
  // Age" carried the same visual weight as the number the whole page exists to
  // report. Hierarchy here is the point: price is large, the three figures that
  // qualify it sit beside it, and everything else stays in the tile row below.

  import type { ActivityStats, TokenOverview } from '$lib/dashboard/types';
  import { usd, usdCompact } from '$lib/dashboard/format';

  export let overview: TokenOverview;
  export let activity: ActivityStats | null;

  $: change = activity?.h24.priceChangePct ?? null;
  $: up = (change ?? 0) >= 0;
</script>

<section class="d-card overflow-hidden">
  <div class="flex flex-wrap items-end justify-between gap-6 px-6 py-5 max-md:px-5 max-md:gap-4">
    <!-- Price -->
    <div>
      <p class="d-label">Price</p>
      <div class="mt-1.5 flex flex-wrap items-baseline gap-3">
        <span
          class="d-numeric text-[2.75rem] font-bold leading-none tracking-tight max-md:text-4xl"
          style="color: var(--d-text);"
        >
          {usd(overview.priceUsd, 4)}
        </span>
        {#if change !== null}
          <span
            class="d-numeric rounded-lg px-2 py-1 text-sm font-bold"
            style="color: {up ? 'var(--d-up)' : 'var(--d-down)'};
                   background: color-mix(in srgb, {up ? 'var(--d-up)' : 'var(--d-down)'} 12%, transparent);"
          >
            {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
            <span class="font-normal opacity-70">24h</span>
          </span>
        {/if}
      </div>
    </div>

    <!-- The three figures that put the price in context -->
    <div class="flex gap-8 max-md:w-full max-md:justify-between max-md:gap-4">
      {#each [{ k: 'Market cap', v: usdCompact(overview.marketCapUsd) }, { k: '24h volume', v: usdCompact(activity?.h24.volumeUsd ?? 0) }, { k: 'Liquidity', v: usdCompact(overview.liquidityUsd) }] as item (item.k)}
        <div>
          <p class="d-label">{item.k}</p>
          <p class="d-numeric mt-1 text-lg font-semibold leading-none" style="color: var(--d-text);">
            {item.v}
          </p>
        </div>
      {/each}
    </div>
  </div>
</section>
