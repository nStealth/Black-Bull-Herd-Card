<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { DashboardSnapshot } from '$lib/dashboard/types';

  import { ageSince, compact, count, pct, relativeAge, usd, usdCompact } from '$lib/dashboard/format';
  import { ANSEM_MINT } from '$lib/tiers';

  import CryptoBackground from '$lib/components/dashboard/CryptoBackground.svelte';
  import StatTile from '$lib/components/dashboard/StatTile.svelte';
  import ActivityPanel from '$lib/components/dashboard/ActivityPanel.svelte';
  import HolderPodium from '$lib/components/dashboard/HolderPodium.svelte';
  import HolderTable from '$lib/components/dashboard/HolderTable.svelte';
  import DistributionPanel from '$lib/components/dashboard/DistributionPanel.svelte';
  import PairsPanel from '$lib/components/dashboard/PairsPanel.svelte';
  import NoticeCard from '$lib/components/dashboard/NoticeCard.svelte';
  import PriceChart from '$lib/components/dashboard/PriceChart.svelte';
  import TradeFeed from '$lib/components/dashboard/TradeFeed.svelte';
  import SecurityPanel from '$lib/components/dashboard/SecurityPanel.svelte';
  import MarketContextPanel from '$lib/components/dashboard/MarketContextPanel.svelte';
  import DepthPanel from '$lib/components/dashboard/DepthPanel.svelte';
  import RiskPanel from '$lib/components/dashboard/RiskPanel.svelte';

  export let data: PageData;

  const REFRESH_MS = 30_000;

  let snapshot: DashboardSnapshot = data.snapshot;
  let refreshing = false;
  let lastSynced = data.snapshot.updatedAt;
  let now = Date.now();
  let copied = false;
  let timer: ReturnType<typeof setInterval>;
  let clock: ReturnType<typeof setInterval>;

  $: overview = snapshot.overview;
  $: activity = snapshot.activity;
  $: status = snapshot.status;
  $: podium = data.holders.slice(0, 10);
  $: tableRows = data.holders.slice(10);
  $: holdersLive = status.holders === 'live';
  $: security = snapshot.security;
  $: marketStats = snapshot.market;
  $: depth = snapshot.depth;
  $: risk = snapshot.risk;
  $: syncedLabel = now && relativeAge(lastSynced);

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      const res = await fetch('/api/dashboard/snapshot');
      if (res.ok) {
        snapshot = (await res.json()) as DashboardSnapshot;
        lastSynced = snapshot.updatedAt;
      }
    } catch {
      // keep the last good snapshot on screen
    } finally {
      refreshing = false;
    }
  }

  async function copyMint() {
    try {
      await navigator.clipboard.writeText(ANSEM_MINT);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  onMount(() => {
    timer = setInterval(refresh, REFRESH_MS);
    clock = setInterval(() => (now = Date.now()), 1000);
  });

  onDestroy(() => {
    clearInterval(timer);
    clearInterval(clock);
  });
</script>

<svelte:head>
  <title>ANSEM Analytics — Solana Token Dashboard</title>
  <meta
    name="description"
    content="Live on-chain analytics for ANSEM on Solana: price, liquidity, trading activity and holder rankings."
  />
</svelte:head>

<CryptoBackground />

<div class="mx-auto max-w-[1180px] px-6 py-8 max-md:px-4 max-md:py-6">
  <!-- Token identity -->
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div class="flex items-center gap-3.5">
      {#if overview?.imageUrl}
        <img
          src={overview.imageUrl}
          alt=""
          class="h-11 w-11 rounded-xl border object-cover"
          style="border-color: var(--d-border);"
          loading="lazy"
        />
      {/if}
      <div>
        <div class="flex items-baseline gap-2">
          <h1 class="text-xl font-semibold tracking-tight" style="color: var(--d-text);">
            {overview?.name ?? 'The Black Bull'}
          </h1>
          <span class="d-numeric text-sm font-medium" style="color: var(--d-text-3);">
            {overview?.symbol ?? 'ANSEM'}
          </span>
        </div>
        <button
          type="button"
          class="d-numeric mt-1 flex items-center gap-1.5 text-[0.6875rem] transition-colors hover:opacity-75"
          style="color: var(--d-text-3);"
          on:click={copyMint}
        >
          <span class="max-md:hidden">{ANSEM_MINT}</span>
          <span class="md:hidden">{ANSEM_MINT.slice(0, 8)}…{ANSEM_MINT.slice(-6)}</span>
          <span style="color: {copied ? 'var(--d-accent)' : 'inherit'};">
            {copied ? 'copied' : 'copy'}
          </span>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-1.5 text-[0.6875rem]" style="color: var(--d-text-3);">
      <span
        class="h-1.5 w-1.5 rounded-full"
        class:animate-pulse={refreshing}
        style="background: {status.dexscreener === 'live' ? 'var(--d-accent)' : 'var(--d-down)'};"
      />
      <span>{status.dexscreener === 'live' ? 'Live' : 'Degraded'} · synced {syncedLabel}</span>
    </div>
  </div>

  {#if !overview}
    <NoticeCard
      title="Market data unavailable"
      message="DexScreener did not respond. The dashboard recovers automatically on the next refresh."
    />
  {:else}
    <!-- Key metrics -->
    <div class="mb-4 grid grid-cols-5 gap-3 max-xl:grid-cols-4 max-lg:grid-cols-2">
      <StatTile
        label="Price"
        value={usd(overview.priceUsd, 4)}
        delta={activity?.h24.priceChangePct ?? null}
        hint="24h"
      />
      <StatTile
        label="Market Cap"
        value={usdCompact(overview.marketCapUsd)}
        hint="FDV {usdCompact(overview.fdvUsd)}"
      />
      <StatTile
        label="Rank"
        value={marketStats?.rank ? `#${marketStats.rank}` : '—'}
        hint="by market cap"
        muted={!marketStats?.rank}
      />
      <StatTile
        label="Liquidity"
        value={usdCompact(overview.liquidityUsd)}
        hint="{overview.pairs.length} pools"
      />
      <StatTile
        label="24h Volume"
        value={usdCompact(activity?.h24.volumeUsd ?? 0)}
        hint="{count(activity?.h24.buys ?? 0)} / {count(activity?.h24.sells ?? 0)}"
      />
      <StatTile
        label="Holders"
        value={holdersLive ? count(snapshot.totalHolders ?? 0) : '—'}
        hint={holdersLive ? 'unique wallets' : 'indexer not configured'}
        muted={!holdersLive}
      />
      <StatTile label="Total Supply" value={compact(overview.totalSupply)} hint={overview.symbol} />
      <StatTile
        label="Top 10 Hold"
        value={snapshot.distribution ? pct(snapshot.distribution.top10Pct, 1) : '—'}
        hint={snapshot.distribution ? 'of supply' : 'indexer not configured'}
        muted={!snapshot.distribution}
      />
      <StatTile
        label="From ATH"
        value={marketStats?.athChangePct != null
          ? `${marketStats.athChangePct.toFixed(1)}%`
          : '—'}
        hint={marketStats?.ath ? `ATH ${usd(marketStats.ath, 4)}` : 'all-time high'}
        muted={marketStats?.athChangePct == null}
      />
      <StatTile
        label="Market Age"
        value={overview.pairCreatedAt ? ageSince(overview.pairCreatedAt) : '—'}
        hint="since first pool"
      />
    </div>

    <!-- Price history -->
    <div class="mb-4">
      <PriceChart initial={data.chart} />
    </div>

    <!-- Activity, liquidity, distribution -->
    <div class="mb-4 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
      <ActivityPanel {activity} />
      <PairsPanel pairs={overview.pairs} />
      <DistributionPanel distribution={snapshot.distribution} />
    </div>

    <!-- Execution: what a trade of size actually costs, and how it behaves -->
    <div class="mb-4 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
      <DepthPanel {depth} />
      <div class="col-span-2 max-lg:col-span-1">
        <RiskPanel {risk} />
      </div>
    </div>

    <!-- Risk, cross-market context, order flow -->
    <div class="mb-4 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
      <SecurityPanel {security} />
      <MarketContextPanel market={marketStats} priceUsd={overview.priceUsd} />
      <TradeFeed initial={data.trades} />
    </div>

    <!-- Holders -->
    {#if holdersLive && podium.length > 0}
      <div class="mb-4">
        <HolderPodium holders={podium} priceUsd={overview.priceUsd} />
      </div>
      <HolderTable initial={tableRows} indexed={data.indexed} priceUsd={overview.priceUsd} />
    {:else}
      <NoticeCard
        title="Holder rankings not available"
        message="Enumerating token accounts is not possible on Solana's public RPC — the call is rate limited. Set HELIUS_API_KEY to activate the full ranking up to 10,000 wallets."
      />
    {/if}

    <!-- Sources -->
    <p class="mt-6 text-[0.6875rem] leading-relaxed" style="color: var(--d-text-3);">
      Price, liquidity, volume and trade counts aggregated live from DexScreener across
      {overview.pairs.length} Solana pools. Supply, mint authority and freeze authority read
      on-chain from the mint. Candles and the live tape from GeckoTerminal on the deepest pool;
      rank, all-time high/low and the 7d/30d changes from CoinGecko across every venue.
      {#if !holdersLive}Holder analytics require an indexing provider.{/if}
      Buy/sell counts are published up to 24h only — the 7d and 30d rows carry price and volume
      with counts left blank rather than estimated. When a free-tier provider rate-limits, the
      last good payload is shown rather than a blank panel; the header stamp says how old it is.
    </p>
  {/if}
</div>
