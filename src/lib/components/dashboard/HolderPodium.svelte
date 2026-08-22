<script lang="ts">
  // The top ten, given room to breathe. Ranks 1-3 sit in hero cards, 4-10
  // follow as dense rows so the whole group still reads as one leaderboard.
  import type { Holder } from '$lib/dashboard/types';
  import { TIERS } from '$lib/tiers';
  import { compact, pct, shortAddress, usdCompact } from '$lib/dashboard/format';
  import RankBadge from './RankBadge.svelte';

  export let holders: Holder[] = [];
  export let priceUsd = 0;

  $: podium = holders.slice(0, 3);
  $: runnersUp = holders.slice(3, 10);

  function tierOf(tierId: string) {
    return TIERS.find((t) => t.id === tierId) ?? TIERS[0];
  }

  function explorer(address: string): string {
    return `https://solscan.io/account/${address}`;
  }
</script>

<div class="flex flex-col gap-4">
  <!-- Ranks 1-3 -->
  <div class="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
    {#each podium as holder (holder.owner)}
      {@const tier = tierOf(holder.tierId)}
      <a
        href={explorer(holder.owner)}
        target="_blank"
        rel="noopener noreferrer"
        class="d-card group relative flex flex-col gap-4 overflow-hidden p-5 transition-transform hover:-translate-y-1"
        style="border-color: color-mix(in srgb, {tier.color} 35%, var(--d-border));"
      >
        <div
          class="absolute inset-x-0 -top-16 h-32 opacity-40 blur-2xl transition-opacity group-hover:opacity-70"
          style="background: radial-gradient(ellipse at center, {tier.color}, transparent 70%);"
          aria-hidden="true"
        />

        <div class="relative flex items-center gap-3">
          <RankBadge rank={holder.rank} tierId={holder.tierId} size={52} />
          <div class="min-w-0">
            <p class="d-numeric truncate text-sm font-bold" style="color: var(--d-text);">
              {shortAddress(holder.owner, 6, 6)}
            </p>
            <p class="truncate text-[0.6875rem] font-semibold" style="color: {tier.color};">
              {holder.entity ?? tier.name}
            </p>
          </div>
        </div>

        <div class="relative">
          <p class="d-numeric text-2xl font-bold" style="color: var(--d-text);">
            {compact(holder.balance)}
          </p>
          <p class="text-xs" style="color: var(--d-text-secondary);">
            {pct(holder.percentSupply)} of supply
            {#if priceUsd > 0}
              · {usdCompact(holder.balance * priceUsd)}
            {/if}
          </p>
        </div>

        <div class="relative h-1.5 overflow-hidden rounded-full" style="background: var(--d-border);">
          <div
            class="h-full rounded-full"
            style="width: {Math.min(100, holder.percentSupply * 10)}%; background: {tier.color};"
          />
        </div>
      </a>
    {/each}
  </div>

  <!-- Ranks 4-10 -->
  {#if runnersUp.length > 0}
    <div class="d-card divide-y overflow-hidden" style="--tw-divide-opacity: 1;">
      {#each runnersUp as holder (holder.owner)}
        {@const tier = tierOf(holder.tierId)}
        <a
          href={explorer(holder.owner)}
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-4 px-5 py-3 transition-colors max-md:px-3"
          style="border-top: 1px solid var(--d-border);"
        >
          <RankBadge rank={holder.rank} tierId={holder.tierId} size={38} />

          <div class="min-w-0 flex-1">
            <p class="d-numeric truncate text-sm font-semibold" style="color: var(--d-text);">
              {shortAddress(holder.owner, 6, 6)}
            </p>
            <p class="truncate text-[0.6875rem]" style="color: {tier.color};">
              {holder.entity ?? tier.name}
            </p>
          </div>

          <div class="hidden w-40 md:block">
            <div class="h-1.5 overflow-hidden rounded-full" style="background: var(--d-border);">
              <div
                class="h-full rounded-full"
                style="width: {Math.min(100, holder.percentSupply * 10)}%; background: {tier.color};"
              />
            </div>
          </div>

          <div class="shrink-0 text-right">
            <p class="d-numeric text-sm font-bold" style="color: var(--d-text);">
              {compact(holder.balance)}
            </p>
            <p class="d-numeric text-[0.6875rem]" style="color: var(--d-text-muted);">
              {pct(holder.percentSupply)}
            </p>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
