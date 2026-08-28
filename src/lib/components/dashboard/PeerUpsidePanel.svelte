<script lang="ts">
  // "What if ANSEM reached their market cap?"
  //
  // The arithmetic is deliberately simple and shown in full, because the point
  // is not to impress anyone with a big number — it is to let them check it.
  // Target price is the peer's market cap divided by ANSEM's circulating
  // supply; the multiple is that target over today's price. Both are printed.
  //
  // Every coin here, ANSEM included, comes from one CoinGecko call so all five
  // sit on a circulating-supply basis. Pairing a peer's circulating cap with
  // ANSEM's fully-diluted one would overstate every figure by 2.4x.
  //
  // Nothing here is a forecast. The copy says scenario, the disclaimer says
  // scenario, and no row implies the move is likely — only what the price
  // would be if the cap matched.

  import type { PeerComparison } from '$lib/dashboard/types';
  import { usd, usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';
  import { SOURCES } from '$lib/dashboard/sources';

  export let peers: PeerComparison | null;

  const AMOUNTS = [100, 1_000, 10_000];
  let amount = 100;

  /** Enough precision to be useful at both $0.64 and $33. */
  function price(v: number): string {
    if (v >= 100) return usd(v, 0);
    if (v >= 1) return usd(v, 2);
    return usd(v, 4);
  }

  function multiple(v: number): string {
    if (v >= 100) return `${Math.round(v)}×`;
    if (v >= 10) return `${v.toFixed(1)}×`;
    return `${v.toFixed(2)}×`;
  }

  $: rows = peers
    ? peers.peers.map((coin) => {
        // Derived from the target price rather than from the two market caps.
        // Both routes should give the same answer, but CoinGecko samples price,
        // supply and market cap moments apart, so cap/cap and price/price drift
        // ~0.2% from each other. Taking both from the target price keeps the
        // two numbers on screen exactly consistent — anyone dividing the
        // printed target by the printed current price lands on the printed
        // multiple, which is the whole point of showing the arithmetic.
        const targetPrice = coin.marketCapUsd / peers.ansem.circulatingSupply;
        const mult = targetPrice / peers.ansem.priceUsd;
        return {
          ...coin,
          mult,
          targetPrice,
          futureValue: amount * mult,
          // ANSEM's cap as a share of the peer's, for the bar.
          sharePct: (peers.ansem.marketCapUsd / coin.marketCapUsd) * 100
        };
      })
    : [];

  $: biggest = rows.length ? rows[rows.length - 1] : null;
</script>

<section class="upside d-card overflow-hidden">
  <header
    class="relative flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4"
    style="border-color: var(--d-border);"
  >
    <div class="min-w-0">
      <h2 class="text-base font-semibold tracking-tight" style="color: var(--d-text);">
        What if $ANSEM reached their market cap?
        <InfoTip
          label="Market cap comparison"
          text="A hypothetical, not a forecast. Each row takes another meme coin's market cap and divides it by ANSEM's circulating supply to get the price ANSEM would trade at with the same cap. The multiple is that target over today's price. All five coins are read from one source on a circulating-supply basis, so the ratios are comparable." source={SOURCES.coingecko} />
      </h2>
      <p class="mt-1 text-xs" style="color: var(--d-text-2);">
        Same market cap, very different price. Every figure below is live.
      </p>
    </div>

    {#if peers}
      <div class="text-right">
        <p class="d-label">ANSEM now</p>
        <p class="d-numeric text-sm font-semibold" style="color: var(--d-text);">
          {usdCompact(peers.ansem.marketCapUsd)}
        </p>
      </div>
    {/if}
  </header>

  {#if peers && rows.length}
    <!-- Investment size -->
    <div
      class="flex flex-wrap items-center gap-2 border-b px-5 py-3"
      style="border-color: var(--d-border); background: var(--d-surface-2);"
    >
      <span class="d-label shrink-0">If you held</span>
      <div class="flex gap-1">
        {#each AMOUNTS as a (a)}
          <button
            type="button"
            class="d-tap d-numeric rounded px-2.5 py-1 text-[0.6875rem] font-semibold transition-colors"
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
      <span class="text-[0.6875rem]" style="color: var(--d-text-3);">
        of $ANSEM today
      </span>
    </div>

    <!-- One card per peer -->
    <div>
      {#each rows as row, i (row.id)}
        <article
          class="peer-row px-5 py-4"
          style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2.5">
              {#if row.imageUrl}
                <img src={row.imageUrl} alt="" class="h-7 w-7 rounded-full" loading="lazy" />
              {/if}
              <div class="min-w-0">
                <p class="text-sm font-semibold" style="color: var(--d-text);">{row.symbol}</p>
                <p class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
                  {usdCompact(row.marketCapUsd)} cap
                </p>
              </div>
            </div>

            <div class="text-right">
              <p
                class="d-numeric text-2xl font-bold leading-none max-md:text-xl"
                style="color: var(--d-accent-ink);"
              >
                {multiple(row.mult)}
              </p>
              <p class="mt-0.5 text-[0.625rem]" style="color: var(--d-text-3);">potential</p>
            </div>
          </div>

          <!-- ANSEM's cap against theirs -->
          <div class="mt-3">
            <div
              class="relative h-2 overflow-hidden rounded-full"
              style="background: var(--d-bg-subtle);"
              role="img"
              aria-label="ANSEM is {row.sharePct.toFixed(1)} percent of {row.symbol}'s market cap"
            >
              <div
                class="h-full rounded-full transition-[width] duration-700"
                style="width: {Math.max(0.6, row.sharePct)}%; background: var(--d-accent);"
              />
            </div>
            <p class="mt-1.5 text-[0.625rem]" style="color: var(--d-text-3);">
              ANSEM is {row.sharePct < 1 ? row.sharePct.toFixed(2) : row.sharePct.toFixed(1)}% of
              {row.symbol}'s market cap today
            </p>
          </div>

          <!-- The numbers, spelled out -->
          <div class="mt-3 grid grid-cols-3 gap-2 max-md:grid-cols-1">
            <div
              class="rounded-lg px-3 py-2"
              style="background: var(--d-bg-subtle);"
            >
              <p class="d-label">ANSEM price there</p>
              <p class="d-numeric mt-0.5 text-sm font-bold" style="color: var(--d-text);">
                {price(row.targetPrice)}
              </p>
            </div>
            <div class="rounded-lg px-3 py-2" style="background: var(--d-bg-subtle);">
              <p class="d-label">Today</p>
              <p class="d-numeric mt-0.5 text-sm font-semibold" style="color: var(--d-text-2);">
                {price(peers.ansem.priceUsd)}
              </p>
            </div>
            <div
              class="rounded-lg px-3 py-2"
              style="background: var(--d-accent-soft);"
            >
              <p class="d-label">{usdCompact(amount)} would be</p>
              <p class="d-numeric mt-0.5 text-sm font-bold" style="color: var(--d-accent-ink);">
                {usd(row.futureValue, row.futureValue >= 1000 ? 0 : 2)}
              </p>
            </div>
          </div>
        </article>
      {/each}
    </div>

    <p
      class="border-t px-5 py-3 text-[0.625rem] leading-relaxed"
      style="border-color: var(--d-border); color: var(--d-text-3);"
    >
      Hypothetical scenario based on market-cap comparison. Not a prediction or guarantee.
      Target price = peer market cap ÷ ANSEM circulating supply ({(peers.ansem.circulatingSupply / 1e6).toFixed(1)}M).
      All five market caps are read live from one source on a circulating-supply basis. Reaching
      any of these caps would require sustained demand that may never arrive.
    </p>
  {:else}
    <div class="flex flex-1 flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">Comparison unavailable</p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        CoinGecko did not return peer market caps on this refresh.
      </p>
    </div>
  {/if}
</section>

<style>
  /* A single accent hairline so the section reads as the headline block on the
     page without resorting to a different card treatment. */
  .upside {
    position: relative;
  }

  .upside::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--d-accent) 35%,
      var(--d-accent) 65%,
      transparent
    );
  }

  .peer-row {
    transition: background 0.15s ease;
  }

  .peer-row:hover {
    background: var(--d-hover);
  }
</style>
