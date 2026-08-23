<script lang="ts">
  // Live swap tape for the deepest pool.
  //
  // Dust is filtered server-side, so every row here is a print large enough to
  // be worth seeing. Rows link to Solscan because the point of a tape is being
  // able to go verify a trade yourself.

  import { onDestroy, onMount } from 'svelte';
  import type { TradeEvent } from '$lib/dashboard/types';
  import { compact, relativeAge, shortAddress, usd, usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';

  export let initial: TradeEvent[] = [];

  const REFRESH_MS = 20_000;
  /** A print at or above this notional gets the whale marker. */
  const WHALE_USD = 10_000;

  let trades: TradeEvent[] = initial;
  let failed = initial.length === 0;
  let now = Date.now();
  let filter: 'all' | 'buy' | 'sell' = 'all';
  let timer: ReturnType<typeof setInterval>;
  let clock: ReturnType<typeof setInterval>;

  async function refresh() {
    try {
      const res = await fetch('/api/dashboard/trades');
      if (!res.ok) throw new Error(String(res.status));
      const payload = (await res.json()) as { trades: TradeEvent[] };
      trades = payload.trades;
      failed = false;
    } catch {
      // Keep the last tape on screen; the age stamps make staleness obvious.
      failed = trades.length === 0;
    }
  }

  onMount(() => {
    if (trades.length === 0) refresh();
    timer = setInterval(refresh, REFRESH_MS);
    clock = setInterval(() => (now = Date.now()), 1000);
  });

  onDestroy(() => {
    clearInterval(timer);
    clearInterval(clock);
  });

  $: visible = filter === 'all' ? trades : trades.filter((t) => t.kind === filter);
  $: buyVolume = trades.filter((t) => t.kind === 'buy').reduce((s, t) => s + t.amountUsd, 0);
  $: sellVolume = trades.filter((t) => t.kind === 'sell').reduce((s, t) => s + t.amountUsd, 0);
  $: netFlow = buyVolume - sellVolume;

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'buy', label: 'Buys' },
    { key: 'sell', label: 'Sells' }
  ] as const;
</script>

<section class="d-card flex flex-col overflow-hidden">
  <header
    class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
    style="border-color: var(--d-border);"
  >
    <h2 class="flex items-center gap-2 text-sm font-semibold" style="color: var(--d-text);">
      Live Tape
      <span class="h-1.5 w-1.5 animate-pulse rounded-full" style="background: var(--d-accent);" aria-hidden="true" />
      <InfoTip label="Live Tape" text="Individual swaps above $250 as they land, newest first, refreshing every 20 seconds. Aggregates hide who is actually moving; every row links to Solscan so you can verify the trade yourself." />
    </h2>

    <div class="flex gap-0.5" role="group" aria-label="Filter trades">
      {#each FILTERS as f (f.key)}
        <button
          type="button"
          class="rounded px-2 py-1 text-[0.6875rem] font-semibold transition-colors"
          style={filter === f.key
            ? 'background: var(--d-accent-soft); color: var(--d-accent);'
            : 'background: transparent; color: var(--d-text-3);'}
          aria-pressed={filter === f.key}
          on:click={() => (filter = f.key)}
        >
          {f.label}
        </button>
      {/each}
    </div>
  </header>

  {#if trades.length > 0}
    <div
      class="grid grid-cols-3 border-b"
      style="border-color: var(--d-border); background: var(--d-surface-2);"
    >
      <div class="px-5 py-2.5">
        <p class="d-label">Buy vol</p>
        <p class="d-numeric mt-0.5 text-xs font-semibold" style="color: var(--d-up);">
          {usdCompact(buyVolume)}
        </p>
      </div>
      <div class="px-5 py-2.5" style="border-left: 1px solid var(--d-border);">
        <p class="d-label">Sell vol</p>
        <p class="d-numeric mt-0.5 text-xs font-semibold" style="color: var(--d-down);">
          {usdCompact(sellVolume)}
        </p>
      </div>
      <div class="px-5 py-2.5" style="border-left: 1px solid var(--d-border);">
        <p class="d-label">Net flow</p>
        <p
          class="d-numeric mt-0.5 text-xs font-semibold"
          style="color: {netFlow >= 0 ? 'var(--d-up)' : 'var(--d-down)'};"
        >
          {netFlow >= 0 ? '+' : '−'}{usdCompact(Math.abs(netFlow))}
        </p>
      </div>
    </div>

    <ul class="max-h-[360px] overflow-y-auto">
      {#each visible as trade, i (trade.txHash + trade.timestamp)}
        {@const isBuy = trade.kind === 'buy'}
        {@const tone = isBuy ? 'var(--d-up)' : 'var(--d-down)'}
        <li>
          <a
            href="https://solscan.io/tx/{trade.txHash}"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-[var(--d-hover)]"
            style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};"
          >
            <span class="d-numeric w-9 shrink-0 text-[0.6875rem] font-semibold" style="color: {tone};">
              {isBuy ? 'BUY' : 'SELL'}
            </span>

            <span class="d-numeric flex-1 text-xs font-semibold" style="color: var(--d-text);">
              {usd(trade.amountUsd, 0)}{#if trade.amountUsd >= WHALE_USD}<span
                  class="ml-1"
                  title="Whale print"
                  aria-label="Whale print">🐋</span
                >{/if}
            </span>

            <span class="d-numeric hidden text-[0.6875rem] sm:block" style="color: var(--d-text-2);">
              {compact(trade.tokenAmount)}
            </span>

            <span class="d-numeric hidden text-[0.6875rem] md:block" style="color: var(--d-text-3);">
              {shortAddress(trade.wallet)}
            </span>

            <span
              class="d-numeric w-14 shrink-0 text-right text-[0.6875rem]"
              style="color: var(--d-text-3);"
            >
              {now && relativeAge(trade.timestamp)}
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {:else}
    <div class="flex flex-1 flex-col items-center justify-center gap-1.5 px-5 py-12 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">
        {failed ? 'Trade feed unavailable' : 'Waiting for trades'}
      </p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        The provider rate-limits its free tier. The tape recovers on the next refresh.
      </p>
    </div>
  {/if}
</section>
