<script lang="ts">
  // The API reference, retired.
  //
  // The endpoints still exist because the dashboard itself calls them from the
  // browser; what has been withdrawn is the invitation. Publishing a list of
  // routes with no key and no signup is an open door, and the two that cost
  // real work per request — the wallet lookup and the router quote — are the
  // two a script would hit hardest.
  //
  // The page is kept rather than deleted so the links already published to it
  // land somewhere that explains itself instead of on a 404.

  import { OFFICIAL_LINKS } from '$lib/social';

  const CONTACT = OFFICIAL_LINKS.find((l) => l.href.includes('blackbullsol'))?.href ?? 'https://x.com/blackbullsol';
</script>

<svelte:head>
  <title>API — ANSEM Analytics</title>
  <meta name="description" content="The ANSEM Analytics API is available on request rather than open to the public." />
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-[680px] px-6 py-14 max-md:px-4 max-md:py-9">
  <header class="mb-7">
    <p class="d-label">API</p>
    <h1 class="mt-2 text-2xl font-semibold tracking-tight max-md:text-xl" style="color: var(--d-text);">
      Available on request
    </h1>
  </header>

  <div class="d-card overflow-hidden">
    <div class="px-6 py-6 max-md:px-5">
      <p class="text-sm leading-relaxed" style="color: var(--d-text-2);">
        The public endpoint reference has been withdrawn. The data behind this dashboard is no
        longer documented as an open API, and the routes are not offered for general use.
      </p>

      <p class="mt-4 text-sm leading-relaxed" style="color: var(--d-text-2);">
        If you want live access — for a bot, a site, a terminal, or anything else — get in touch
        and say what you are building and roughly how often you would call it. Access is granted
        per project rather than left open, so that a script left running in a loop cannot degrade
        the dashboard for everyone reading it.
      </p>

      <a
        href={CONTACT}
        target="_blank"
        rel="noopener noreferrer"
        class="mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
        style="background: var(--d-accent-ink); color: var(--d-bg);"
      >
        Request access
        <span aria-hidden="true">→</span>
      </a>
    </div>

    <div class="border-t px-6 py-4 max-md:px-5" style="border-color: var(--d-border);">
      <p class="text-[0.6875rem] leading-relaxed" style="color: var(--d-text-3);">
        Everything the API returned is on the dashboard itself, free and without an account.
        <a href="/dashboard" class="underline" style="color: var(--d-accent);">Open the dashboard</a>
        or read
        <a href="/dashboard/docs" class="underline" style="color: var(--d-accent);">the documentation</a>
        for what each figure means and where it comes from.
      </p>
    </div>
  </div>
</div>
