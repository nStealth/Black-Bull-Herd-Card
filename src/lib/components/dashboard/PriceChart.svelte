<script lang="ts">
  // Price history with a range switcher, drawn as inline SVG.
  //
  // Hand-rolled rather than pulled from a charting library: the whole surface is
  // one area path, one line and a volume strip, and a library would cost more
  // bundle than the rest of the dashboard combined. The viewBox is fixed and the
  // SVG scales to its container, so there is no resize observer either.

  import { onMount } from 'svelte';
  import type { Candle, ChartRange, PriceSeries } from '$lib/dashboard/types';
  import { usd, usdCompact } from '$lib/dashboard/format';

  export let initial: PriceSeries | null = null;

  const RANGES: { key: ChartRange; label: string }[] = [
    { key: '1h', label: '1H' },
    { key: '24h', label: '24H' },
    { key: '7d', label: '7D' },
    { key: '30d', label: '30D' },
    { key: 'all', label: 'ALL' }
  ];

  const W = 1000;
  const H = 260;
  const VOL_H = 40;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 20;

  /**
   * `series` is the single source of truth for what is drawn *and* which range
   * reads as active. A failed fetch must never leave the previous range's
   * candles on screen under the newly-clicked label, so the selection only
   * moves once data for it actually arrives.
   */
  let series: PriceSeries | null = initial;
  let pending: ChartRange | null = null;
  let loading = false;
  /** Range whose last fetch failed, surfaced inline and cleared on the next try. */
  let failedRange: ChartRange | null = null;
  let cursor: number | null = null;

  // Cache per range so flipping back and forth does not refetch.
  const seen = new Map<ChartRange, PriceSeries>();
  if (initial) seen.set(initial.range, initial);

  async function select(next: ChartRange) {
    if (next === range && series) return;
    cursor = null;
    failedRange = null;

    const hit = seen.get(next);
    if (hit) {
      series = hit;
      return;
    }

    pending = next;
    loading = true;
    try {
      const res = await fetch(`/api/dashboard/chart?range=${next}`);
      if (!res.ok) throw new Error(String(res.status));
      const payload = (await res.json()) as PriceSeries;
      seen.set(next, payload);
      // A slow response for an abandoned range must not replace a newer one.
      if (pending === next) series = payload;
    } catch {
      if (pending === next) failedRange = next;
    } finally {
      if (pending === next) {
        pending = null;
        loading = false;
      }
    }
  }

  onMount(() => {
    if (!initial) select('24h');
  });

  /** What is actually on screen — never the range the user merely clicked. */
  $: range = series?.range ?? pending ?? '24h';
  $: failedLabel = failedRange
    ? (RANGES.find((r) => r.key === failedRange)?.label ?? failedRange)
    : null;

  $: candles = series?.candles ?? [];
  $: rising = (series?.changePct ?? 0) >= 0;
  $: stroke = rising ? 'var(--d-up)' : 'var(--d-down)';

  // Scales. The price band is padded by 6% so the line never touches the frame.
  $: lo = candles.length ? Math.min(...candles.map((c) => c.l)) : 0;
  $: hi = candles.length ? Math.max(...candles.map((c) => c.h)) : 1;
  $: bandSpan = hi - lo || hi || 1;
  $: yMin = lo - bandSpan * 0.06;
  $: yMax = hi + bandSpan * 0.06;

  const plotH = H - PAD_TOP - PAD_BOTTOM - VOL_H;

  function x(i: number, total: number): number {
    if (total <= 1) return W / 2;
    return (i / (total - 1)) * W;
  }

  function y(price: number): number {
    const t = (price - yMin) / (yMax - yMin || 1);
    return PAD_TOP + (1 - t) * plotH;
  }

  $: linePath = candles
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${x(i, candles.length).toFixed(2)},${y(c.c).toFixed(2)}`)
    .join(' ');

  $: areaPath = candles.length
    ? `${linePath} L${W},${PAD_TOP + plotH} L0,${PAD_TOP + plotH} Z`
    : '';

  $: maxVol = candles.length ? Math.max(...candles.map((c) => c.v)) || 1 : 1;
  $: volBarW = candles.length > 1 ? Math.max(1, (W / candles.length) * 0.6) : 6;

  $: gridLines = [0, 0.5, 1].map((f) => y(yMax - (yMax - yMin) * f));

  $: active = cursor !== null ? (candles[cursor] ?? null) : null;

  function onMove(event: PointerEvent) {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || candles.length === 0) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const i = Math.round(ratio * (candles.length - 1));
    cursor = Math.min(Math.max(i, 0), candles.length - 1);
  }

  function stamp(candle: Candle): string {
    const d = new Date(candle.t);
    if (range === '1h' || range === '24h') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (range === 'all') {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
  }
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">Price History</h2>

    <div class="flex gap-0.5" role="group" aria-label="Chart range">
      {#each RANGES as r (r.key)}
        <button
          type="button"
          class="d-numeric rounded px-2 py-1 text-[0.6875rem] font-semibold transition-colors"
          style={range === r.key
            ? 'background: var(--d-accent-soft); color: var(--d-accent);'
            : 'background: transparent; color: var(--d-text-3);'}
          aria-pressed={range === r.key}
          class:animate-pulse={pending === r.key}
          disabled={loading}
          on:click={() => select(r.key)}
        >
          {r.label}
        </button>
      {/each}
    </div>
  </header>

  <div class="px-5 py-4">
    {#if series && candles.length > 1}
      <div class="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span class="d-numeric text-xl font-semibold leading-none" style="color: var(--d-text);">
          {usd(active?.c ?? candles[candles.length - 1].c, 6)}
        </span>
        <span class="d-numeric text-xs font-semibold" style="color: {stroke};">
          {rising ? '▲' : '▼'} {Math.abs(series.changePct).toFixed(2)}%
        </span>
        <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
          H {usd(series.high, 6)} · L {usd(series.low, 6)} · Vol {usdCompact(series.volumeUsd)}
        </span>
      </div>

      {#if failedLabel}
        <p class="mb-2 text-[0.6875rem]" style="color: var(--d-down);" role="status">
          {failedLabel} did not load — the OHLCV provider rate-limits its free tier. Showing
          {RANGES.find((r) => r.key === range)?.label ?? range}.
        </p>
      {/if}

      <svg
        viewBox="0 0 {W} {H}"
        class="w-full touch-pan-y select-none"
        style="height: {H}px;"
        preserveAspectRatio="none"
        role="img"
        aria-label="{range} price chart, {series.changePct >= 0 ? '+' : ''}{series.changePct.toFixed(2)}%"
        on:pointermove={onMove}
        on:pointerleave={() => (cursor = null)}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={stroke} stop-opacity="0.18" />
            <stop offset="100%" stop-color={stroke} stop-opacity="0" />
          </linearGradient>
        </defs>

        {#each gridLines as gy (gy)}
          <line
            x1="0"
            y1={gy}
            x2={W}
            y2={gy}
            stroke="var(--d-border)"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        {/each}

        <path d={areaPath} fill="url(#chart-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          stroke-width="1.75"
          stroke-linejoin="round"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />

        {#each candles as c, i (c.t)}
          <rect
            x={x(i, candles.length) - volBarW / 2}
            y={H - PAD_BOTTOM - (c.v / maxVol) * VOL_H}
            width={volBarW}
            height={Math.max(0.5, (c.v / maxVol) * VOL_H)}
            fill={c.c >= c.o ? 'var(--d-up)' : 'var(--d-down)'}
            opacity="0.22"
          />
        {/each}

        {#if cursor !== null && active}
          <line
            x1={x(cursor, candles.length)}
            y1={PAD_TOP}
            x2={x(cursor, candles.length)}
            y2={H - PAD_BOTTOM}
            stroke="var(--d-border-strong)"
            stroke-width="1"
            stroke-dasharray="3 3"
            vector-effect="non-scaling-stroke"
          />
          <circle
            cx={x(cursor, candles.length)}
            cy={y(active.c)}
            r="3.5"
            fill={stroke}
            stroke="var(--d-surface)"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
          />
        {/if}
      </svg>

      <div class="mt-1 flex justify-between text-[0.6875rem]" style="color: var(--d-text-3);">
        {#if active}
          <span class="d-numeric">{stamp(active)}</span>
          <span class="d-numeric">Vol {usdCompact(active.v)}</span>
        {:else}
          <span class="d-numeric">{stamp(candles[0])}</span>
          <span class="d-numeric">{stamp(candles[candles.length - 1])}</span>
        {/if}
      </div>
    {:else if loading}
      <div
        class="animate-pulse rounded-lg"
        style="height: {H}px; background: var(--d-bg-subtle);"
        aria-hidden="true"
      />
    {:else}
      <div
        class="flex flex-col items-center justify-center gap-1.5 text-center"
        style="height: {H}px;"
      >
        <p class="text-sm font-medium" style="color: var(--d-text);">
          {failedRange ? 'Price history did not load' : 'No candles for this range'}
        </p>
        <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
          {failedRange
            ? 'The OHLCV provider rate-limits its free tier. This recovers on the next refresh.'
            : 'This pool has no trades in the selected window.'}
        </p>
      </div>
    {/if}
  </div>
</section>
