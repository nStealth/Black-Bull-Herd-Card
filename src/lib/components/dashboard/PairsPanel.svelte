<script lang="ts">
  // Where the liquidity actually sits, pool by pool.
  import type { PairInfo } from '$lib/dashboard/types';
  import { usdCompact } from '$lib/dashboard/format';

  export let pairs: PairInfo[] = [];

  $: totalLiquidity = pairs.reduce((sum, p) => sum + p.liquidityUsd, 0);
</script>

<section class="d-card p-6 max-md:p-4">
  <header class="mb-5">
    <h2 class="text-lg font-bold" style="color: var(--d-text);">Liquidity by Pool</h2>
    <p class="mt-0.5 text-xs" style="color: var(--d-text-muted);">
      {pairs.length} active {pairs.length === 1 ? 'pool' : 'pools'} · {usdCompact(totalLiquidity)} total
    </p>
  </header>

  <div class="flex flex-col gap-2.5">
    {#each pairs.slice(0, 8) as pair (pair.pairAddress)}
      {@const share = totalLiquidity > 0 ? (pair.liquidityUsd / totalLiquidity) * 100 : 0}
      <a
        href={pair.url}
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-2xl border p-3 transition-colors hover:bg-[var(--d-surface-hover)]"
        style="border-color: var(--d-border); background: var(--d-surface-solid);"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold capitalize" style="color: var(--d-text);">
              {pair.dexId}
            </span>
            <span class="text-[0.6875rem]" style="color: var(--d-text-muted);">
              / {pair.quoteSymbol}
            </span>
            {#each pair.labels as label (label)}
              <span
                class="rounded px-1.5 py-0.5 text-[0.625rem] font-semibold"
                style="color: var(--d-accent); background: color-mix(in srgb, var(--d-accent) 14%, transparent);"
                >{label}</span
              >
            {/each}
          </div>
          <span class="d-numeric text-sm font-bold" style="color: var(--d-text);">
            {usdCompact(pair.liquidityUsd)}
          </span>
        </div>

        <div class="mt-2 h-1.5 overflow-hidden rounded-full" style="background: var(--d-border);">
          <div
            class="h-full rounded-full transition-[width] duration-700"
            style="width: {share}%; background: var(--d-accent);"
          />
        </div>

        <div class="mt-1.5 flex justify-between text-[0.6875rem]" style="color: var(--d-text-muted);">
          <span>{share.toFixed(1)}% of liquidity</span>
          <span>{usdCompact(pair.volume24hUsd)} 24h volume</span>
        </div>
      </a>
    {/each}
  </div>
</section>
