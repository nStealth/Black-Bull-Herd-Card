<script lang="ts">
  // How much a trade of a given size actually costs in slippage.
  //
  // These are real router quotes, not reserve maths. The deepest pools here are
  // concentrated-liquidity, where constant-product estimates from published
  // reserves are simply wrong, so the numbers come from the same router a
  // trader would route through.

  import type { DepthLadder, DepthStep } from '$lib/dashboard/types';
  import { compact, usd, usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';

  export let depth: DepthLadder | null;

  /** Slippage bands. Below 1% is noise; past 5% you are moving the market. */
  const LOW = 1;
  const HIGH = 5;

  function tone(step: DepthStep): string {
    if (step.impactPct === null) return 'var(--d-text-3)';
    if (step.impactPct < LOW) return 'var(--d-up)';
    if (step.impactPct < HIGH) return 'var(--d-warn-ink)';
    return 'var(--d-down)';
  }

  function label(step: DepthStep): string {
    if (step.impactPct === null) return 'no route';
    // The router reports a flat 0 for trades below its precision. Printing
    // "0.00%" would claim a free trade, which is never true.
    if (step.impactPct === 0) return '<0.01%';
    return `${step.impactPct.toFixed(2)}%`;
  }

  /** Bar width, capped so a 15% print does not blow out the row. */
  function width(step: DepthStep): number {
    if (step.impactPct === null) return 0;
    return Math.min(100, (step.impactPct / 20) * 100);
  }

  $: rows = depth
    ? depth.buys.map((buy, i) => ({ usd: buy.usd, buy, sell: depth.sells[i] }))
    : [];

  /*
    Calculator. The ladder answers four fixed sizes; nobody trades in exactly
    those. This quotes whatever the visitor types, live, and shows the venues
    the router would split across — a route across three pools explains a
    slippage figure far better than the figure on its own.
  */
  interface Quote {
    usd: number;
    side: 'buy' | 'sell';
    impactPct: number | null;
    outAmount: number | null;
    route: string[];
  }

  const SIDES: readonly ('buy' | 'sell')[] = ['buy', 'sell'];

  let amountInput = '25000';
  let side: 'buy' | 'sell' = 'buy';
  let quote: Quote | null = null;
  let quoting = false;
  let quoteError = '';

  $: amount = Number(amountInput.replace(/[^0-9.]/g, ''));
  $: canQuote = Number.isFinite(amount) && amount >= 10 && !quoting;

  async function runQuote() {
    if (!canQuote) return;
    quoting = true;
    quoteError = '';
    try {
      const res = await fetch(`/api/dashboard/quote?usd=${Math.round(amount)}&side=${side}`);
      const body = await res.json();
      if (!res.ok) {
        quoteError = body?.message ?? 'Could not quote that size.';
        quote = null;
        return;
      }
      quote = body as Quote;
    } catch {
      quoteError = 'Network error.';
      quote = null;
    } finally {
      quoting = false;
    }
  }
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">Trade Depth
      <InfoTip label="Trade Depth" text="What a market order of each size would actually cost you in slippage, quoted live by the Jupiter router across every Solana venue. This is the question a price chart never answers: whether you can get in — or out — at size." />
    </h2>
    <span class="text-[0.6875rem]" style="color: var(--d-text-3);">
      live routing · price impact
    </span>
  </header>

  {#if depth && rows.length > 0}
    <div
      class="grid grid-cols-[auto_1fr_1fr] gap-x-4 border-b px-5 py-2"
      style="border-color: var(--d-border);"
    >
      <span class="d-label">Size</span>
      <span class="d-label text-right">Buy</span>
      <span class="d-label text-right">Sell</span>
    </div>

    {#each rows as row, i (row.usd)}
      <div
        class="px-5 py-3"
        style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};"
      >
        <div class="grid grid-cols-[auto_1fr_1fr] items-baseline gap-x-4">
          <span class="d-numeric text-xs font-semibold" style="color: var(--d-text-2);">
            {usdCompact(row.usd)}
          </span>
          <span class="d-numeric text-right text-xs font-semibold" style="color: {tone(row.buy)};">
            {label(row.buy)}
          </span>
          <span class="d-numeric text-right text-xs font-semibold" style="color: {tone(row.sell)};">
            {label(row.sell)}
          </span>
        </div>

        <div class="mt-2 grid grid-cols-2 gap-2">
          {#each [row.buy, row.sell] as step (step === row.buy ? 'b' : 's')}
            <div class="h-1 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
              <div
                class="h-full rounded-full transition-[width] duration-500"
                style="width: {width(step)}%; background: {tone(step)};"
              />
            </div>
          {/each}
        </div>
      </div>
    {/each}

    <!-- Quote any size -->
    <div class="border-t px-5 py-3.5" style="border-color: var(--d-border); background: var(--d-surface-2);">
      <p class="d-label mb-2">Quote any size</p>

      <form class="flex flex-wrap gap-2" on:submit|preventDefault={runQuote}>
        <div class="flex overflow-hidden rounded-lg border" style="border-color: var(--d-border);">
          {#each SIDES as s (s)}
            <button
              type="button"
              class="d-tap px-2.5 py-1.5 text-[0.6875rem] font-semibold capitalize transition-colors"
              style={side === s
                ? `background: ${s === 'buy' ? 'var(--d-up)' : 'var(--d-down)'}; color: var(--d-bg);`
                : 'background: transparent; color: var(--d-text-3);'}
              aria-pressed={side === s}
              on:click={() => {
                side = s;
                quote = null;
              }}
            >
              {s}
            </button>
          {/each}
        </div>

        <div
          class="flex min-w-0 flex-1 items-center rounded-lg border px-2.5"
          style="border-color: var(--d-border); background: var(--d-bg-subtle);"
        >
          <span class="d-numeric shrink-0 text-xs" style="color: var(--d-text-3);">$</span>
          <input
            type="text"
            inputmode="decimal"
            bind:value={amountInput}
            aria-label="Trade size in dollars"
            class="d-numeric w-full min-w-0 bg-transparent px-1.5 py-1.5 text-xs outline-none"
            style="color: var(--d-text);"
          />
        </div>

        <button
          type="submit"
          disabled={!canQuote}
          class="shrink-0 rounded-lg px-3 py-1.5 text-[0.6875rem] font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          style="background: var(--d-accent-ink); color: var(--d-bg);"
        >
          {quoting ? 'Quoting…' : 'Quote'}
        </button>
      </form>

      {#if quoteError}
        <p class="mt-2 text-[0.6875rem]" style="color: var(--d-down);">{quoteError}</p>
      {/if}

      {#if quote}
        <div class="mt-3 grid grid-cols-3 gap-2 max-md:grid-cols-1">
          <div class="rounded-lg px-3 py-2" style="background: var(--d-bg-subtle);">
            <p class="d-label">Price impact</p>
            <p
              class="d-numeric mt-0.5 text-sm font-bold"
              style="color: {quote.impactPct === null
                ? 'var(--d-text-3)'
                : quote.impactPct < LOW
                  ? 'var(--d-up)'
                  : quote.impactPct < HIGH
                    ? 'var(--d-warn-ink)'
                    : 'var(--d-down)'};"
            >
              {quote.impactPct === null
                ? '—'
                : quote.impactPct === 0
                  ? '<0.01%'
                  : `${quote.impactPct.toFixed(2)}%`}
            </p>
          </div>
          <div class="rounded-lg px-3 py-2" style="background: var(--d-bg-subtle);">
            <p class="d-label">You receive</p>
            <p class="d-numeric mt-0.5 text-sm font-bold" style="color: var(--d-text);">
              {quote.outAmount === null
                ? '—'
                : quote.side === 'buy'
                  ? `${compact(quote.outAmount)}`
                  : usd(quote.outAmount, 0)}
            </p>
            <p class="mt-0.5 text-[0.625rem]" style="color: var(--d-text-3);">
              {quote.side === 'buy' ? 'ANSEM' : 'USDC'}
            </p>
          </div>
          <div class="rounded-lg px-3 py-2" style="background: var(--d-bg-subtle);">
            <p class="d-label">Route</p>
            <p class="mt-0.5 truncate text-xs font-semibold capitalize" style="color: var(--d-text);">
              {quote.route.length ? quote.route.join(' → ') : 'direct'}
            </p>
            <p class="mt-0.5 text-[0.625rem]" style="color: var(--d-text-3);">
              {quote.route.length > 1 ? `split across ${quote.route.length}` : 'single venue'}
            </p>
          </div>
        </div>
      {/if}
    </div>

    <p
      class="border-t px-5 py-2.5 text-[0.625rem] leading-relaxed"
      style="border-color: var(--d-border); color: var(--d-text-3);"
    >
      What a market order of that size would actually cost, routed across every Solana venue.
      Under {LOW}% is comfortable; over {HIGH}% you are moving the price yourself.
    </p>
  {:else}
    <div class="flex flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">Depth unavailable</p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        The router did not return quotes on this refresh.
      </p>
    </div>
  {/if}
</section>
