<script lang="ts">
  // Who is actually building a position, and who is leaving.
  //
  // Aggregate volume hides this completely: a 50/50 buy-sell split can be one
  // wallet quietly taking the other side of two hundred small sells. Folding the
  // tape by wallet is the only way to see it, and it is the one panel here that
  // names names.

  import type { TradeFlow, WalletFlow } from '$lib/dashboard/types';
  import { pct, shortAddress, usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';

  export let flow: TradeFlow | null;

  /** Bar width relative to the biggest mover on either side. */
  $: peak = flow
    ? Math.max(
        ...flow.accumulators.map((w) => w.netUsd),
        ...flow.distributors.map((w) => Math.abs(w.netUsd)),
        1
      )
    : 1;

  function windowLabel(minutes: number): string {
    if (minutes < 90) return `last ${minutes} min`;
    return `last ${(minutes / 60).toFixed(1)}h`;
  }

  $: sides = flow
    ? [
        { key: 'acc', title: 'Accumulating', rows: flow.accumulators, tone: 'var(--d-up)' },
        { key: 'dist', title: 'Distributing', rows: flow.distributors, tone: 'var(--d-down)' }
      ]
    : [];

  function label(w: WalletFlow): string {
    return w.entity ?? shortAddress(w.wallet, 4, 4);
  }
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">
      Wallet Flow
      <InfoTip
        label="Wallet Flow"
        text="Every trade in the window folded by wallet, buys positive and sells negative, so you can see who is building a position and who is leaving. Aggregate volume hides this — a balanced buy-sell split can be one wallet taking the other side of many small sells. The window is whatever the tape actually covers, stated in the header, not a full day."
      />
    </h2>
    {#if flow}
      <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
        {windowLabel(flow.windowMinutes)} · {flow.uniqueWallets} wallets
      </span>
    {/if}
  </header>

  {#if flow}
    <!-- Net flow -->
    <div class="px-5 py-4" style="background: var(--d-surface-2);">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="d-label">Net flow</p>
          <p
            class="d-numeric mt-1 text-2xl font-semibold leading-none"
            style="color: {flow.netUsd >= 0 ? 'var(--d-up)' : 'var(--d-down)'};"
          >
            {flow.netUsd >= 0 ? '+' : '−'}{usdCompact(Math.abs(flow.netUsd))}
          </p>
          <p class="mt-1 text-[0.6875rem]" style="color: var(--d-text-3);">
            across {flow.tradeCount} trades
          </p>
        </div>
        <div class="d-numeric text-right text-[0.6875rem]" style="color: var(--d-text-3);">
          <p><span style="color: var(--d-up);">{usdCompact(flow.buyVolumeUsd)}</span> bought</p>
          <p class="mt-0.5">
            <span style="color: var(--d-down);">{usdCompact(flow.sellVolumeUsd)}</span> sold
          </p>
        </div>
      </div>
    </div>

    <!-- Movers -->
    <div class="grid grid-cols-2 max-md:grid-cols-1">
      {#each sides as side, i (side.key)}
        <div
          class="px-5 py-3.5"
          style="border-top: 1px solid var(--d-border);
                 border-left: {i === 1 ? '1px solid var(--d-border)' : 'none'};"
        >
          <p class="d-label mb-2.5" style="color: {side.tone};">{side.title}</p>

          {#if side.rows.length === 0}
            <p class="text-[0.6875rem]" style="color: var(--d-text-3);">Nobody, this window.</p>
          {:else}
            {#each side.rows as w (w.wallet)}
              <a
                href="https://solscan.io/account/{w.wallet}"
                target="_blank"
                rel="noopener noreferrer"
                class="mb-2 block last:mb-0 transition-opacity hover:opacity-75"
              >
                <div class="flex items-baseline justify-between gap-2">
                  <span class="d-numeric min-w-0 truncate text-[0.6875rem]" style="color: var(--d-text-2);">
                    {label(w)}
                    {#if w.rank}
                      <span class="font-semibold" style="color: var(--d-accent);">#{w.rank}</span>
                    {/if}
                  </span>
                  <span class="d-numeric shrink-0 text-xs font-semibold" style="color: {side.tone};">
                    {usdCompact(Math.abs(w.netUsd))}
                  </span>
                </div>
                <div class="mt-1 h-1 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
                  <div
                    class="h-full rounded-full"
                    style="width: {(Math.abs(w.netUsd) / peak) * 100}%; background: {side.tone};"
                  />
                </div>
              </a>
            {/each}
          {/if}
        </div>
      {/each}
    </div>

    <!-- Who is moving the volume -->
    <div class="border-t px-5 py-3.5" style="border-color: var(--d-border);">
      <p class="d-label mb-2">Volume by trade size</p>
      <div class="flex h-2 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
        <div style="width: {flow.sizeSplit.retailPct}%; background: color-mix(in srgb, var(--d-accent) 35%, transparent);" />
        <div style="width: {flow.sizeSplit.midPct}%; background: color-mix(in srgb, var(--d-accent) 65%, transparent);" />
        <div style="width: {flow.sizeSplit.whalePct}%; background: var(--d-accent);" />
      </div>
      <div class="mt-2 flex flex-wrap justify-between gap-2 text-[0.625rem]" style="color: var(--d-text-3);">
        <span>under $1K · {pct(flow.sizeSplit.retailPct, 0)}</span>
        <span>$1K–$10K · {pct(flow.sizeSplit.midPct, 0)}</span>
        <span style="color: var(--d-accent);">over $10K · {pct(flow.sizeSplit.whalePct, 0)}</span>
      </div>
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">Flow unavailable</p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        The trade tape did not load on this refresh.
      </p>
    </div>
  {/if}
</section>
