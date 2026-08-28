<script lang="ts">
  // Ranks 11 and beyond. Pages in from the API on demand so the initial render
  // never carries ten thousand rows, with client-side filtering over what has
  // been loaded so far.
  import type { Holder, HoldersPage } from '$lib/dashboard/types';
  import { TIERS } from '$lib/tiers';
  import { compact, count, pct, shortAddress, usdCompact } from '$lib/dashboard/format';

  export let initial: Holder[] = [];
  export let indexed = 0;
  export let priceUsd = 0;

  const PAGE_SIZE = 100;
  const START_RANK = 11;

  let rows: Holder[] = initial;
  let nextPage = 2;
  let loading = false;
  let error = '';
  let query = '';
  let tierId = 'all';
  let band = 'any';
  let walletsOnly = false;

  // Sorting is deliberately absent. Rank is assigned by balance, and value and
  // percent of supply are both balance times a constant, so "sort by value" and
  // "sort by % supply" would be three buttons producing one order.
  //
  // Value is banded rather than thresholded for the same reason. Rows arrive in
  // rank order, so whatever is loaded is always the richest wallets — a
  // minimum can only trim the tail, and the first hundred below the top ten all
  // sit between roughly $90K and $180K, which is why "$1K+", "$10K+" and
  // "$100K+" each kept all hundred rows and read as dead buttons. Bands split
  // the list, and every control carries its own match count so a band with
  // nothing in it is visibly empty rather than apparently broken.
  const VALUE_BANDS = [
    { key: 'any', label: 'Any', min: 0, max: Infinity },
    { key: 'm1', label: '$1M+', min: 1_000_000, max: Infinity },
    { key: 'k100', label: '$100K–1M', min: 100_000, max: 1_000_000 },
    { key: 'k10', label: '$10K–100K', min: 10_000, max: 100_000 },
    { key: 'sub', label: 'Under $10K', min: 0, max: 10_000 }
  ] as const;

  const valueOf = (h: Holder) => h.balance * priceUsd;
  const inBand = (h: Holder, b: (typeof VALUE_BANDS)[number]) => {
    const v = valueOf(h);
    return v >= b.min && v < b.max;
  };

  $: needle = query.trim().toLowerCase();
  $: searched = needle ? rows.filter((h) => h.owner.toLowerCase().includes(needle)) : rows;
  $: peopleOnly = walletsOnly ? searched.filter((h) => !h.entity) : searched;

  // Counts are taken with the control's own dimension left out, so each number
  // says what clicking it would actually give you.
  $: tierCounts = new Map(
    TIERS.map((t) => [t.id, peopleOnly.filter((h) => h.tierId === t.id).length])
  );
  $: byTier = tierId === 'all' ? peopleOnly : peopleOnly.filter((h) => h.tierId === tierId);
  $: bandCounts = new Map(
    VALUE_BANDS.map((b) => [b.key, b.key === 'any' ? byTier.length : byTier.filter((h) => inBand(h, b)).length])
  );

  $: activeBand = VALUE_BANDS.find((b) => b.key === band) ?? VALUE_BANDS[0];
  $: filtered = band === 'any' ? byTier : byTier.filter((h) => inBand(h, activeBand));
  $: narrowed = filtered.length !== rows.length;
  $: poolCount = searched.filter((h) => h.entity).length;
  $: hasMore = rows.length > 0 && rows[rows.length - 1].rank < indexed;

  function reset() {
    query = '';
    tierId = 'all';
    band = 'any';
    walletsOnly = false;
  }

  function tierOf(tierId: string) {
    return TIERS.find((t) => t.id === tierId) ?? TIERS[0];
  }

  async function loadMore() {
    if (loading) return;
    loading = true;
    error = '';

    try {
      const res = await fetch(`/api/dashboard/holders?page=${nextPage}&pageSize=${PAGE_SIZE}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const page = (await res.json()) as HoldersPage;
      const seen = new Set(rows.map((r) => r.owner));
      rows = [...rows, ...page.holders.filter((h) => h.rank >= START_RANK && !seen.has(h.owner))];
      indexed = page.indexed;
      nextPage += 1;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not load more holders';
    } finally {
      loading = false;
    }
  }
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 max-md:px-4"
    style="border-color: var(--d-border);"
  >
    <div>
      <h2 class="text-sm font-semibold" style="color: var(--d-text);">Full Rankings</h2>
      <p class="mt-0.5 text-[0.6875rem]" style="color: var(--d-text-3);">
        Showing {count(filtered.length)} of {count(Math.max(0, indexed - 10))} ranked below the top 10
        {#if narrowed}
          · filtering {count(rows.length)} loaded rows
        {/if}
      </p>
    </div>

    <label class="relative">
      <span class="sr-only">Search holder address</span>
      <input
        type="search"
        bind:value={query}
        placeholder="Search address…"
        class="d-numeric w-52 rounded-lg border px-2.5 py-1.5 text-xs outline-none transition-colors focus:border-[var(--d-accent)] max-md:w-full"
        style="background: var(--d-bg-subtle); border-color: var(--d-border); color: var(--d-text);"
      />
    </label>
  </header>

  <!-- Filters apply to the rows fetched so far, not to all 9,990 — the count
       above says which, because a filtered view that silently covers a tenth of
       the set would read as the whole answer. -->
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-5 py-2.5 max-md:px-4"
    style="border-color: var(--d-border); background: var(--d-surface-2);"
  >
    <label class="flex items-center gap-1.5">
      <span class="d-label">Tier</span>
      <select
        bind:value={tierId}
        class="rounded border px-2 py-1.5 text-[0.6875rem] font-semibold outline-none focus:border-[var(--d-accent)]"
        style="background: var(--d-bg-subtle); border-color: var(--d-border); color: var(--d-text);"
      >
        <option value="all">All tiers ({count(peopleOnly.length)})</option>
        {#each TIERS as t (t.id)}
          <option value={t.id}>{t.name} ({count(tierCounts.get(t.id) ?? 0)})</option>
        {/each}
      </select>
    </label>

    <div class="flex items-center gap-1.5">
      <span class="d-label">Value</span>
      <div class="flex flex-wrap gap-0.5" role="group" aria-label="Holding value band">
        {#each VALUE_BANDS as b (b.key)}
          {@const n = bandCounts.get(b.key) ?? 0}
          <button
            type="button"
            class="d-tap rounded px-2 py-1 text-[0.6875rem] font-semibold transition-colors disabled:opacity-40"
            style={band === b.key
              ? 'background: var(--d-accent-soft); color: var(--d-accent-ink);'
              : `background: transparent; color: var(--d-text-3); opacity: ${n === 0 && b.key !== 'any' ? '0.45' : '1'};`}
            aria-pressed={band === b.key}
            disabled={priceUsd <= 0 && b.key !== 'any'}
            on:click={() => (band = b.key)}
          >
            {b.label}
            <span class="font-normal opacity-70">{count(n)}</span>
          </button>
        {/each}
      </div>
    </div>

    <label class="d-tap flex items-center gap-1.5 text-[0.6875rem]" style="color: var(--d-text-2);">
      <input type="checkbox" bind:checked={walletsOnly} class="accent-[var(--d-accent)]" />
      Hide pools and programs
      <span style="color: var(--d-text-3);">({count(poolCount)})</span>
    </label>

    {#if narrowed}
      <button
        type="button"
        class="d-tap ml-auto rounded px-2 py-1 text-[0.6875rem] font-semibold transition-colors hover:bg-[var(--d-hover)]"
        style="color: var(--d-accent);"
        on:click={reset}
      >
        Clear filters
      </button>
    {/if}
  </div>

  <div class="max-h-[640px] overflow-y-auto">
    <table class="w-full border-collapse text-sm">
      <thead class="sticky top-0 z-10" style="background: var(--d-surface-2);">
        <tr class="text-[0.625rem] uppercase tracking-wider" style="color: var(--d-text-3);">
          <th class="px-5 py-2.5 text-left font-semibold max-md:px-3">Rank</th>
          <th class="px-3 py-2.5 text-left font-semibold">Wallet</th>
          <th class="px-3 py-2.5 text-left font-semibold max-lg:hidden">Tier</th>
          <th class="px-3 py-2.5 text-right font-semibold">Balance</th>
          <th class="px-3 py-2.5 text-right font-semibold max-md:hidden">Value</th>
          <th class="px-5 py-2.5 text-right font-semibold max-md:px-3">Supply</th>
        </tr>
      </thead>

      <tbody>
        {#each filtered as holder (holder.owner)}
          {@const tier = tierOf(holder.tierId)}
          <tr
            class="transition-colors hover:bg-[var(--d-hover)]"
            style="border-top: 1px solid var(--d-border);"
          >
            <td class="d-numeric px-5 py-2 text-xs max-md:px-3" style="color: var(--d-text-3);">
              {holder.rank}
            </td>
            <td class="px-3 py-2">
              <a
                href="https://solscan.io/account/{holder.owner}"
                target="_blank"
                rel="noopener noreferrer"
                class="d-numeric text-xs hover:underline"
                style="color: var(--d-text);"
              >
                {shortAddress(holder.owner, 6, 6)}
              </a>
              {#if holder.entity}
                <span
                  class="ml-2 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold"
                  style="color: var(--d-accent-ink); background: var(--d-accent-soft);"
                  >{holder.entity}</span
                >
              {/if}
            </td>
            <td class="px-3 py-2 max-lg:hidden">
              <span class="text-xs" style="color: var(--d-text-2);">{tier.name}</span>
            </td>
            <td class="d-numeric px-3 py-2 text-right text-xs font-semibold" style="color: var(--d-text);">
              {compact(holder.balance)}
            </td>
            <td class="d-numeric px-3 py-2 text-right text-xs max-md:hidden" style="color: var(--d-text-2);">
              {priceUsd > 0 ? usdCompact(holder.balance * priceUsd) : '—'}
            </td>
            <td class="d-numeric px-5 py-2 text-right text-xs max-md:px-3" style="color: var(--d-text-2);">
              {pct(holder.percentSupply, 3)}
            </td>
          </tr>
        {/each}

        {#if filtered.length === 0}
          <tr>
            <td colspan="6" class="px-5 py-10 text-center text-[0.8125rem]" style="color: var(--d-text-3);">
              {#if needle}
                No holder matches “{query}” in the {count(rows.length)} rows loaded so far.
              {:else}
                No holder in the {count(rows.length)} rows loaded so far matches these filters.
                {#if hasMore}Loading more may find some.{/if}
              {/if}
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <footer
    class="flex flex-col items-center gap-2 border-t px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    {#if error}
      <p class="text-xs" style="color: var(--d-down);">{error}</p>
    {/if}

    {#if hasMore}
      <button
        type="button"
        class="rounded-lg border px-4 py-2 text-xs font-semibold transition-colors hover:bg-[var(--d-hover)] disabled:opacity-50"
        style="background: var(--d-bg-subtle); border-color: var(--d-border); color: var(--d-text);"
        on:click={loadMore}
        disabled={loading}
      >
        {loading ? 'Loading…' : `Load ${PAGE_SIZE} more`}
      </button>
    {:else if rows.length > 0}
      <p class="text-[0.6875rem]" style="color: var(--d-text-3);">
        All {count(indexed)} indexed holders loaded.
      </p>
    {/if}
  </footer>
</section>
