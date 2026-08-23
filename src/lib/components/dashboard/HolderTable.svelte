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

  $: filtered = query.trim()
    ? rows.filter((h) => h.owner.toLowerCase().includes(query.trim().toLowerCase()))
    : rows;
  $: hasMore = rows.length > 0 && rows[rows.length - 1].rank < indexed;

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
              No holder matches “{query}” in the rows loaded so far.
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
