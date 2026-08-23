<script lang="ts">
  // Live X wall for the two project accounts, in marketing-site styling.
  //
  // The embed plumbing and the search-query building live in $lib/x so this and
  // the dashboard panel cannot drift apart. See $lib/x/embed.ts for why the
  // official embed is the only option and why loading is done the way it is.

  import { onDestroy, onMount } from 'svelte';
  import { mountTimeline, whenNearViewport } from '$lib/x/embed';
  import { X_ACCOUNTS, TIME_WINDOWS, buildFilters } from '$lib/x/accounts';

  const TIMELINE_HEIGHT = 620;

  let section: HTMLElement;
  let containers: Record<string, HTMLDivElement | null> = {};
  let active = X_ACCOUNTS[0].handle;
  let windowDays = 7;
  let visible = false;
  let state: Record<string, 'idle' | 'loading' | 'ready' | 'failed'> = {};
  /** Handles already rendered, so switching tabs does not re-fetch. */
  const rendered = new Set<string>();

  $: filters = buildFilters(active, windowDays);
  $: activeAccount = X_ACCOUNTS.find((a) => a.handle === active) ?? X_ACCOUNTS[0];

  async function render(handle: string) {
    const target = containers[handle];
    if (!target || rendered.has(handle)) return;

    rendered.add(handle);
    state[handle] = 'loading';

    // The marketing site is dark-only, so the embed is pinned to dark.
    const ok = await mountTimeline(target, {
      handle,
      theme: 'dark',
      height: TIMELINE_HEIGHT,
      borderColor: '#1a1a25'
    });

    state[handle] = ok ? 'ready' : 'failed';
    if (!ok) rendered.delete(handle);
  }

  function select(handle: string) {
    active = handle;
    if (visible) render(handle);
  }

  let stopWatching: (() => void) | undefined;

  onMount(() => {
    stopWatching = whenNearViewport(section, () => {
      visible = true;
      render(active);
    });
  });

  onDestroy(() => stopWatching?.());
</script>

<section
  bind:this={section}
  id="x-wall"
  class="mt-20 max-md:mt-14"
  aria-labelledby="x-wall-heading"
>
  <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h2
        id="x-wall-heading"
        class="flex items-center gap-2.5 text-2xl font-bold text-text-primary max-md:text-xl"
      >
        <svg viewBox="0 0 24 24" class="h-5 w-5 fill-current" aria-hidden="true">
          <path
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
        Live from X
      </h2>
      <p class="mt-1 text-sm text-text-muted">
        Real-time posts from the accounts that move this token
      </p>
    </div>

    <a
      href="https://x.com/{activeAccount.handle}"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 rounded-full border border-cyber-border px-4 py-2 text-sm font-semibold text-text-secondary transition-all hover:-translate-y-0.5 hover:border-white/25 hover:text-text-primary"
    >
      Follow @{activeAccount.handle}
      <span aria-hidden="true">↗</span>
    </a>
  </header>

  <!-- Account tabs -->
  <div class="mb-4 flex gap-2 max-md:flex-col" role="tablist" aria-label="X accounts">
    {#each X_ACCOUNTS as account (account.handle)}
      {@const isActive = account.handle === active}
      <button
        type="button"
        role="tab"
        id="x-tab-{account.handle}"
        aria-selected={isActive}
        aria-controls="x-panel-{account.handle}"
        class="flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all"
        style="border-color: {isActive ? account.accent + '66' : 'rgba(255,255,255,0.1)'};
               background: {isActive ? account.accent + '14' : 'transparent'};"
        on:click={() => select(account.handle)}
      >
        <span class="text-xl" aria-hidden="true">{account.badge}</span>
        <span class="min-w-0">
          <span
            class="block truncate text-sm font-bold"
            style="color: {isActive ? account.accent : 'var(--text-primary, #fff)'};"
          >
            @{account.handle}
          </span>
          <span class="block truncate text-xs text-text-muted">{account.blurb}</span>
        </span>
      </button>
    {/each}
  </div>

  <!-- Quick filters: handed to X's own search, which really does rank -->
  <div class="mb-4 rounded-2xl border border-cyber-border bg-cyber-bg-card/60 p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <p class="text-xs font-semibold uppercase tracking-wider text-text-muted">
        Search @{active} on X
      </p>
      <div class="flex gap-1" role="group" aria-label="Time window">
        {#each TIME_WINDOWS as w (w.key)}
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
            style="color: {windowDays === w.days ? '#fff' : '#606070'};
                   background: {windowDays === w.days ? 'rgba(255,255,255,0.1)' : 'transparent'};"
            aria-pressed={windowDays === w.days}
            on:click={() => (windowDays = w.days)}
          >
            {w.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      {#each filters as filter (filter.key)}
        <a
          href={filter.url}
          target="_blank"
          rel="noopener noreferrer"
          class="group inline-flex items-center gap-2 rounded-xl border border-cyber-border px-3 py-2 transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.04]"
          title={filter.hint}
        >
          <span class="text-xs font-semibold text-text-secondary group-hover:text-text-primary">
            {filter.label}
          </span>
          <span class="text-[0.625rem] text-text-muted" aria-hidden="true">↗</span>
        </a>
      {/each}
    </div>

    <p class="mt-3 text-[0.6875rem] leading-relaxed text-text-muted">
      X no longer exposes like and view counts without a paid API key, so these open X's own
      search rather than showing numbers we cannot verify.
    </p>
  </div>

  <!-- Timeline panels -->
  {#each X_ACCOUNTS as account (account.handle)}
    <div
      id="x-panel-{account.handle}"
      role="tabpanel"
      aria-labelledby="x-tab-{account.handle}"
      hidden={account.handle !== active}
    >
      <div
        class="overflow-hidden rounded-3xl border border-cyber-border bg-cyber-bg-card"
        style="min-height: {TIMELINE_HEIGHT}px;"
      >
        <div bind:this={containers[account.handle]} class="x-embed" />

        {#if state[account.handle] !== 'ready' && state[account.handle] !== 'failed'}
          <div
            class="flex flex-col items-center justify-center gap-3 px-6 text-center"
            style="height: {TIMELINE_HEIGHT}px;"
          >
            <div
              class="h-8 w-8 animate-spin rounded-full border-2 border-white/10"
              style="border-top-color: {account.accent};"
              aria-hidden="true"
            />
            <p class="text-sm text-text-muted">Loading @{account.handle}…</p>
          </div>
        {:else if state[account.handle] === 'failed'}
          <div
            class="flex flex-col items-center justify-center gap-3 px-6 text-center"
            style="height: {TIMELINE_HEIGHT}px;"
          >
            <span class="text-3xl" aria-hidden="true">🔌</span>
            <p class="text-sm font-semibold text-text-primary">Timeline could not load</p>
            <p class="max-w-sm text-xs leading-relaxed text-text-muted">
              X's embed did not respond — usually a privacy extension or ad blocker, sometimes
              just a slow connection. The posts are still there on X.
            </p>
            <a
              href="https://x.com/{account.handle}"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style="border-color: {account.accent}55; color: {account.accent};"
            >
              Open @{account.handle} on X ↗
            </a>
          </div>
        {/if}
      </div>
    </div>
  {/each}
</section>

<style>
  /* The embed injects an iframe we do not control; keep it from overflowing
     the rounded card on narrow screens. */
  .x-embed :global(iframe) {
    max-width: 100% !important;
  }
</style>
