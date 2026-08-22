<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { DashboardSnapshot } from '$lib/dashboard/types';

  import { applyTheme, clearTheme, theme } from '$lib/dashboard/theme';
  import { ageSince, compact, count, pct, relativeAge, usd, usdCompact } from '$lib/dashboard/format';
  import { ANSEM_MINT } from '$lib/tiers';

  import CryptoBackground from '$lib/components/dashboard/CryptoBackground.svelte';
  import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';
  import StatTile from '$lib/components/dashboard/StatTile.svelte';
  import ActivityPanel from '$lib/components/dashboard/ActivityPanel.svelte';
  import HolderPodium from '$lib/components/dashboard/HolderPodium.svelte';
  import HolderTable from '$lib/components/dashboard/HolderTable.svelte';
  import DistributionPanel from '$lib/components/dashboard/DistributionPanel.svelte';
  import PairsPanel from '$lib/components/dashboard/PairsPanel.svelte';
  import NoticeCard from '$lib/components/dashboard/NoticeCard.svelte';

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
      // keep showing the last good snapshot
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
    applyTheme($theme);
    timer = setInterval(refresh, REFRESH_MS);
    clock = setInterval(() => (now = Date.now()), 1000);
  });

  onDestroy(() => {
    clearInterval(timer);
    clearInterval(clock);
    clearTheme();
  });

  // `now` ticks once a second purely to keep the "synced" stamp honest.
  $: syncedLabel = now && relativeAge(lastSynced);
</script>

<svelte:head>
  <title>$ANSEM Dashboard — Black Bull Herd</title>
  <meta
    name="description"
    content="Live on-chain analytics for $ANSEM on Solana: price, liquidity, trading activity and the full holder leaderboard."
  />
</svelte:head>

<CryptoBackground />

