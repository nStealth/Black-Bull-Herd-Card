<script lang="ts">
  // Top ten, as a single clean list. Ranks 1-3 carry a tinted chip; the rest
  // stay neutral so the eye tracks the numbers rather than the decoration.
  import type { Holder } from '$lib/dashboard/types';
  import { TIERS } from '$lib/tiers';
  import { compact, pct, shortAddress, usdCompact } from '$lib/dashboard/format';
  import RankBadge from './RankBadge.svelte';

  export let holders: Holder[] = [];
  export let priceUsd = 0;

  function tierName(tierId: string): string {
    return TIERS.find((t) => t.id === tierId)?.name ?? '';
  }
</script>

<section class="d-card overflow-hidden">
  <header class="border-b px-5 py-3.5" style="border-color: var(--d-border);">
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">Top 10 Holders</h2>
  </header>

  {#each holders as holder, i (holder.owner)}
    <a
      href="https://solscan.io/account/{holder.owner}"
      target="_blank"
      rel="noopener noreferrer"
      class="flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-[var(--d-hover)] max-md:px-4"
      style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};"
    >
      <RankBadge rank={holder.rank} />

      <div class="min-w-0 flex-1">
        <p class="d-numeric truncate text-[0.8125rem] font-medium" style="color: var(--d-text);">
          {shortAddress(holder.owner, 6, 6)}
        </p>
        <p class="truncate text-[0.6875rem]" style="color: var(--d-text-3);">
          {holder.entity ?? tierName(holder.tierId)}
        </p>
      </div>

      <div class="hidden w-32 shrink-0 md:block">
        <div class="h-1 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
          <div
            class="h-full rounded-full"
            style="width: {Math.min(100, holder.percentSupply * 10)}%; background: var(--d-accent);"
          />
        </div>
      </div>

      <div class="shrink-0 text-right">
        <p class="d-numeric text-[0.8125rem] font-semibold" style="color: var(--d-text);">
          {compact(holder.balance)}
        </p>
        <p class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
          {pct(holder.percentSupply)}{#if priceUsd > 0} · {usdCompact(holder.balance * priceUsd)}{/if}
        </p>
      </div>
    </a>
  {/each}
</section>
