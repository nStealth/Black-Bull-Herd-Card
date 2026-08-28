<script lang="ts">
  // Standard risk measures over the daily closes, computed from the same candle
  // history the chart above draws. No score, no rating — just the numbers a
  // trader would work out themselves.

  import type { RiskProfile } from '$lib/dashboard/types';
  import { pct, signedPct } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';
  import { DERIVED } from '$lib/dashboard/sources';

  export let risk: RiskProfile | null;

  /** Rough bands for annualised realised volatility on a memecoin. */
  function volTone(v: number): string {
    if (v < 80) return 'var(--d-up)';
    if (v < 200) return 'var(--d-warn-ink)';
    return 'var(--d-down)';
  }

  function volWord(v: number): string {
    if (v < 80) return 'moderate';
    if (v < 200) return 'high';
    return 'extreme';
  }

  $: cells = risk
    ? [
        {
          key: 'vol',
          label: 'Volatility',
          value: pct(risk.volatilityPct, 0),
          meta: `annualised · ${volWord(risk.volatilityPct)}`,
          color: volTone(risk.volatilityPct)
        },
        {
          key: 'dd',
          label: 'Max drawdown',
          value: `−${pct(risk.maxDrawdownPct, 1)}`,
          meta: `worst ${risk.days}d peak-to-trough`,
          color: 'var(--d-text)'
        },
        {
          key: 'ddall',
          label: 'Deepest ever',
          value: `−${pct(risk.maxDrawdownAllPct, 1)}`,
          meta: `over ${risk.historyDays} days of history`,
          color: 'var(--d-text)'
        },
        {
          key: 'cur',
          label: 'Off local high',
          value: `−${pct(risk.currentDrawdownPct, 1)}`,
          meta: `vs ${risk.days}d high`,
          color: risk.currentDrawdownPct > 20 ? 'var(--d-down)' : 'var(--d-text)'
        },
        {
          key: 'best',
          label: 'Best day',
          value: signedPct(risk.bestDayPct, 1),
          meta: 'single close-to-close',
          color: 'var(--d-up)'
        },
        {
          key: 'worst',
          label: 'Worst day',
          value: signedPct(risk.worstDayPct, 1),
          meta: 'single close-to-close',
          color: 'var(--d-down)'
        }
      ]
    : [];
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">Risk Profile
      <InfoTip label="Risk Profile" text="Standard risk measures over daily closes from the last 30 days. Volatility is annualised realised volatility, not a rating. The window excludes the launch period, where bonding-curve moves of several thousand percent make every measure meaningless." source={DERIVED.fromCandlesDaily} />
    </h2>
    {#if risk}
      <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
        {risk.days}-day window
      </span>
    {/if}
  </header>

  {#if risk}
    <div class="grid grid-cols-3 max-md:grid-cols-2">
      {#each cells as cell, i (cell.key)}
        <div
          class="px-5 py-3.5"
          style="border-top: {i > 2 ? '1px solid var(--d-border)' : 'none'};
                 border-left: {i % 3 !== 0 ? '1px solid var(--d-border)' : 'none'};"
        >
          <p class="d-label">{cell.label}</p>
          <p class="d-numeric mt-1 text-sm font-semibold" style="color: {cell.color};">
            {cell.value}
          </p>
          <p class="mt-0.5 text-[0.625rem] leading-tight" style="color: var(--d-text-3);">
            {cell.meta}
          </p>
        </div>
      {/each}
    </div>

    <div
      class="flex items-center gap-3 border-t px-5 py-3"
      style="border-color: var(--d-border);"
    >
      <span class="d-label shrink-0">Green days</span>
      <div class="h-1 flex-1 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
        <div
          class="h-full rounded-full"
          style="width: {risk.upDayRatio}%; background: var(--d-up);"
        />
      </div>
      <span class="d-numeric shrink-0 text-xs font-semibold" style="color: var(--d-text);">
        {pct(risk.upDayRatio, 0)}
      </span>
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">Risk metrics unavailable</p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        Not enough price history on this refresh.
      </p>
    </div>
  {/if}
</section>
