<script lang="ts">
  import type { PairInfo } from '$lib/dashboard/types';
  import { usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';
  import { SOURCES } from '$lib/dashboard/sources';

  export let pairs: PairInfo[] = [];

  $: total = pairs.reduce((sum, p) => sum + p.liquidityUsd, 0);
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex items-baseline justify-between border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">Liquidity by Pool
      <InfoTip label="Liquidity by Pool" text="Every venue this token trades on and how deep each one is. Liquidity concentrated in a single pool behaves very differently from the same total spread across many — one pool is far easier to drain or move." source={SOURCES.dexscreener} />
    </h2>
    <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
      {pairs.length} pools · {usdCompact(total)}
    </span>
  </header>

  <div>
    {#each pairs.slice(0, 6) as pair, i (pair.pairAddress)}
      {@const share = total > 0 ? (pair.liquidityUsd / total) * 100 : 0}
      <a
        href={pair.url}
        target="_blank"
        rel="noopener noreferrer"
        class="block px-5 py-3 transition-colors hover:bg-[var(--d-hover)]"
        style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs font-medium capitalize" style="color: var(--d-text);">
            {pair.dexId}
            <span style="color: var(--d-text-3);">/ {pair.quoteSymbol}</span>
          </span>
          <span class="d-numeric text-xs font-semibold" style="color: var(--d-text);">
            {usdCompact(pair.liquidityUsd)}
          </span>
        </div>
        <div class="mt-2 h-1 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
          <div class="h-full rounded-full" style="width: {share}%; background: var(--d-accent);" />
        </div>
      </a>
    {/each}
  </div>
</section>
