<script lang="ts">
  // How hard the token is trading right now, measured against its own baseline.
  //
  // Absolute volume is unreadable without context — $600k in an hour means
  // nothing until you know the token's usual hour. Every figure here is a ratio
  // against the token itself, so it stays legible whatever the market cap.

  import type { MarketPulse } from '$lib/dashboard/types';
  import { pct, usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';

  export let pulse: MarketPulse | null;

  /** Above this the hour is genuinely busier than usual, below it quieter. */
  const HOT = 1.5;
  const COLD = 0.6;

  function paceTone(v: number): string {
    if (v >= HOT) return 'var(--d-up)';
    if (v <= COLD) return 'var(--d-text-3)';
    return 'var(--d-text)';
  }

  function paceWord(v: number): string {
    if (v >= 3) return 'exceptional';
    if (v >= HOT) return 'busy';
    if (v <= COLD) return 'quiet';
    return 'normal';
  }

  $: pace = pulse?.volumePace ?? null;
  $: shift = pulse?.buyShareShift ?? null;
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">
      Market Pulse
      <InfoTip
        label="Market Pulse"
        text="Everything here is measured against the token's own baseline rather than in absolute dollars. Pace compares this hour's volume to the average hour of the last day. Turnover is how many times the pooled liquidity, and what fraction of the market cap, changed hands in 24 hours — heavy turnover on thin liquidity means the token is being traded far harder than it is capitalised."
      />
    </h2>
    {#if pace !== null}
      <span class="text-[0.6875rem]" style="color: var(--d-text-3);">vs its own 24h average</span>
    {/if}
  </header>

  {#if pulse && pace !== null}
    <!-- Volume pace -->
    <div class="px-5 py-4" style="background: var(--d-surface-2);">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="d-label">Volume pace</p>
          <p
            class="d-numeric mt-1 text-2xl font-semibold leading-none"
            style="color: {paceTone(pace)};"
          >
            {pace.toFixed(2)}×
          </p>
          <p class="mt-1 text-[0.6875rem]" style="color: var(--d-text-3);">
            this hour is {paceWord(pace)}
          </p>
        </div>
        <div class="text-right">
          <p class="d-numeric text-sm font-semibold" style="color: var(--d-text);">
            {usdCompact(pulse.hourVolumeUsd)}
          </p>
          <p class="mt-0.5 text-[0.6875rem]" style="color: var(--d-text-3);">
            last hour · {usdCompact(pulse.dayVolumeUsd / 24)} typical
          </p>
        </div>
      </div>

      <div class="mt-3 h-1.5 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
        <div
          class="h-full rounded-full transition-[width] duration-500"
          style="width: {Math.min(100, (pace / 3) * 100)}%; background: {paceTone(pace)};"
        />
      </div>
    </div>

    <!-- Buy pressure drift -->
    {#if pulse.buyShareNow !== null && pulse.buyShareDay !== null}
      <div class="border-t px-5 py-3.5" style="border-color: var(--d-border);">
        <div class="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
          <span class="d-label">Buy pressure</span>
          {#if shift !== null}
            <span
              class="d-numeric text-[0.6875rem] font-semibold"
              style="color: {shift >= 0 ? 'var(--d-up)' : 'var(--d-down)'};"
            >
              {shift >= 0 ? '+' : ''}{shift.toFixed(1)} pts vs 24h
            </span>
          {/if}
        </div>

        {#each [{ k: '1H', v: pulse.buyShareNow }, { k: '6H', v: pulse.buyShare6h }, { k: '24H', v: pulse.buyShareDay }] as row (row.k)}
          <div class="mb-1.5 flex items-center gap-2.5 last:mb-0">
            <span class="d-numeric w-8 shrink-0 text-[0.6875rem] font-semibold" style="color: var(--d-text-3);">
              {row.k}
            </span>
            <div class="h-1.5 flex-1 overflow-hidden rounded-full" style="background: color-mix(in srgb, var(--d-down) 30%, transparent);">
              <div
                class="h-full rounded-full transition-[width] duration-500"
                style="width: {row.v ?? 50}%; background: var(--d-up);"
              />
            </div>
            <span
              class="d-numeric w-12 shrink-0 text-right text-[0.6875rem] font-semibold"
              style="color: {(row.v ?? 50) >= 50 ? 'var(--d-up)' : 'var(--d-down)'};"
            >
              {row.v === null ? '—' : pct(row.v, 1)}
            </span>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Turnover -->
    <div class="grid grid-cols-2 border-t" style="border-color: var(--d-border);">
      <div class="px-5 py-3.5">
        <p class="d-label">Liquidity turnover</p>
        <p class="d-numeric mt-1 text-sm font-semibold" style="color: var(--d-text);">
          {pulse.liquidityTurnover === null ? '—' : `${pulse.liquidityTurnover.toFixed(2)}×`}
        </p>
        <p class="mt-0.5 text-[0.625rem]" style="color: var(--d-text-3);">
          pool depth traded per day
        </p>
      </div>
      <div class="px-5 py-3.5" style="border-left: 1px solid var(--d-border);">
        <p class="d-label">Cap turnover</p>
        <p class="d-numeric mt-1 text-sm font-semibold" style="color: var(--d-text);">
          {pulse.marketCapTurnover === null ? '—' : pct(pulse.marketCapTurnover * 100, 2)}
        </p>
        <p class="mt-0.5 text-[0.625rem]" style="color: var(--d-text-3);">
          of market cap per day
        </p>
      </div>
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">Pulse unavailable</p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        Needs the current hour's trading data.
      </p>
    </div>
  {/if}
</section>
