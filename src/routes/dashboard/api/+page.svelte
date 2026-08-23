<script lang="ts">
  // Public API reference.
  //
  // The dashboard's own endpoints were already public and cached; documenting
  // them costs nothing and turns the site from a page into something other
  // people can build on. Every route here is read-only.

  import { ANSEM_MINT } from '$lib/tiers';

  interface Endpoint {
    path: string;
    summary: string;
    returns: string;
    cache: string;
    note?: string;
  }

  const BASE = 'https://ansemherd.online';

  const ENDPOINTS: Endpoint[] = [
    {
      path: '/api/dashboard/snapshot',
      summary: 'Everything on the dashboard in one payload.',
      returns:
        'Price, market cap, supply, liquidity by pool, trading windows, depth ladder, risk profile, contract authorities, market context, pulse, rhythm and provider status.',
      cache: '15s'
    },
    {
      path: '/api/dashboard/chart?range=24h',
      summary: 'OHLCV candles for the deepest pool.',
      returns: 'Open, high, low, close and volume per candle, plus the window change, high and low.',
      cache: '30s–5m by range',
      note: 'range: 1h · 24h · 7d · 30d · all'
    },
    {
      path: '/api/dashboard/trades',
      summary: 'Recent swaps above $250, newest first.',
      returns: 'Direction, USD size, token amount, price, wallet and transaction hash.',
      cache: '15s'
    },
    {
      path: '/api/dashboard/holders?page=1&pageSize=50',
      summary: 'Ranked holder list.',
      returns: 'Rank, owner, balance, share of supply, tier, and a label when the address is a known pool.',
      cache: '2m',
      note: 'pageSize caps at 250. Returns 503 until an indexing provider is configured.'
    },
    {
      path: '/api/dashboard/rank/{wallet}',
      summary: 'Where one address sits among all holders.',
      returns: 'Rank, percentile, balance, live value, share of supply, tier and distance to the next tier.',
      cache: '30s',
      note: 'Rate limited to 30 requests a minute per IP. Rank is null outside the ranked slice.'
    }
  ];

  const SAMPLE = `curl ${BASE}/api/dashboard/snapshot`;

  let copied = '';

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied = id;
      setTimeout(() => (copied = ''), 1600);
    } catch {
      // clipboard unavailable
    }
  }
</script>

<svelte:head>
  <title>API — ANSEM Analytics</title>
  <meta
    name="description"
    content="Free read-only JSON API for $ANSEM on Solana: price, candles, trades, holders and wallet rank. No key required."
  />
</svelte:head>

<div class="mx-auto max-w-[820px] px-6 py-10 max-md:px-4 max-md:py-7">
  <header class="mb-8">
    <p class="d-label">API</p>
    <h1 class="mt-2 text-2xl font-semibold tracking-tight max-md:text-xl" style="color: var(--d-text);">
      Every number on this dashboard, as JSON
    </h1>
    <p class="mt-3 text-sm leading-relaxed" style="color: var(--d-text-2);">
      The same endpoints the dashboard itself calls, open for anyone to use. No key, no signup, no
      quota beyond a per-IP limit on the wallet lookup. Responses are cached, so hammering them
      costs a cache hit rather than an upstream call.
    </p>
  </header>

  <section class="mb-8">
    <div class="d-card overflow-hidden">
      <div
        class="flex items-center justify-between gap-3 border-b px-5 py-2.5"
        style="border-color: var(--d-border); background: var(--d-surface-2);"
      >
        <span class="d-label">Try it</span>
        <button
          type="button"
          class="text-[0.6875rem] font-semibold transition-colors"
          style="color: {copied === 'sample' ? 'var(--d-accent)' : 'var(--d-text-3)'};"
          on:click={() => copy(SAMPLE, 'sample')}
        >
          {copied === 'sample' ? 'copied' : 'copy'}
        </button>
      </div>
      <pre
        class="d-numeric overflow-x-auto px-5 py-3.5 text-[0.75rem]"
        style="color: var(--d-text);">{SAMPLE}</pre>
    </div>
  </section>

  <section class="mb-8">
    <h2 class="mb-3 text-sm font-semibold" style="color: var(--d-text);">Endpoints</h2>
    <div class="flex flex-col gap-2.5">
      {#each ENDPOINTS as endpoint (endpoint.path)}
        <div class="d-card overflow-hidden">
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-2.5"
            style="border-color: var(--d-border);"
          >
            <code class="d-numeric min-w-0 truncate text-xs font-semibold" style="color: var(--d-accent);">
              GET {endpoint.path}
            </code>
            <span class="d-numeric shrink-0 text-[0.625rem]" style="color: var(--d-text-3);">
              cached {endpoint.cache}
            </span>
          </div>
          <div class="px-5 py-3.5">
            <p class="text-[0.8125rem] font-medium" style="color: var(--d-text);">
              {endpoint.summary}
            </p>
            <p class="mt-1 text-[0.8125rem] leading-relaxed" style="color: var(--d-text-2);">
              {endpoint.returns}
            </p>
            {#if endpoint.note}
              <p class="mt-1.5 text-[0.6875rem]" style="color: var(--d-text-3);">{endpoint.note}</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section class="mb-8">
    <h2 class="mb-3 text-sm font-semibold" style="color: var(--d-text);">Notes</h2>
    <div class="d-card overflow-hidden">
      {#each [{ k: 'Token', v: ANSEM_MINT }, { k: 'Chain', v: 'Solana mainnet' }, { k: 'CORS', v: 'Open on all read-only routes' }, { k: 'Auth', v: 'None' }, { k: 'Errors', v: '400 invalid input · 429 rate limited · 503 provider unavailable' }] as row, i (row.k)}
        <div
          class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3"
          style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};"
        >
          <span class="text-[0.8125rem]" style="color: var(--d-text);">{row.k}</span>
          <span class="d-numeric min-w-0 break-all text-right text-[0.6875rem]" style="color: var(--d-text-3);">
            {row.v}
          </span>
        </div>
      {/each}
    </div>
    <p class="mt-2.5 text-[0.6875rem] leading-relaxed" style="color: var(--d-text-3);">
      Nulls in a response mean a figure was not measured, never that it is zero. Where a provider
      rate-limits, the last good payload is served rather than a blank one.
    </p>
  </section>

  <a
    href="/dashboard"
    class="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--d-hover)]"
    style="border-color: var(--d-border); color: var(--d-text);"
  >
    ← Back to the dashboard
  </a>
</div>
