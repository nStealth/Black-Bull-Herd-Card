<script lang="ts">
  // Live X wall for the two project accounts.
  //
  // Why the official embed rather than our own renderer: X removed free read
  // access to timelines, and the syndication endpoints that used to back
  // third-party widgets now return empty bodies. The embed is the only route
  // that shows real posts without a paid key, so the wall renders genuine
  // content instead of a mock-up.
  //
  // Ranking and keyword filtering are not possible client-side for the same
  // reason — engagement counts are not exposed. Rather than fake them, the
  // filter chips hand the query to X's own search, which does rank and filter
  // for real. `min_faves:` / `since:` / `from:` are standard search operators.

  import { onMount } from 'svelte';

  interface Account {
    handle: string;
    name: string;
    blurb: string;
    badge: string;
    accent: string;
  }

  const ACCOUNTS: Account[] = [
    {
      handle: 'blackbullsol',
      name: 'Black Bull',
      blurb: 'Official $ANSEM project account',
      badge: '🐂',
      accent: '#f59e0b'
    },
    {
      handle: 'blknoiz06',
      name: 'Ansem',
      blurb: 'The man himself',
      badge: '👑',
      accent: '#ffd700'
    }
  ];

  const TIMELINE_HEIGHT = 620;
  /**
   * How long to wait for X's embed to report itself ready.
   *
   * createTimeline() resolves only once the cross-origin iframe posts its size
   * back. If that message never arrives — a blocked network, a privacy
   * extension, a throttled background tab — the promise simply never settles,
   * and without this the card would spin forever. Falling back to a plain link
   * is the honest outcome.
   */
  const READY_TIMEOUT_MS = 12_000;

  let active = ACCOUNTS[0].handle;
  /** Handles whose timeline has already been mounted, so switching is instant. */
  const mounted = new Set<string>();
  let containers: Record<string, HTMLDivElement | null> = {};
  let state: Record<string, 'idle' | 'loading' | 'ready' | 'failed'> = {
    blackbullsol: 'idle',
    blknoiz06: 'idle'
  };
  let visible = false;
  let section: HTMLElement;

  /** Days back for each quick filter, and the label shown on the chip. */
  const WINDOWS = [
    { key: '1', label: '24h', days: 1 },
    { key: '7', label: '7 days', days: 7 },
    { key: '30', label: '30 days', days: 30 },
    { key: 'all', label: 'All time', days: 0 }
  ];

  let windowDays = 7;

  function since(days: number): string {
    if (days <= 0) return '';
    const d = new Date(Date.now() - days * 86_400_000);
    return ` since:${d.toISOString().slice(0, 10)}`;
  }

  /** Build a real X search URL. `sort` picks X's Top vs Latest tab. */
  function searchUrl(query: string, sort: 'top' | 'live' = 'top'): string {
    return `https://x.com/search?q=${encodeURIComponent(query)}&f=${sort}`;
  }

  $: filters = [
    {
      key: 'top',
      label: 'Most liked',
      hint: 'X ranks by engagement',
      url: searchUrl(`(from:${active}) min_faves:100${since(windowDays)}`, 'top')
    },
    {
      key: 'retweets',
      label: 'Most reposted',
      hint: '50+ reposts',
      url: searchUrl(`(from:${active}) min_retweets:50${since(windowDays)}`, 'top')
    },
    {
      key: 'ansem',
      label: 'Mentions “ansem”',
      hint: 'keyword match',
      url: searchUrl(`(from:${active}) ansem${since(windowDays)}`, 'top')
    },
    {
      key: 'media',
      label: 'Charts & media',
      hint: 'images and video',
      url: searchUrl(`(from:${active}) filter:media${since(windowDays)}`, 'top')
    },
    {
      key: 'replies',
      label: 'Threads',
      hint: 'excludes replies',
      url: searchUrl(`(from:${active}) -filter:replies${since(windowDays)}`, 'live')
    }
  ];

  /**
   * Load widgets.js once, on demand. Returns null if it cannot load — an ad
   * blocker or a locked-down network is a normal outcome here, not an error.
   */
  function loadWidgetScript(): Promise<unknown> {
    const w = window as unknown as { twttr?: { widgets?: unknown; ready?: (cb: () => void) => void } };
    if (w.twttr?.widgets) return Promise.resolve(w.twttr);

    return new Promise((resolve) => {
      const existing = document.getElementById('twitter-wjs') as HTMLScriptElement | null;

      const settle = () => resolve(w.twttr?.widgets ? w.twttr : null);

      if (existing) {
        existing.addEventListener('load', settle, { once: true });
        existing.addEventListener('error', () => resolve(null), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'twitter-wjs';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      script.addEventListener('load', settle, { once: true });
      script.addEventListener('error', () => resolve(null), { once: true });
      document.head.appendChild(script);
    });
  }

  async function mountTimeline(handle: string) {
    if (mounted.has(handle)) return;
    const target = containers[handle];
    if (!target) return;

    mounted.add(handle);
    state[handle] = 'loading';

    const twttr = (await loadWidgetScript()) as
      | { widgets: { createTimeline: (src: unknown, el: HTMLElement, opts: unknown) => Promise<unknown> } }
      | null;

    if (!twttr) {
      state[handle] = 'failed';
      mounted.delete(handle);
      return;
    }

    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), READY_TIMEOUT_MS)
    );

    try {
      const frame = await Promise.race([
        twttr.widgets.createTimeline(
          { sourceType: 'profile', screenName: handle },
          target,
          {
            height: TIMELINE_HEIGHT,
            theme: 'dark',
            // Strip X's own header/footer/border so the embed sits in our card.
            chrome: 'noheader nofooter noborders transparent',
            borderColor: '#1a1a25',
            dnt: true
          }
        ),
        timeout
      ]);
      state[handle] = frame ? 'ready' : 'failed';
      if (!frame) mounted.delete(handle);
    } catch {
      state[handle] = 'failed';
      mounted.delete(handle);
    }
  }

  function select(handle: string) {
    active = handle;
    if (visible) mountTimeline(handle);
  }

  onMount(() => {
    // The wall sits at the bottom of a long page; loading a third-party script
    // for something nobody has scrolled to yet is pure waste.
    //
    // This uses a plain rect check rather than IntersectionObserver. IO is the
    // tidier API, but it reports nothing in environments that are not
    // compositing frames (headless runs, background tabs in some browsers),
    // and a wall that silently never loads is a worse failure than a scroll
    // listener. The listener is passive and removes itself on first hit.
    let done = false;

    const check = () => {
      if (done || !section) return;
      const rect = section.getBoundingClientRect();
      const nearViewport = rect.top < window.innerHeight + 300 && rect.bottom > -300;
      if (!nearViewport) return;

      done = true;
      visible = true;
      mountTimeline(active);
      teardown();
    };

    // Called directly rather than through requestAnimationFrame: rAF is
    // throttled in background and non-compositing tabs, which would leave the
    // wall stuck on its spinner until the tab was focused. check() is one rect
    // read and unbinds itself on first hit, so the cost is negligible.
    const onScroll = () => check();

    function teardown() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('visibilitychange', onScroll);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onScroll);
    check();

    return teardown;
  });

  $: activeAccount = ACCOUNTS.find((a) => a.handle === active) ?? ACCOUNTS[0];
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
    {#each ACCOUNTS as account (account.handle)}
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
        {#each WINDOWS as w (w.key)}
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
  {#each ACCOUNTS as account (account.handle)}
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

        {#if state[account.handle] === 'loading' || state[account.handle] === 'idle'}
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
