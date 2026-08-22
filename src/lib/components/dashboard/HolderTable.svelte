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
    class="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4 max-md:px-4"
    style="border-color: var(--d-border);"
  >
    <div>
      <h2 class="text-lg font-bold" style="color: var(--d-text);">Full Holder Rankings</h2>
      <p class="mt-0.5 text-xs" style="color: var(--d-text-muted);">
        Showing {count(filtered.length)} of {count(Math.max(0, indexed - 10))} ranked below the top 10
      </p>
    </div>

    <label class="relative">
      <span class="sr-only">Search holder address</span>
      <input
        type="search"
        bind:value={query}
        placeholder="Search address…"
        class="d-numeric w-56 rounded-xl border px-3 py-2 text-xs outline-none transition-colors focus:border-[var(--d-border-strong)] max-md:w-full"
        style="background: var(--d-surface-solid); border-color: var(--d-border); color: var(--d-text);"
      />
    </label>
  </header>

  <div class="max-h-[640px] overflow-y-auto">
    <table class="w-full border-collapse text-sm">
      <thead class="sticky top-0 z-10" style="background: var(--d-surface-solid);">
        <tr class="text-[0.6875rem] uppercase tracking-wider" style="color: var(--d-text-muted);">
          <th class="px-6 py-3 text-left font-semibold max-md:px-3">Rank</th>
          <th class="px-3 py-3 text-left font-semibold">Wallet</th>
          <th class="px-3 py-3 text-left font-semibold max-lg:hidden">Tier</th>
          <th class="px-3 py-3 text-right font-semibold">Balance</th>
          <th class="px-3 py-3 text-right font-semibold max-md:hidden">Value</th>
          <th class="px-6 py-3 text-right font-semibold max-md:px-3">Supply</th>
        </tr>
      </thead>

      <tbody>
        {#each filtered as holder (holder.owner)}
          {@const tier = tierOf(holder.tierId)}
          <tr
            class="transition-colors hover:bg-[var(--d-surface-hover)]"
            style="border-top: 1px solid var(--d-border);"
          >
            <td class="d-numeric px-6 py-2.5 font-semibold max-md:px-3" style="color: var(--d-text-muted);">
              {holder.rank}
            </td>
            <td class="px-3 py-2.5">
              <a
                href="https://solscan.io/account/{holder.owner}"
                target="_blank"
                rel="noopener noreferrer"
                class="d-numeric hover:underline"
                style="color: var(--d-text);"
              >
                {shortAddress(holder.owner, 6, 6)}
              </a>
              {#if holder.entity}
                <span
                  class="ml-2 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold"
                  style="color: var(--d-accent); background: color-mix(in srgb, var(--d-accent) 14%, transparent);"
                  >{holder.entity}</span
                >
              {/if}
            </td>
            <td class="px-3 py-2.5 max-lg:hidden">
              <span class="text-xs font-medium" style="color: {tier.color};">{tier.name}</span>
            </td>
            <td class="d-numeric px-3 py-2.5 text-right font-semibold" style="color: var(--d-text);">
              {compact(holder.balance)}
            </td>
            <td class="d-numeric px-3 py-2.5 text-right max-md:hidden" style="color: var(--d-text-secondary);">
              {priceUsd > 0 ? usdCompact(holder.balance * priceUsd) : '—'}
            </td>
            <td class="d-numeric px-6 py-2.5 text-right max-md:px-3" style="color: var(--d-text-secondary);">
              {pct(holder.percentSupply, 3)}
            </td>
          </tr>
        {/each}

        {#if filtered.length === 0}
          <tr>
            <td colspan="6" class="px-6 py-10 text-center text-sm" style="color: var(--d-text-muted);">
              No holder matches “{query}” in the rows loaded so far.
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  <footer
    class="flex flex-col items-center gap-2 border-t px-6 py-4"
    style="border-color: var(--d-border);"
  >
    {#if error}
      <p class="text-xs" style="color: var(--d-sell);">{error}</p>
    {/if}

    {#if hasMore}
      <button
        type="button"
        class="rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
        style="background: var(--d-surface-solid); border-color: var(--d-border); color: var(--d-text);"
        on:click={loadMore}
        disabled={loading}
      >
        {loading ? 'Loading…' : `Load ${PAGE_SIZE} more`}
      </button>
    {:else if rows.length > 0}
      <p class="text-xs" style="color: var(--d-text-muted);">
        All {count(indexed)} indexed holders loaded.
      </p>
    {/if}
  </footer>
</section>
