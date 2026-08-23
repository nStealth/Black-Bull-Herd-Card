<script lang="ts">
  // ANSEM against SOL over the same windows.
  //
  // A token up 60% while its chain is up 28% did something of its own; up 60%
  // while the chain is up 55% mostly went along for the ride. Showing both is
  // what separates the two, and the gap between them is the only number here
  // that is not published somewhere else already.

  import type { ActivityStats, Benchmark } from '$lib/dashboard/types';
  import { signedPct } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';

  export let benchmark: Benchmark | null;
  export let activity: ActivityStats | null;
  export let symbol: string;

  interface Row {
    key: string;
    label: string;
    token: number | null;
    bench: number | null;
  }

  $: rows = [
    {
      key: '7d',
      label: '7 days',
      token: activity?.d7?.priceChangePct ?? null,
      bench: benchmark?.change7dPct ?? null
    },
    {
      key: '30d',
      label: '30 days',
      token: activity?.d30?.priceChangePct ?? null,
      bench: benchmark?.change30dPct ?? null
    }
  ] satisfies Row[];

  function tone(v: number | null): string {
    if (v === null) return 'var(--d-text-3)';
    return v >= 0 ? 'var(--d-up)' : 'var(--d-down)';
  }

  /** Bar width relative to the larger of the two moves in the row. */
  function width(value: number | null, other: number | null): number {
    if (value === null) return 0;
    const peak = Math.max(Math.abs(value), Math.abs(other ?? 0), 1);
    return (Math.abs(value) / peak) * 100;
  }
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">
      vs Solana
      <InfoTip
        label="vs Solana"
        text="The token's move next to SOL's over the same window. A token up 60% while the chain is up 28% moved on its own; up 60% while the chain is up 55% mostly went along for the ride. SOL's figures come from CoinGecko's daily closes."
      />
    </h2>
    {#if benchmark}
      <span class="text-[0.6875rem]" style="color: var(--d-text-3);">relative strength</span>
    {/if}
  </header>

  {#if benchmark}
    {#each rows as row, i (row.key)}
      {@const gap = row.token !== null && row.bench !== null ? row.token - row.bench : null}
      <div class="px-5 py-3.5" style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};">
        <div class="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
          <span class="d-numeric text-xs font-semibold" style="color: var(--d-text-2);">
            {row.label}
          </span>
          {#if gap !== null}
            <span
              class="d-numeric text-[0.6875rem] font-semibold"
              style="color: {gap >= 0 ? 'var(--d-up)' : 'var(--d-down)'};"
            >
              {gap >= 0 ? 'outperforming' : 'lagging'} by {Math.abs(gap).toFixed(1)} pts
            </span>
          {/if}
        </div>

        {#each [{ name: symbol, v: row.token, other: row.bench, accent: true }, { name: 'SOL', v: row.bench, other: row.token, accent: false }] as bar (bar.name)}
          <div class="mb-1.5 flex items-center gap-2.5 last:mb-0">
            <span
              class="d-numeric w-12 shrink-0 text-[0.6875rem] font-semibold"
              style="color: {bar.accent ? 'var(--d-text)' : 'var(--d-text-3)'};"
            >
              {bar.name}
            </span>
            <div class="h-1.5 flex-1 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
              <div
                class="h-full rounded-full transition-[width] duration-500"
                style="width: {width(bar.v, bar.other)}%; background: {tone(bar.v)};
                       opacity: {bar.accent ? 1 : 0.55};"
              />
            </div>
            <span
              class="d-numeric w-16 shrink-0 text-right text-[0.6875rem] font-semibold"
              style="color: {tone(bar.v)};"
            >
              {bar.v === null ? '—' : signedPct(bar.v, 1)}
            </span>
          </div>
        {/each}
      </div>
    {/each}
  {:else}
    <div class="flex flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">Benchmark unavailable</p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        CoinGecko did not return SOL's history on this refresh.
      </p>
    </div>
  {/if}
</section>
