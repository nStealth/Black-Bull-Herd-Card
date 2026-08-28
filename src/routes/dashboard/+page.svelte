<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { DashboardSnapshot } from '$lib/dashboard/types';

  import { ageSince, compact, count, pct, relativeAge, usd, usdCompact } from '$lib/dashboard/format';
  import { ANSEM_MINT } from '$lib/tiers';
  import { heroPassed, ticker } from '$lib/dashboard/ticker';

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
  import WalletRankPanel from '$lib/components/dashboard/WalletRankPanel.svelte';
  import BuyBackPanel from '$lib/components/dashboard/BuyBackPanel.svelte';
  import BenchmarkPanel from '$lib/components/dashboard/BenchmarkPanel.svelte';
  import PulsePanel from '$lib/components/dashboard/PulsePanel.svelte';
  import RhythmPanel from '$lib/components/dashboard/RhythmPanel.svelte';
  import FlowPanel from '$lib/components/dashboard/FlowPanel.svelte';
  import PeerUpsidePanel from '$lib/components/dashboard/PeerUpsidePanel.svelte';
  import PriceHero from '$lib/components/dashboard/PriceHero.svelte';

  export let data: PageData;

  // Matches the shared cache window. Polling faster only re-fetches bytes the
  // edge cannot have changed yet.
  const REFRESH_MS = 60_000;

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
  $: benchmark = snapshot.benchmark;
  $: pulse = snapshot.pulse;
  $: rhythm = snapshot.rhythm;
  $: flow = snapshot.flow;
  $: peers = snapshot.peers;
  // The holder walk can stop short of every token account, so the count is a
  // floor. Showing it bare would assert a total we did not actually reach.
  $: holderIndexPartial = snapshot.distribution?.complete === false;

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://ansemherd.online';

  /**
   * Unfurl copy, rebuilt whenever the snapshot refreshes.
   *
   * Leads with the live price and the day's move, because that is the line
   * somebody scrolling a timeline actually stops on. Then the figures that are
   * hardest to find elsewhere, and finally what the page will do for them.
   *
   * Still no adjectives. Every number here is one a visitor can verify on the
   * page within a second of arriving, and an unfurl that oversells is one
   * nobody trusts twice.
   */
  $: change24h = activity?.h24.priceChangePct ?? null;
  $: shareTitle = overview
    ? `$${overview.symbol} ${usd(overview.priceUsd, 4)}${
        change24h === null ? '' : ` ${change24h >= 0 ? '▲' : '▼'} ${Math.abs(change24h).toFixed(1)}% 24h`
      } · Live ANSEM Analytics`
    : 'ANSEM Analytics — Live Solana Token Dashboard';

  /**
   * The single most arresting true figure available, used as the hook.
   *
   * What a million-dollar exit costs is the number nobody else publishes for
   * this token, so it leads when the router has quoted it; volatility is the
   * fallback when it has not.
   */
  $: headlineHook = (() => {
    const million = snapshot.depth?.sells.find((s) => s.usd === 1_000_000 && s.impactPct !== null);
    if (million) return `$1M exit costs ${million.impactPct?.toFixed(1)}% slippage`;
    if (snapshot.risk) return `${snapshot.risk.volatilityPct.toFixed(0)}% annualised volatility`;
    return null;
  })();

  $: shareDescription = overview
    ? [
        `${usdCompact(overview.marketCapUsd)} cap`,
        `${usdCompact(activity?.h24.volumeUsd ?? 0)} 24h volume`,
        holdersLive
          ? `${count(snapshot.totalHolders ?? 0)}${holderIndexPartial ? '+' : ''} holders`
          : null,
        headlineHook,
        'Order flow by wallet, trade depth at size, contract safety — free, no wallet needed.'
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Live on-chain analytics for $ANSEM on Solana: price history, order flow, trade depth and contract safety. Free, no wallet needed.';
  $: syncedLabel = now && relativeAge(lastSynced);

  /**
   * Freshness as three states rather than a binary.
   *
   * The header said "Live" whether the snapshot was two seconds or four minutes
   * old, which is the one situation where a status light actively misleads:
   * the page refreshes every 30s, so anything past a minute means a refresh has
   * failed and the figures on screen are older than they look.
   */
  $: ageSec = now ? Math.max(0, Math.floor((now - lastSynced) / 1000)) : 0;
  $: feed =
    status.dexscreener !== 'live'
      ? { label: 'DEGRADED', color: 'var(--d-down)' }
      : ageSec > 180
        ? { label: 'STALE', color: 'var(--d-down)' }
        : ageSec > 60
          ? { label: 'DELAYED', color: 'var(--d-warn-ink)' }
          : { label: 'LIVE', color: 'var(--d-accent-ink)' };

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

  // Feed the header its copy of the headline, so it can show the price once
  // the hero is gone.
  $: ticker.set(
    overview ? { priceUsd: overview.priceUsd, changePct: activity?.h24.priceChangePct ?? null } : null
  );

  // A zero-height marker sitting under the hero. Once it leaves the area below
  // the header, the hero is off screen and the header takes over the price.
  let sentinel: HTMLElement;
  let observer: IntersectionObserver | undefined;

  onMount(() => {
    timer = setInterval(refresh, REFRESH_MS);
    clock = setInterval(() => (now = Date.now()), 1000);

    if (sentinel && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => heroPassed.set(!entry.isIntersecting && entry.boundingClientRect.top < 0),
        { rootMargin: '-56px 0px 0px 0px', threshold: 0 }
      );
      observer.observe(sentinel);
    }
  });

  onDestroy(() => {
    clearInterval(timer);
    clearInterval(clock);
    observer?.disconnect();
    // The header is shared with /about, /docs and /api, which have no hero.
    heroPassed.set(false);
    ticker.set(null);
  });
