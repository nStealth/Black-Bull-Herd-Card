<script lang="ts">
  // The two X accounts worth watching, as links out.
  //
  // This panel used to embed live timelines. It was removed because the embed
  // could not be made to work: X rate-limits the syndication endpoint and only
  // renders embedded timelines for viewers already signed in, so most visitors
  // got an error box where the feed should be. See $lib/x/accounts.ts.

  import { X_ACCOUNTS } from '$lib/x/accounts';
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex items-center justify-between gap-3 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="flex items-center gap-2 text-sm font-semibold" style="color: var(--d-text);">
      <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-current" aria-hidden="true">
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
      Follow on X
    </h2>
  </header>

  <div class="grid grid-cols-2 max-md:grid-cols-1">
    {#each X_ACCOUNTS as account, i (account.handle)}
      <a
        href="https://x.com/{account.handle}"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[var(--d-hover)]"
        style="border-left: {i > 0 ? '1px solid var(--d-border)' : 'none'};"
      >
        <span class="text-xl" aria-hidden="true">{account.badge}</span>

        <span class="min-w-0 flex-1">
          <span class="d-numeric block truncate text-sm font-semibold" style="color: var(--d-text);">
            @{account.handle}
          </span>
          <span class="block truncate text-[0.6875rem]" style="color: var(--d-text-3);">
            {account.blurb}
          </span>
        </span>

        <span class="shrink-0 text-xs" style="color: var(--d-accent);" aria-hidden="true">↗</span>
      </a>
    {/each}
  </div>
</section>