<div class="mx-auto max-w-[1200px] px-6 pb-20 max-md:px-4">
  <!-- Header -->
  <header class="mb-8 flex flex-wrap items-start justify-between gap-4">
    <div class="flex items-center gap-4">
      {#if overview?.imageUrl}
        <img
          src={overview.imageUrl}
          alt="{overview.symbol} logo"
          class="h-14 w-14 rounded-2xl border object-cover"
          style="border-color: var(--d-border);"
          loading="lazy"
        />
      {/if}
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-3xl font-bold max-md:text-2xl" style="color: var(--d-text);">
            {overview?.name ?? 'The Black Bull'}
          </h1>
          <span
            class="d-numeric rounded-lg px-2 py-0.5 text-xs font-bold"
            style="color: var(--d-accent); background: color-mix(in srgb, var(--d-accent) 14%, transparent);"
            >${overview?.symbol ?? 'ANSEM'}</span
          >
        </div>

        <button
          type="button"
          class="d-numeric mt-1.5 flex items-center gap-2 rounded-lg border px-2 py-1 text-[0.6875rem] transition-colors"
          style="border-color: var(--d-border); color: var(--d-text-muted);"
          on:click={copyMint}
          title="Copy contract address"
        >
          <span class="max-md:hidden">{ANSEM_MINT}</span>
          <span class="md:hidden">{ANSEM_MINT.slice(0, 10)}…{ANSEM_MINT.slice(-6)}</span>
          <span>{copied ? '✅' : '📋'}</span>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="text-right max-md:hidden">
        <p class="text-[0.6875rem]" style="color: var(--d-text-muted);">
          Synced {syncedLabel}
        </p>
        <p class="flex items-center justify-end gap-1.5 text-[0.6875rem]" style="color: var(--d-text-muted);">
          <span
            class="h-1.5 w-1.5 rounded-full"
            style="background: {status.dexscreener === 'live' ? 'var(--d-buy)' : 'var(--d-sell)'};"
            class:animate-pulse={refreshing}
          />
          {status.dexscreener === 'live' ? 'Live' : 'Degraded'}
        </p>
      </div>
      <ThemeToggle />
    </div>
  </header>

  {#if !overview}
    <NoticeCard
      icon="📡"
      title="Market data is unavailable right now"
      message="DexScreener did not respond. The dashboard will recover automatically on the next refresh."
    />
  {:else}
    <!-- Headline metrics -->
    <div class="mb-6 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:gap-3">
      <StatTile
        label="Price"
        icon="💵"
        value={usd(overview.priceUsd, 4)}
        delta={activity?.h24.priceChangePct ?? null}
        hint="24h"
        accent="var(--d-accent)"
      />
      <StatTile
        label="Market Cap"
        icon="📊"
        value={usdCompact(overview.marketCapUsd)}
        hint="FDV {usdCompact(overview.fdvUsd)}"
        accent="#3b82f6"
      />
      <StatTile
        label="Liquidity"
        icon="🌊"
        value={usdCompact(overview.liquidityUsd)}
        hint="{overview.pairs.length} pools"
        accent="#a855f7"
      />
      <StatTile
        label="24h Volume"
        icon="⚡"
        value={usdCompact(activity?.h24.volumeUsd ?? 0)}
        hint="{count(activity?.h24.buys ?? 0)} buys · {count(activity?.h24.sells ?? 0)} sells"
        accent="#22c55e"
      />
      <StatTile
        label="Holders"
        icon="🐂"
        value={holdersLive ? count(snapshot.totalHolders ?? 0) : 'Locked'}
        hint={holdersLive ? 'unique wallets' : 'needs indexer key'}
        accent="#ef4444"
      />
      <StatTile
        label="Total Supply"
        icon="🪙"
        value={compact(overview.totalSupply)}
        hint="{overview.symbol} tokens"
        accent="#f59e0b"
      />
      <StatTile
        label="Top 10 Hold"
        icon="🏆"
        value={snapshot.distribution ? pct(snapshot.distribution.top10Pct, 1) : 'Locked'}
        hint={snapshot.distribution ? 'of total supply' : 'needs indexer key'}
        accent="#ffd700"
      />
      <StatTile
        label="Market Age"
        icon="🕰️"
        value={overview.pairCreatedAt ? ageSince(overview.pairCreatedAt) : '—'}
        hint="since first pool"
        accent="#6366f1"
      />
    </div>

    <!-- Activity + liquidity -->
    <div class="mb-6 grid grid-cols-2 gap-4 max-lg:grid-cols-1">
      <ActivityPanel {activity} />
      <div class="flex flex-col gap-4">
        <PairsPanel pairs={overview.pairs} />
        <DistributionPanel distribution={snapshot.distribution} />
      </div>
    </div>

    <!-- Holder leaderboard -->
    <section class="mb-6">
      <header class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 class="text-xl font-bold" style="color: var(--d-text);">Herd Leaderboard</h2>
          <p class="mt-0.5 text-xs" style="color: var(--d-text-muted);">
            {holdersLive
              ? `Top ${count(data.indexed)} wallets ranked by $${overview.symbol} balance`
              : 'Ranked wallet list, pending an indexing provider'}
          </p>
        </div>
        {#if holdersLive}
          <span
            class="rounded-lg px-2 py-1 text-[0.6875rem] font-semibold"
            style="color: var(--d-buy); background: color-mix(in srgb, var(--d-buy) 14%, transparent);"
            >Live index</span
          >
        {/if}
      </header>

      {#if holdersLive && podium.length > 0}
        <div class="mb-4">
          <HolderPodium holders={podium} priceUsd={overview.priceUsd} />
        </div>
        <HolderTable initial={tableRows} indexed={data.indexed} priceUsd={overview.priceUsd} />
      {:else}
        <NoticeCard
          icon="🔐"
          title="Holder leaderboard needs an indexing provider"
          message="Enumerating token accounts is not possible on Solana's free public RPC — it rate-limits the call. Add a free Helius API key as HELIUS_API_KEY and this panel activates on the next deploy, with the full ranking up to 10,000 wallets."
        >
          <a
            href="https://helius.dev"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors"
            style="border-color: var(--d-border); color: var(--d-text);"
          >
            Get a free key →
          </a>
        </NoticeCard>
      {/if}
    </section>

    <!-- Provider transparency -->
    <section class="d-card p-5" style="border-style: dashed;">
      <h2 class="mb-2 text-sm font-bold" style="color: var(--d-text);">Data Sources</h2>
      <ul class="flex flex-col gap-1.5">
        {#each status.notes as note (note)}
          <li class="flex gap-2 text-xs leading-relaxed" style="color: var(--d-text-secondary);">
            <span aria-hidden="true">·</span>
            <span>{note}</span>
          </li>
        {/each}
        <li class="flex gap-2 text-xs leading-relaxed" style="color: var(--d-text-secondary);">
          <span aria-hidden="true">·</span>
          <span>
            Price, liquidity, volume and trade counts are aggregated live from DexScreener across all
            {overview.pairs.length} Solana pools. Supply is read directly from the mint on-chain.
          </span>
        </li>
      </ul>
    </section>
  {/if}
</div>
