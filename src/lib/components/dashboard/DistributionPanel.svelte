<script lang="ts">
  // Supply concentration, plus how the herd splits across the card tiers.
  import type { Distribution } from '$lib/dashboard/types';
  import { TIERS } from '$lib/tiers';
  import { count, pct } from '$lib/dashboard/format';

  export let distribution: Distribution | null;

  /** Gini is unintuitive on its own, so it ships with a plain-English read. */
  function giniLabel(value: number): string {
    if (value >= 0.95) return 'Extremely concentrated';
    if (value >= 0.85) return 'Highly concentrated';
    if (value >= 0.7) return 'Concentrated';
    if (value >= 0.5) return 'Moderately spread';
    return 'Widely distributed';
  }

  $: concentration = distribution
    ? [
        { label: 'Top 10', value: distribution.top10Pct },
        { label: 'Top 50', value: distribution.top50Pct },
        { label: 'Top 100', value: distribution.top100Pct }
      ]
    : [];

  $: tierRows = distribution
    ? distribution.tierCounts
        .map((row) => ({ ...row, tier: TIERS.find((t) => t.id === row.tierId) }))
        .filter((row) => row.tier)
        .reverse()
    : [];

  $: maxTierCount = Math.max(1, ...tierRows.map((r) => r.count));
</script>

<section class="d-card p-6 max-md:p-4">
  <header class="mb-5">
    <h2 class="text-lg font-bold" style="color: var(--d-text);">Supply Distribution</h2>
    <p class="mt-0.5 text-xs" style="color: var(--d-text-muted);">
      How tightly the supply is held, and where the herd sits
    </p>
  </header>

  {#if distribution}
    <div class="grid grid-cols-3 gap-3 max-md:grid-cols-1">
      {#each concentration as item (item.label)}
        <div
          class="rounded-2xl border p-4"
          style="border-color: var(--d-border); background: var(--d-surface-solid);"
        >
          <p class="text-[0.6875rem] uppercase tracking-wider" style="color: var(--d-text-muted);">
            {item.label} hold
          </p>
          <p class="d-numeric mt-1 text-xl font-bold" style="color: var(--d-text);">
            {pct(item.value, 1)}
          </p>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full" style="background: var(--d-border);">
            <div
              class="h-full rounded-full transition-[width] duration-700"
              style="width: {Math.min(100, item.value)}%; background: var(--d-accent);"
            />
          </div>
        </div>
      {/each}
    </div>

    <div
      class="mt-4 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3"
      style="border-color: var(--d-border); background: var(--d-surface-solid);"
    >
      <div>
        <p class="text-[0.6875rem] uppercase tracking-wider" style="color: var(--d-text-muted);">
          Gini coefficient
        </p>
        <p class="text-xs" style="color: var(--d-text-secondary);">
          {giniLabel(distribution.gini)}
        </p>
      </div>
      <p class="d-numeric text-2xl font-bold" style="color: var(--d-text);">
        {distribution.gini.toFixed(3)}
      </p>
    </div>

    <h3 class="mb-3 mt-6 text-sm font-bold" style="color: var(--d-text);">Herd by Tier</h3>
    <div class="flex flex-col gap-2.5">
      {#each tierRows as row (row.tierId)}
        <div class="flex items-center gap-3">
          <span
            class="w-32 shrink-0 truncate text-xs font-semibold max-md:w-24"
            style="color: {row.tier?.color};">{row.tier?.name}</span
          >
          <div class="h-2 flex-1 overflow-hidden rounded-full" style="background: var(--d-border);">
            <div
              class="h-full rounded-full transition-[width] duration-700"
              style="width: {(row.count / maxTierCount) * 100}%; background: {row.tier?.color};"
            />
          </div>
          <span class="d-numeric w-16 shrink-0 text-right text-xs font-semibold" style="color: var(--d-text);">
            {count(row.count)}
          </span>
          <span class="d-numeric w-14 shrink-0 text-right text-[0.6875rem]" style="color: var(--d-text-muted);">
            {pct(row.supplyPct, 1)}
          </span>
        </div>
      {/each}
    </div>
  {:else}
    <p class="py-8 text-center text-sm" style="color: var(--d-text-muted);">
      Distribution analytics unlock with the holder index.
    </p>
  {/if}
</section>
