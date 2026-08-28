<script lang="ts">
  // Every venue this token trades on, ranked, with how hard each one is worked.
  //
  // There is deliberately no per-pool price impact column. Impact depends on
  // the shape of a pool's curve and where its liquidity actually sits, and most
  // of these are concentrated-liquidity pools (Meteora DLMM, Orca Whirlpool)
  // where the constant-product estimate you can compute from a TVL figure is
  // wrong, sometimes by an order of magnitude. A column of plausible-looking
  // wrong numbers is worse than no column.
  //
  // "Best venue" is answered by asking the router instead of modelling it: the
  // Jupiter quote for a $10K buy reports the venues it would really route
  // through, which is the measured answer to the same question.
  import { onMount } from 'svelte';
  import type { PairInfo } from '$lib/dashboard/types';
  import { usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';
  import { SOURCES } from '$lib/dashboard/sources';

  export let pairs: PairInfo[] = [];

  /** The size the "best venue" line is quoted at. */
  const PROBE_USD = 10_000;

  /**
   * Below this much liquidity the volume/liquidity ratio stops meaning
   * anything. One dust pool holds a single cent against $8 of daily volume,
   * which divides out to "801x, Heavy" — a number that would rank it as the
   * most actively traded venue on the page. The pool is still listed, because
   * the point of this table is that it is complete; only the ratio is withheld.
   */
  const TURNOVER_FLOOR_USD = 1_000;

  let route: string[] = [];
  let impactPct: number | null = null;
  let probeFailed = false;

  $: ranked = [...pairs].sort((a, b) => b.liquidityUsd - a.liquidityUsd);
  $: total = pairs.reduce((sum, p) => sum + p.liquidityUsd, 0);
  $: totalVolume = pairs.reduce((sum, p) => sum + p.volume24hUsd, 0);

  // Volume over liquidity: how many times a pool's own depth traded through it
  // in a day. Same three-way reading as Market Pulse so the words mean the same
  // thing in both places.
  function turnover(pair: PairInfo): number | null {
    if (pair.liquidityUsd < TURNOVER_FLOOR_USD) return null;
    return pair.volume24hUsd / pair.liquidityUsd;
  }

  function turnoverWord(value: number | null): string {
    // Empty rather than a dash: the ratio cell already carries one, and two
    // dashes side by side read as a broken cell.
    if (value === null) return '';
    if (value < 0.5) return 'Thin';
    return value < 3 ? 'Active' : 'Heavy';
  }

  onMount(async () => {
    try {
      const res = await fetch(`/api/dashboard/quote?usd=${PROBE_USD}&side=buy`);
      if (!res.ok) throw new Error(String(res.status));
      const q = (await res.json()) as { route: string[]; impactPct: number | null };
      route = q.route ?? [];
      impactPct = q.impactPct;
    } catch {
      probeFailed = true;
    }
  });
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">
      Liquidity by Pool
      <InfoTip
        label="Liquidity by Pool"
        text="Every venue this token trades on, deepest first, with how much volume each one carried in 24 hours. Volume over liquidity says how hard a pool is worked: a small pool turning over many times a day is doing real business, not sitting idle. Liquidity concentrated in a single pool behaves very differently from the same total spread across many — one pool is far easier to drain or move."
        source={SOURCES.dexscreener}
      />
    </h2>
    <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
      {pairs.length} pools · {usdCompact(total)} · {usdCompact(totalVolume)} 24h
    </span>
  </header>

  {#if route.length > 0 || impactPct !== null}
    <div
      class="border-b px-5 py-2.5"
      style="border-color: var(--d-border); background: var(--d-surface-2);"
    >
      <p class="d-label">Where a {usdCompact(PROBE_USD)} buy would actually route</p>
      <p class="d-numeric mt-1 text-xs font-semibold" style="color: var(--d-text);">
        {route.length > 0 ? route.join(' → ') : 'Single venue'}
        {#if impactPct !== null}
          <span class="font-normal" style="color: var(--d-text-3);">
            · {impactPct === 0 ? '<0.01' : impactPct.toFixed(2)}% impact
          </span>
        {/if}
      </p>
    </div>
  {/if}

  <div class="max-h-[420px] overflow-y-auto">
    <table class="w-full border-collapse text-sm">
      <thead class="sticky top-0 z-10" style="background: var(--d-surface-2);">
        <tr class="text-[0.625rem] uppercase tracking-wider" style="color: var(--d-text-3);">
          <th class="px-5 py-2.5 text-left font-semibold max-md:px-3">Venue</th>
          <th class="px-3 py-2.5 text-right font-semibold">Liquidity</th>
          <th class="px-3 py-2.5 text-right font-semibold">Share</th>
          <th class="px-3 py-2.5 text-right font-semibold max-md:hidden">24h Vol</th>
          <th class="px-5 py-2.5 text-right font-semibold max-md:px-3">Vol/Liq</th>
        </tr>
      </thead>

      <tbody>
        {#each ranked as pair (pair.pairAddress)}
          {@const share = total > 0 ? (pair.liquidityUsd / total) * 100 : 0}
          {@const t = turnover(pair)}
          <tr
            class="transition-colors hover:bg-[var(--d-hover)]"
            style="border-top: 1px solid var(--d-border);"
          >
            <td class="px-5 py-2 max-md:px-3">
              <a
                href={pair.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs font-medium capitalize hover:underline"
                style="color: var(--d-text);"
              >
                {pair.dexId}
              </a>
              <span class="text-xs" style="color: var(--d-text-3);">/ {pair.quoteSymbol}</span>
            </td>
            <td
              class="d-numeric px-3 py-2 text-right text-xs font-semibold"
              style="color: var(--d-text);"
            >
              {usdCompact(pair.liquidityUsd)}
            </td>
            <td class="px-3 py-2 text-right">
              <span class="d-numeric text-xs" style="color: var(--d-text-2);"
                >{share.toFixed(1)}%</span
              >
              <span
                class="ml-2 inline-block h-1 w-10 overflow-hidden rounded-full align-middle"
                style="background: var(--d-bg-subtle);"
              >
                <span
                  class="block h-full rounded-full"
                  style="width: {share}%; background: var(--d-accent);"
                />
              </span>
            </td>
            <td
              class="d-numeric px-3 py-2 text-right text-xs max-md:hidden"
              style="color: var(--d-text-2);"
            >
              {usdCompact(pair.volume24hUsd)}
            </td>
            <td class="px-5 py-2 text-right max-md:px-3">
              <span class="d-numeric text-xs font-semibold" style="color: var(--d-text);">
                {t === null ? '—' : `${t.toFixed(2)}×`}
              </span>
              <span
                class="ml-1.5 text-[0.625rem]"
                style="color: var(--d-text-3);"
                title={t === null
                  ? `Too little liquidity for the ratio to mean anything (under ${usdCompact(TURNOVER_FLOOR_USD)})`
                  : ''}
              >
                {turnoverWord(t)}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if probeFailed}
    <p class="border-t px-5 py-2 text-[0.625rem]" style="border-color: var(--d-border); color: var(--d-text-3);">
      The router did not answer the routing probe on this load. The table above is unaffected.
    </p>
  {/if}
</section>
