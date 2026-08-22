<script lang="ts">
  // Cross-market context: where the price sits inside its 24h range, how far it
  // is from the all-time high, and where the token ranks by market cap.
  //
  // These come from CoinGecko, which aggregates every venue rather than just the
  // Solana pools, so they answer "how does this look next to everything else"
  // instead of "what did this pool do".

  import type { MarketStats } from '$lib/dashboard/types';
  import { pct, usd, usdCompact } from '$lib/dashboard/format';

  export let market: MarketStats | null;
  export let priceUsd: number;

  function day(ts: number | null): string {
    if (ts === null) return '—';
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Position of the live price inside the 24h band, clamped so a price that has
   * just broken out of the range still renders inside the bar.
   */
  $: rangePos =
    market && market.low24h !== null && market.high24h !== null && market.high24h > market.low24h
      ? Math.min(
          100,
          Math.max(0, ((priceUsd - market.low24h) / (market.high24h - market.low24h)) * 100)
        )
      : null;

  $: cells = market
    ? [
        {
          key: 'ath',
          label: 'All-time high',
          value: market.ath !== null ? usd(market.ath, 6) : '—',
          meta: day(market.athDate),
          delta: market.athChangePct
        },
        {
          key: 'atl',
          label: 'All-time low',
          value: market.atl !== null ? usd(market.atl, 6) : '—',
          meta: day(market.atlDate),
          delta: null
        },
        {
          key: 'd7',
          label: '7-day change',
          value: market.change7dPct !== null ? `${market.change7dPct >= 0 ? '+' : ''}${market.change7dPct.toFixed(2)}%` : '—',
          meta: market.volume7dUsd !== null ? `${usdCompact(market.volume7dUsd)} vol` : 'vol n/a',
          delta: null,
          tone: market.change7dPct
        },
        {
          key: 'd30',
          label: '30-day change',
          value: market.change30dPct !== null ? `${market.change30dPct >= 0 ? '+' : ''}${market.change30dPct.toFixed(2)}%` : '—',
          meta: market.volume30dUsd !== null ? `${usdCompact(market.volume30dUsd)} vol` : 'vol n/a',
          delta: null,
          tone: market.change30dPct
        }
      ]
    : [];
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex items-baseline justify-between gap-3 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">Market Context</h2>
    {#if market?.rank}
      <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
        Rank #{market.rank}
      </span>
    {/if}
  </header>

  {#if market}
    {#if rangePos !== null && market.low24h !== null && market.high24h !== null}
      <div class="border-b px-5 py-3.5" style="border-color: var(--d-border);">
        <p class="d-label">24h range</p>

        <div
          class="relative mt-2 h-1 rounded-full"
          style="background: var(--d-bg-subtle);"
          role="img"
          aria-label="Price is at {rangePos.toFixed(0)} percent of its 24 hour range"
        >
          <div
            class="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style="left: {rangePos}%; background: var(--d-accent);"
          />
        </div>

        <div class="d-numeric mt-2 flex items-baseline justify-between text-[0.6875rem]">
          <span style="color: var(--d-text-3);">{usd(market.low24h, 6)}</span>
          <span class="font-semibold" style="color: var(--d-text);">{usd(priceUsd, 6)}</span>
          <span style="color: var(--d-text-3);">{usd(market.high24h, 6)}</span>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-2">
      {#each cells as cell, i (cell.key)}
        <div
          class="px-5 py-3"
          style="border-top: {i > 1 ? '1px solid var(--d-border)' : 'none'};
                 border-left: {i % 2 === 1 ? '1px solid var(--d-border)' : 'none'};"
        >
          <p class="d-label">{cell.label}</p>
          <p
            class="d-numeric mt-1 text-sm font-semibold"
            style="color: {cell.tone !== undefined && cell.tone !== null
              ? cell.tone >= 0
                ? 'var(--d-up)'
                : 'var(--d-down)'
              : 'var(--d-text)'};"
          >
            {cell.value}
          </p>
          <p class="mt-0.5 flex items-center gap-1.5 text-[0.6875rem]" style="color: var(--d-text-3);">
            {#if cell.delta !== null && cell.delta !== undefined}
              <span class="d-numeric font-semibold" style="color: var(--d-down);">
                {cell.delta.toFixed(1)}%
              </span>
            {/if}
            <span>{cell.meta}</span>
          </p>
        </div>
      {/each}
    </div>

    {#if market.atl !== null && market.atl > 0}
      <p
        class="border-t px-5 py-2.5 text-[0.6875rem]"
        style="border-color: var(--d-border); color: var(--d-text-3);"
      >
        Up {pct(((priceUsd - market.atl) / market.atl) * 100, 0)} from the all-time low.
      </p>
    {/if}
  {:else}
    <div class="flex flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">Market context unavailable</p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        CoinGecko did not respond, or this token has no listing there yet.
      </p>
    </div>
  {/if}
</section>
