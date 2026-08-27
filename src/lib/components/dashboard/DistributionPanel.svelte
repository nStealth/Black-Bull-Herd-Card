<script lang="ts">
  import type { Distribution } from '$lib/dashboard/types';
  import { TIERS } from '$lib/tiers';
  import { count, pct } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';

  export let distribution: Distribution | null;

  function giniLabel(value: number): string {
    if (value >= 0.95) return 'Extremely concentrated';
    if (value >= 0.85) return 'Highly concentrated';
    if (value >= 0.7) return 'Concentrated';
    if (value >= 0.5) return 'Moderately spread';
    return 'Widely distributed';
  }

  $: rows = distribution
    ? [
        { label: 'Top 10', value: distribution.top10Pct },
        { label: 'Top 50', value: distribution.top50Pct },
        { label: 'Top 100', value: distribution.top100Pct }
      ]
    : [];

  $: tiers = distribution
    ? distribution.tierCounts
        .map((r) => ({ ...r, tier: TIERS.find((t) => t.id === r.tierId) }))
        .filter((r) => r.tier)
        .reverse()
    : [];

  $: maxCount = Math.max(1, ...tiers.map((t) => t.count));

  /**
   * Percentages are only meaningful next to how much of the supply was actually
   * enumerated. If the walk hit its page cap, the shares below describe a
   * subset, and saying so is the difference between a figure and a guess.
   */
  // Guarded rather than defaulted: a payload cached before these fields existed
  // would otherwise render as a confident "covers 0% of supply".
  $: hasCoverage = typeof distribution?.coveragePct === 'number';
  $: coverage = distribution?.coveragePct ?? 0;
  $: capped = hasCoverage && distribution?.complete === false;
  $: rankedShown =
    typeof distribution?.rankedCount === 'number' &&
    typeof distribution?.ownerCount === 'number' &&
    distribution.rankedCount < distribution.ownerCount;
</script>

<section class="d-card overflow-hidden">
  <header class="border-b px-5 py-3.5" style="border-color: var(--d-border);">
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">Supply Distribution
      <InfoTip label="Supply Distribution" text="How tightly the supply is held. Top 10/50/100 are shares of total supply; the Gini coefficient runs 0 (everyone holds the same) to 1 (one wallet holds everything). Tier counts cover the ranked wallets only." />
    </h2>
  </header>

  {#if distribution}
    <div class="px-5 py-4">
      {#each rows as row (row.label)}
        <div class="mb-3 last:mb-0">
          <div class="flex items-baseline justify-between">
            <span class="text-xs" style="color: var(--d-text-2);">{row.label}</span>
            <span class="d-numeric text-xs font-semibold" style="color: var(--d-text);">
              {pct(row.value, 1)}
            </span>
          </div>
          <div class="mt-1.5 h-1 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
            <div
              class="h-full rounded-full transition-[width] duration-500"
              style="width: {Math.min(100, row.value)}%; background: var(--d-accent);"
            />
          </div>
        </div>
      {/each}
    </div>

    <div
      class="flex items-center justify-between border-t px-5 py-3"
      style="border-color: var(--d-border); background: var(--d-surface-2);"
    >
      <div>
        <p class="d-label">Gini</p>
        <p class="text-[0.6875rem]" style="color: var(--d-text-2);">
          {giniLabel(distribution.gini)}
        </p>
      </div>
      <p class="d-numeric text-lg font-semibold" style="color: var(--d-text);">
        {distribution.gini.toFixed(3)}
      </p>
    </div>

    <div class="border-t px-5 py-4" style="border-color: var(--d-border);">
      <p class="d-label mb-3">
        Holders by tier
        {#if rankedShown && distribution}
          <span class="font-normal normal-case tracking-normal" style="color: var(--d-text-3);">
            · top {count(distribution.rankedCount)} of {count(distribution.ownerCount)}
          </span>
        {/if}
      </p>
      {#each tiers as row (row.tierId)}
        <div class="mb-2.5 flex items-center gap-3 last:mb-0">
          <span class="w-28 shrink-0 truncate text-xs" style="color: var(--d-text-2);">
            {row.tier?.name}
          </span>
          <div class="h-1 flex-1 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
            <div
              class="h-full rounded-full"
              style="width: {(row.count / maxCount) * 100}%; background: var(--d-accent);"
            />
          </div>
          <span class="d-numeric w-12 shrink-0 text-right text-xs" style="color: var(--d-text);">
            {count(row.count)}
          </span>
        </div>
      {/each}
    </div>
    {#if hasCoverage}
      <p
        class="border-t px-5 py-2.5 text-[0.625rem] leading-relaxed"
        style="border-color: var(--d-border); color: {capped ? 'var(--d-down)' : 'var(--d-text-3)'};"
      >
        {#if capped}
          <strong style="color: var(--d-text-2);">Coverage {pct(coverage, 1)} of supply.</strong>
          {count(distribution.ownerCount)} holders found, {count(distribution.rankedCount)} ranked.
          The token-account walk is time-bounded and stopped short, so the shares above are a
          floor rather than a total.
        {:else}
          <strong style="color: var(--d-text-2);">Coverage {pct(coverage, 1)} of supply.</strong>
          {count(distribution.ownerCount)} holders found, {count(distribution.rankedCount)} ranked.
        {/if}
      </p>
    {/if}
  {:else}
    <p class="px-5 py-10 text-center text-[0.8125rem]" style="color: var(--d-text-3);">
      Unlocks with the holder index.
    </p>
  {/if}
</section>