</script>

<svelte:head>
  <!--
    Live numbers in the tags themselves.

    The page is server-rendered, so a crawler that never runs JavaScript still
    receives the current price, change and holder count. Every time this link is
    posted to X, Telegram or Discord the unfurl carries real figures instead of
    a generic blurb, which turns each share into something worth clicking.
  -->
  <title>{shareTitle}</title>
  <meta name="description" content={shareDescription} />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ANSEM Analytics" />
  <meta property="og:title" content={shareTitle} />
  <meta property="og:description" content={shareDescription} />
  <meta property="og:url" content="{siteUrl}/dashboard" />

  <!--
    Our own 1200x630, not the token logo. summary_large_image crops to about
    1.91:1, and the logo is a square on a third-party CDN — it arrived
    letterboxed, and its availability was somebody else's decision.
  -->
  <meta property="og:image" content="{siteUrl}/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="ANSEM Analytics — live overwatch for $ANSEM on Solana" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@blackbullsol" />
  <meta name="twitter:title" content={shareTitle} />
  <meta name="twitter:description" content={shareDescription} />
  <meta name="twitter:image" content="{siteUrl}/og.png" />
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
        style="background: {feed.color};"
      />
      <span>
        <span class="font-semibold" style="color: {feed.color};">{feed.label}</span>
        · synced {syncedLabel}
      </span>
    </div>
  </div>

  {#if !overview}
    <NoticeCard
      title="Market data unavailable"
      message="DexScreener did not respond. The dashboard recovers automatically on the next refresh."
    />
  {:else}
    <!-- Price first, at the weight it deserves -->
    <div class="mb-3">
      <PriceHero {overview} {activity} />
    </div>
    <div bind:this={sentinel} aria-hidden="true"></div>

    <!-- Everything that qualifies the headline, at secondary weight -->
    <!--
      Eight tiles, not seven. Seven is prime: at five columns it left three dead
      slots, at four it left one, at two it left one. Eight divides by four and
      by two, so the block is a filled rectangle at every breakpoint.
    -->
    <div class="mb-4 grid grid-cols-4 gap-3 max-lg:grid-cols-2">
      <StatTile
        label="Rank"
        value={marketStats?.rank ? `#${marketStats.rank}` : '—'}
        hint="by market cap"
        muted={!marketStats?.rank}
      />
      <StatTile
        label="24h Trades"
        value={count((activity?.h24.buys ?? 0) + (activity?.h24.sells ?? 0))}
        hint="{count(activity?.h24.buys ?? 0)} buys · {count(activity?.h24.sells ?? 0)} sells"
      />
      <StatTile
        label="Holders found"
        value={holdersLive
          ? `${count(snapshot.totalHolders ?? 0)}${holderIndexPartial ? '+' : ''}`
          : '—'}
        hint={holdersLive
          ? `${count(snapshot.distribution?.rankedCount ?? 0)} ranked below`
          : 'indexer not configured'}
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
        label="30d Change"
        value={marketStats?.change30dPct != null
          ? `${marketStats.change30dPct >= 0 ? '+' : ''}${marketStats.change30dPct.toFixed(1)}%`
          : '—'}
        hint="vs 30 days ago"
        muted={marketStats?.change30dPct == null}
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

    <!-- Directly under the chart: the market-cap scenario is the headline of
         this page, not a footnote at the bottom of it. -->
    <div class="mb-4">
      <PeerUpsidePanel {peers} />
    </div>

    <!-- Right now: how hard it is trading, and when it usually does -->
    <div class="mb-4 grid grid-cols-2 gap-3 max-lg:grid-cols-1">
      <PulsePanel {pulse} />
      <RhythmPanel {rhythm} />
    </div>

    <!-- Activity and distribution -->
    <div class="mb-4 grid grid-cols-2 gap-3 max-lg:grid-cols-1">
      <ActivityPanel {activity} />
      <DistributionPanel distribution={snapshot.distribution} />
    </div>

    <!-- Liquidity gets the full width: it is a thirty-row ranking, not a stat -->
    <div class="mb-4">
      <PairsPanel pairs={overview.pairs} />
    </div>

    <!-- Personal lookup, above the aggregate panels: the one row on this page
         that is about the visitor rather than the token. -->
    <div class="mb-4">
      <WalletRankPanel />
    </div>

    <!-- Hindsight and relative strength -->
    <div class="mb-4 grid grid-cols-2 gap-3 max-lg:grid-cols-1">
      <BuyBackPanel priceUsd={overview.priceUsd} />
      <BenchmarkPanel {benchmark} {activity} symbol={overview.symbol} />
    </div>

    <!-- Execution: what a trade of size actually costs, and how it behaves -->
    <div class="mb-4 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
      <DepthPanel {depth} />
      <div class="col-span-2 max-lg:col-span-1">
        <RiskPanel {risk} />
      </div>
    </div>

    <!-- Who is moving, and the raw tape it was folded from -->
    <div class="mb-4 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
      <div class="col-span-2 max-lg:col-span-1">
        <FlowPanel {flow} />
      </div>
      <TradeFeed initial={data.trades} />
    </div>

    <!-- Risk and cross-market context -->
    <div class="mb-4 grid grid-cols-2 gap-3 max-lg:grid-cols-1">
      <SecurityPanel {security} />
      <MarketContextPanel market={marketStats} priceUsd={overview.priceUsd} />
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
      Slippage is quoted per request by the Jupiter router, so those figures are live rather
      than cached from a snapshot.
      {#if holdersLive}
        Holder rankings and distribution come from a Helius token-account walk.
      {:else}
        Holder analytics require an indexing provider.
      {/if}
      Every panel names its own provider under the marker beside its title.
      Buy/sell counts are published up to 24h only — the 7d and 30d rows carry price and volume
      with counts left blank rather than estimated. When a free-tier provider rate-limits, the
      last good payload is shown rather than a blank panel; the header stamp says how old it is.
    </p>
  {/if}
</div>
