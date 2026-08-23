<script lang="ts">
  // Live X timelines for the two tracked accounts, in dashboard styling.
  //
  // Unlike the marketing site's wall, this one follows the dashboard's light /
  // dark theme. X bakes the theme into the iframe when it is created and gives
  // no way to change it afterwards, so a theme switch re-mounts the timeline.

  import { onDestroy, onMount } from 'svelte';
  import { theme } from '$lib/dashboard/theme';
  import { mountTimeline, whenNearViewport } from '$lib/x/embed';
  import { X_ACCOUNTS, TIME_WINDOWS, buildFilters } from '$lib/x/accounts';

  const HEIGHT = 540;

  let section: HTMLElement;
  let container: HTMLDivElement | null = null;
  let active = X_ACCOUNTS[0].handle;
  let windowDays = 7;
  let status: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
  let visible = false;
  /** Guards against an older mount resolving after a newer one started. */
  let mountToken = 0;

  $: filters = buildFilters(active, windowDays);
  $: activeAccount = X_ACCOUNTS.find((a) => a.handle === active) ?? X_ACCOUNTS[0];

  async function render(handle: string, mode: 'light' | 'dark') {
    if (!container || !visible) return;

    const token = ++mountToken;
    status = 'loading';

    const ok = await mountTimeline(container, {
      handle,
      theme: mode,
      height: HEIGHT,
      borderColor: mode === 'dark' ? '#12161c' : '#ffffff'
    });

    if (token !== mountToken) return; // superseded by a newer render
    status = ok ? 'ready' : 'failed';
  }

  function select(handle: string) {
    if (handle === active) return;
    active = handle;
    render(handle, $theme);
  }

  // Re-mount whenever the dashboard theme flips; X cannot re-theme in place.
  let lastTheme: 'light' | 'dark' | null = null;
  $: if (visible && $theme !== lastTheme) {
    lastTheme = $theme;
    render(active, $theme);
  }

  let stopWatching: (() => void) | undefined;

  onMount(() => {
    stopWatching = whenNearViewport(section, () => {
      visible = true;
      lastTheme = $theme;
      render(active, $theme);
    });
  });

  onDestroy(() => stopWatching?.());
</script>

<section bind:this={section} class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
    style="border-color: var(--d-border);"
  >
    <h2 class="flex items-center gap-2 text-sm font-semibold" style="color: var(--d-text);">
      <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-current" aria-hidden="true">
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
      Live from X
    </h2>

    <div class="flex gap-0.5" role="tablist" aria-label="X accounts">
      {#each X_ACCOUNTS as account (account.handle)}
        <button
          type="button"
          role="tab"
          aria-selected={account.handle === active}
          class="d-numeric rounded px-2 py-1 text-[0.6875rem] font-semibold transition-colors"
          style={account.handle === active
            ? 'background: var(--d-accent-soft); color: var(--d-accent);'
            : 'background: transparent; color: var(--d-text-3);'}
          on:click={() => select(account.handle)}
        >
          @{account.handle}
        </button>
      {/each}
    </div>
  </header>

  <!-- Search shortcuts: handed to X, which really does rank -->
  <div class="border-b px-5 py-3" style="border-color: var(--d-border);">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p class="d-label">Search on X</p>
      <div class="flex gap-0.5" role="group" aria-label="Time window">
        {#each TIME_WINDOWS as w (w.key)}
          <button
            type="button"
            class="d-numeric rounded px-1.5 py-0.5 text-[0.625rem] font-semibold transition-colors"
            style={windowDays === w.days
              ? 'background: var(--d-accent-soft); color: var(--d-accent);'
              : 'background: transparent; color: var(--d-text-3);'}
            aria-pressed={windowDays === w.days}
            on:click={() => (windowDays = w.days)}
          >
            {w.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="flex flex-wrap gap-1.5">
      {#each filters as filter (filter.key)}
        <a
          href={filter.url}
          target="_blank"
          rel="noopener noreferrer"
          title={filter.hint}
          class="rounded-md border px-2 py-1 text-[0.6875rem] font-medium transition-colors hover:bg-[var(--d-hover)]"
          style="border-color: var(--d-border); color: var(--d-text-2);"
        >
          {filter.label}
        </a>
      {/each}
    </div>

    <p class="mt-2 text-[0.625rem] leading-relaxed" style="color: var(--d-text-3);">
      Like and view counts are not exposed without a paid X API key, so these open X's own search
      rather than showing numbers we cannot verify.
    </p>
  </div>

  <div class="relative" style="min-height: {HEIGHT}px;">
    <div bind:this={container} class="x-embed" />

    {#if status !== 'ready'}
      <div
        class="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center"
        style="background: var(--d-surface);"
      >
        {#if status === 'failed'}
          <p class="text-sm font-medium" style="color: var(--d-text);">Timeline unavailable</p>
          <p class="max-w-xs text-[0.6875rem] leading-relaxed" style="color: var(--d-text-3);">
            X's embed did not respond — usually a privacy extension or ad blocker, sometimes just a
            slow connection.
          </p>
          <a
            href="https://x.com/{activeAccount.handle}"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 rounded-md border px-3 py-1.5 text-[0.6875rem] font-semibold transition-colors hover:bg-[var(--d-hover)]"
            style="border-color: var(--d-border); color: var(--d-accent);"
          >
            Open @{activeAccount.handle} on X ↗
          </a>
        {:else}
          <div
            class="h-6 w-6 animate-spin rounded-full border-2"
            style="border-color: var(--d-border); border-top-color: var(--d-accent);"
            aria-hidden="true"
          />
          <p class="text-[0.6875rem]" style="color: var(--d-text-3);">
            Loading @{activeAccount.handle}…
          </p>
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .x-embed :global(iframe) {
    max-width: 100% !important;
  }
</style>
