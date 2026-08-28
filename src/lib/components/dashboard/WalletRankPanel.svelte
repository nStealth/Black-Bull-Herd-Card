<script lang="ts">
  // Look up where one wallet sits among every holder.
  //
  // Address-only by design: no wallet connection, no signature, no extension.
  // Ranking is done on the server because it needs the whole holder list, and
  // shipping ~90k rows to the browser to answer one question would cost
  // megabytes per visitor.

  import type { WalletRank } from '$lib/dashboard/types';
  import { compact, count, pct, shortAddress, usd, usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';
  import { SOURCES } from '$lib/dashboard/sources';
  import { watchlist, WATCHLIST_MAX, type SavedWallet } from '$lib/dashboard/watchlist';

  let address = '';
  let result: WalletRank | null = null;
  let error = '';
  let loading = false;
  let saving = false;

  /**
   * The saved list lives in this browser, because the site has no accounts and
   * a server-held list would have nobody to belong to — every visitor would
   * see every other visitor's wallets. The address is also posted to the
   * server so the project has a record of which wallets people follow; that
   * record is per-address, and carries nothing about who saved it.
   */
  $: saved = $watchlist;
  $: isSaved = result ? saved.some((w) => w.address === result?.wallet) : false;
  $: previous = result ? saved.find((w) => w.address === result?.wallet) : undefined;
  $: rankDelta =
    previous && previous.rank !== null && result?.rank != null ? previous.rank - result.rank : null;

  async function save() {
    if (!result || saving) return;
    saving = true;

    const entry: SavedWallet = {
      address: result.wallet,
      rank: result.rank,
      balance: result.balance,
      seenAt: Date.now()
    };

    try {
      await fetch('/api/dashboard/watch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wallet: result.wallet })
      });
    } catch {
      // The visitor's own list is the thing they asked for; it should not fail
      // because our record-keeping did.
    } finally {
      watchlist.save(entry);
      saving = false;
    }
  }

  function recall(wallet: string) {
    address = wallet;
    lookup();
  }

  /** Same shape check the server runs, so obvious typos never leave the page. */
  function looksValid(value: string): boolean {
    const v = value.trim();
    return v.length >= 32 && v.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(v);
  }

  $: canSubmit = looksValid(address) && !loading;

  async function lookup() {
    const wallet = address.trim();
    if (!looksValid(wallet)) {
      error = 'That does not look like a Solana address.';
      result = null;
      return;
    }

    loading = true;
    error = '';
    try {
      const res = await fetch(`/api/dashboard/rank/${wallet}`);
      const body = await res.json();

      if (!res.ok) {
        error =
          res.status === 429
            ? 'Too many lookups — give it a minute.'
            : (body?.message ?? 'Could not look that wallet up.');
        result = null;
        return;
      }

      result = body as WalletRank;
    } catch {
      error = 'Network error. Try again.';
      result = null;
    } finally {
      loading = false;
    }
  }

  function reset() {
    address = '';
    result = null;
    error = '';
  }

  function ago(ms: number): string {
    const days = Math.floor((Date.now() - ms) / 86_400_000);
    if (days >= 1) return `${days}d ago`;
    const hours = Math.floor((Date.now() - ms) / 3_600_000);
    if (hours >= 1) return `${hours}h ago`;
    return 'just now';
  }

  /**
   * "Top 0.00%" is what rank 1 of 89,641 rounds to, and it reads as zero
   * percent rather than as the very top. Anything under a hundredth of a
   * percent is shown as a bound instead.
   */
  function topShare(percentile: number): string {
    const share = 100 - percentile;
    if (share < 0.01) return '<0.01%';
    return pct(share, 2);
  }

  /** Progress through the current tier, for the bar under the tier name. */
  $: tierProgress =
    result && result.toNextTier && result.toNextTier.tokens > 0
      ? (result.balance / (result.balance + result.toNextTier.tokens)) * 100
      : 100;
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">
      Find Your Rank
      <InfoTip
        label="Find Your Rank"
        text="Paste any Solana address to see where it sits among every $ANSEM holder — no wallet connection and no signature. Ranks are exact for the top of the index; below that a wallet holds dust, so it gets its real balance and tier without a position number." source={SOURCES.holders} />
    </h2>
    <span class="text-[0.6875rem]" style="color: var(--d-text-3);">address only · read-only</span>
  </header>

  <form class="flex gap-2 px-5 py-4 max-md:flex-col" on:submit|preventDefault={lookup}>
    <input
      type="text"
      inputmode="text"
      autocomplete="off"
      spellcheck="false"
      bind:value={address}
      placeholder="Paste a Solana wallet address"
      aria-label="Solana wallet address"
      class="d-numeric min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs outline-none transition-colors focus:border-[var(--d-accent)]"
      style="border-color: var(--d-border); background: var(--d-bg-subtle); color: var(--d-text);"
    />
    <button
      type="submit"
      disabled={!canSubmit}
      class="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      style="background: var(--d-accent-ink); color: var(--d-bg);"
    >
      {loading ? 'Looking up…' : 'Check'}
    </button>
  </form>

  {#if error}
    <p class="px-5 pb-4 text-[0.6875rem]" style="color: var(--d-down);">{error}</p>
  {/if}

  {#if saved.length > 0}
    <div class="flex flex-wrap items-center gap-1.5 px-5 pb-4">
      <span class="d-label mr-0.5">Saved</span>
      {#each saved as w (w.address)}
        <span
          class="flex items-center gap-1 rounded-lg border px-2 py-1"
          style="border-color: var(--d-border); background: var(--d-bg-subtle);"
        >
          <button
            type="button"
            class="d-numeric d-tap text-[0.6875rem] font-semibold"
            style="color: var(--d-text);"
            title="Look this wallet up again"
            on:click={() => recall(w.address)}
          >
            {shortAddress(w.address, 4, 4)}
            <span class="font-normal" style="color: var(--d-text-3);">
              {w.rank === null ? 'unranked' : `#${count(w.rank)}`}
            </span>
          </button>
          <button
            type="button"
            class="d-tap text-[0.6875rem] leading-none"
            style="color: var(--d-text-3);"
            aria-label="Remove {shortAddress(w.address, 4, 4)} from saved wallets"
            on:click={() => watchlist.remove(w.address)}
          >
            ×
          </button>
        </span>
      {/each}
      <span class="text-[0.625rem]" style="color: var(--d-text-3);">
        kept in this browser · {saved.length}/{WATCHLIST_MAX}
      </span>
    </div>
  {/if}

  {#if result}
    {@const hasRank = result.rank !== null}
    <div class="border-t" style="border-color: var(--d-border);">
      <div
        class="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-2"
        style="border-color: var(--d-border);"
      >
        {#if previous}
          <span class="text-[0.6875rem]" style="color: var(--d-text-3);">
            {#if rankDelta !== null && rankDelta !== 0}
              <span style="color: {rankDelta > 0 ? 'var(--d-up)' : 'var(--d-down)'};">
                {rankDelta > 0 ? '▲' : '▼'} {count(Math.abs(rankDelta))} places
              </span>
              since you saved it {ago(previous.seenAt)}
            {:else}
              Saved {ago(previous.seenAt)} · same rank since
            {/if}
          </span>
        {:else}
          <span class="text-[0.6875rem]" style="color: var(--d-text-3);">
            Save it to see what changes next time you check.
          </span>
        {/if}

        <button
          type="button"
          class="d-tap shrink-0 rounded-lg border px-2.5 py-1 text-[0.6875rem] font-semibold transition-colors hover:bg-[var(--d-hover)] disabled:opacity-40"
          style="border-color: var(--d-border); color: {isSaved
            ? 'var(--d-accent)'
            : 'var(--d-text-2)'};"
          disabled={saving}
          on:click={save}
        >
          {saving ? 'Saving…' : isSaved ? '★ Update saved' : '☆ Save wallet'}
        </button>
      </div>
      <!-- Headline: rank and percentile -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style="background: var(--d-surface-2);"
      >
        <div class="min-w-0">
          <p class="d-label">{hasRank ? 'Rank' : 'Holding'}</p>
          <p class="d-numeric mt-0.5 text-2xl font-semibold leading-none" style="color: var(--d-text);">
            {#if hasRank}
              #{count(result.rank ?? 0)}
              <span class="text-sm font-normal" style="color: var(--d-text-3);">
                of {count(result.totalHolders)}
              </span>
            {:else}
              Unranked
            {/if}
          </p>
          {#if hasRank && result.percentile !== null}
            <p class="mt-1 text-[0.6875rem]" style="color: var(--d-accent-ink);">
              Top {topShare(result.percentile)} of holders
            </p>
          {:else}
            <p class="mt-1 text-[0.6875rem]" style="color: var(--d-text-3);">
              Outside the top {count(result.rankedCount)} — balance and tier below are still exact
            </p>
          {/if}
        </div>

        <div class="text-right">
          <p class="d-label">Tier</p>
          <p class="mt-0.5 text-sm font-semibold" style="color: {result.tierColor};">
            {result.tierName}
          </p>
          <p class="d-numeric mt-0.5 text-[0.6875rem]" style="color: var(--d-text-3);">
            {shortAddress(result.wallet, 4, 4)}
          </p>
        </div>
      </div>

      {#if result.isPool}
        <p
          class="border-t px-5 py-2.5 text-[0.6875rem]"
          style="border-color: var(--d-border); color: var(--d-accent-ink);"
        >
          This address is a liquidity pool{result.poolLabel ? ` (${result.poolLabel})` : ''}, not
          someone's wallet — the balance is pooled liquidity.
        </p>
      {/if}

      <!-- Position detail -->
      <div class="grid grid-cols-3 border-t max-md:grid-cols-1" style="border-color: var(--d-border);">
        <div class="px-5 py-3.5">
          <p class="d-label">Balance</p>
          <p class="d-numeric mt-1 text-sm font-semibold" style="color: var(--d-text);">
            {compact(result.balance)}
          </p>
          <p class="mt-0.5 text-[0.625rem]" style="color: var(--d-text-3);">ANSEM</p>
        </div>
        <div class="px-5 py-3.5 max-md:border-t" style="border-left: 1px solid var(--d-border); border-color: var(--d-border);">
          <p class="d-label">Value</p>
          <p class="d-numeric mt-1 text-sm font-semibold" style="color: var(--d-text);">
            {usdCompact(result.valueUsd)}
          </p>
          <p class="mt-0.5 text-[0.625rem]" style="color: var(--d-text-3);">at live price</p>
        </div>
        <div class="px-5 py-3.5 max-md:border-t" style="border-left: 1px solid var(--d-border); border-color: var(--d-border);">
          <p class="d-label">Share of supply</p>
          <p class="d-numeric mt-1 text-sm font-semibold" style="color: var(--d-text);">
            {result.percentSupply < 0.0001 && result.percentSupply > 0
              ? '<0.0001%'
              : pct(result.percentSupply, 4)}
          </p>
          <p class="mt-0.5 text-[0.625rem]" style="color: var(--d-text-3);">of total</p>
        </div>
      </div>

      <!-- Next tier -->
      {#if result.toNextTier}
        <div class="border-t px-5 py-3.5" style="border-color: var(--d-border);">
          <div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <span class="d-label">Next tier</span>
            <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-2);">
              {compact(result.toNextTier.tokens)} more to
              <span style="color: {result.toNextTier.tierColor};">{result.toNextTier.tierName}</span>
            </span>
          </div>
          <div class="h-1 overflow-hidden rounded-full" style="background: var(--d-bg-subtle);">
            <div
              class="h-full rounded-full transition-[width] duration-500"
              style="width: {tierProgress}%; background: {result.tierColor};"
            />
          </div>
        </div>
      {:else}
        <p
          class="border-t px-5 py-2.5 text-[0.6875rem]"
          style="border-color: var(--d-border); color: var(--d-accent-ink);"
        >
          Top tier reached — nothing above {result.tierName}.
        </p>
      {/if}

      <div class="border-t px-5 py-2.5 text-right" style="border-color: var(--d-border);">
        <button
          type="button"
          class="text-[0.6875rem] underline underline-offset-2 transition-colors hover:opacity-75"
          style="color: var(--d-text-3);"
          on:click={reset}
        >
          Check another wallet
        </button>
      </div>
    </div>
  {/if}
</section>
