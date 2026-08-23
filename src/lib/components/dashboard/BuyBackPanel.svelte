<script lang="ts">
  // "What if you had bought?" — priced off the real daily close history.
  //
  // Deliberately a date picker rather than a single launch-day headline. The
  // launch figure is enormous because the first candle is the bonding curve's
  // opening minutes, a price almost nobody actually got. Showing only that
  // number would be advertising, not analytics; letting anyone pick a date and
  // labelling the launch entry for what it is keeps it honest while still
  // showing the real move.

  import { onMount } from 'svelte';
  import type { Candle, PriceSeries } from '$lib/dashboard/types';
  import { compact, usd, usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';

  export let priceUsd: number;

  const AMOUNTS = [100, 1_000, 10_000];

  let candles: Candle[] = [];
  let loading = true;
  let failed = false;
  let amount = 100;
  let index = 0;

  onMount(async () => {
    try {
      const res = await fetch('/api/dashboard/chart?range=all');
      if (!res.ok) throw new Error(String(res.status));
      const series = (await res.json()) as PriceSeries;
      candles = series.candles.filter((c) => c.c > 0);
      index = 0;
    } catch {
      failed = true;
    } finally {
      loading = false;
    }
  });

  function label(candle: Candle): string {
    return new Date(candle.t).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /** Jump the slider to roughly N days before the end of the series. */
  function jumpTo(daysAgo: number) {
    index = Math.max(0, candles.length - 1 - daysAgo);
  }

  $: entry = candles[index] ?? null;
  $: isLaunchDay = index === 0;
  $: tokens = entry && entry.c > 0 ? amount / entry.c : 0;
  $: nowValue = tokens * priceUsd;
  $: multiple = entry && entry.c > 0 ? priceUsd / entry.c : 0;
  $: changePct = (multiple - 1) * 100;
  $: up = changePct >= 0;
  $: daysHeld = entry ? Math.round((Date.now() - entry.t) / 86_400_000) : 0;
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">
      If You Had Bought
      <InfoTip
        label="If You Had Bought"
        text="Priced off the real daily close history, not a projection. Pick a date and an amount to see what the position would be worth now. The launch entry is the bonding curve's opening day — a price almost nobody actually got — so treat that figure as the token's full range rather than a realistic entry."
      />
    </h2>
    {#if entry}
      <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
        {daysHeld === 0 ? 'today' : `${daysHeld}d held`}
      </span>
    {/if}
  </header>

  {#if loading}
    <div class="animate-pulse px-5 py-10" aria-hidden="true">
      <div class="h-16 rounded-lg" style="background: var(--d-bg-subtle);" />
    </div>
  {:else if failed || candles.length < 2}
    <div class="flex flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">Price history unavailable</p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        The OHLCV provider did not respond on this refresh.
      </p>
    </div>
  {:else}
    <!-- Amount -->
    <div class="flex items-center gap-2 border-b px-5 py-3" style="border-color: var(--d-border);">
      <span class="d-label shrink-0">Invest</span>
      <div class="flex gap-1">
        {#each AMOUNTS as a (a)}
          <button
            type="button"
            class="d-numeric rounded px-2 py-1 text-[0.6875rem] font-semibold transition-colors d-tap"
            style={amount === a
              ? 'background: var(--d-accent-soft); color: var(--d-accent-ink);'
              : 'background: transparent; color: var(--d-text-3);'}
            aria-pressed={amount === a}
            on:click={() => (amount = a)}
          >
            {usdCompact(a)}
          </button>
        {/each}
      </div>
    </div>

    <!-- Result -->
    <div class="px-5 py-4" style="background: var(--d-surface-2);">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="d-label">Worth today</p>
          <p
            class="d-numeric mt-1 text-2xl font-semibold leading-none"
            style="color: {up ? 'var(--d-up)' : 'var(--d-down)'};"
          >
            {usd(nowValue, nowValue < 1000 ? 2 : 0)}
          </p>
        </div>
        <div class="text-right">
          <p class="d-numeric text-sm font-semibold" style="color: {up ? 'var(--d-up)' : 'var(--d-down)'};">
            {multiple >= 2 ? `${compact(multiple)}×` : `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`}
          </p>
          <p class="d-numeric mt-0.5 text-[0.6875rem]" style="color: var(--d-text-3);">
            {compact(tokens)} ANSEM
          </p>
        </div>
      </div>
    </div>

    <!-- Entry date -->
    <div class="border-t px-5 py-3.5" style="border-color: var(--d-border);">
      <div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span class="d-label">Entry</span>
        <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-2);">
          {entry ? label(entry) : '—'} @ {entry ? usd(entry.c, 8) : '—'}
        </span>
      </div>

      <input
        type="range"
        min="0"
        max={candles.length - 1}
        bind:value={index}
        aria-label="Entry date"
        class="entry-slider w-full"
      />

      <div class="mt-2 flex flex-wrap gap-1">
        <button
          type="button"
          class="d-tap rounded px-2 py-0.5 text-[0.625rem] font-semibold transition-colors"
          style={isLaunchDay
            ? 'background: var(--d-accent-soft); color: var(--d-accent-ink);'
            : 'background: transparent; color: var(--d-text-3);'}
          on:click={() => (index = 0)}
        >
          Launch
        </button>
        {#each [30, 14, 7] as d (d)}
          <button
            type="button"
            class="d-tap rounded px-2 py-0.5 text-[0.625rem] font-semibold transition-colors"
            style="background: transparent; color: var(--d-text-3);"
            on:click={() => jumpTo(d)}
          >
            {d}d ago
          </button>
        {/each}
      </div>

      {#if isLaunchDay}
        <p class="mt-2 text-[0.625rem] leading-relaxed" style="color: var(--d-text-3);">
          That is the bonding curve's opening day. Almost nobody bought at this price — it shows
          the token's full range, not a realistic entry.
        </p>
      {/if}
    </div>
  {/if}
</section>

<style>
  .entry-slider {
    appearance: none;
    height: 4px;
    border-radius: 9999px;
    background: var(--d-bg-subtle);
    outline: none;
  }

  .entry-slider::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 9999px;
    background: var(--d-accent);
    cursor: pointer;
    border: 2px solid var(--d-surface);
  }

  .entry-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 2px solid var(--d-surface);
    border-radius: 9999px;
    background: var(--d-accent);
    cursor: pointer;
  }
</style>
