<script lang="ts">
  // Standalone dashboard shell.
  //
  // The marketing site lives under the (site) route group with its own layout,
  // so this branch renders none of its header, footer or nav. There are
  // deliberately no links from here back to the marketing site.
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/stores';
  import { applyTheme, clearTheme, theme } from '$lib/dashboard/theme';
  import ThemeToggle from '$lib/components/dashboard/ThemeToggle.svelte';
  import SocialGlyph from '$lib/components/ui/SocialGlyph.svelte';
  import { OFFICIAL_LINKS, CREATOR_LINKS } from '$lib/social';

  const SITE = 'https://ansemherd.online';

  /**
   * Structured data for the dashboard branch.
   *
   * Search engines will happily invent a description from whatever text they
   * scrape first; naming the application and its purpose explicitly is how the
   * result page ends up saying what this actually is.
   */
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ANSEM Analytics',
    url: `${SITE}/dashboard`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    description:
      'Live on-chain analytics for the Solana token $ANSEM: price history, order flow, trade depth at size, holder distribution and contract safety.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true
  };

  const donateAddress =
    import.meta.env.VITE_DONATION_ADDRESS || '2EqZkzFGoPkZhymX9FpBqaEMN6YmzyNe85x9ygQ3atGs';

  let donateCopied = false;

  async function copyDonateAddress() {
    try {
      await navigator.clipboard.writeText(donateAddress);
      donateCopied = true;
      setTimeout(() => (donateCopied = false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  onMount(() => applyTheme($theme));
  onDestroy(clearTheme);
</script>

<svelte:head>
  <link rel="canonical" href="{SITE}{$page.url.pathname}" />
  {@html `<script type="application/ld+json">${JSON.stringify(structuredData)}<\/script>`}
</svelte:head>

<div class="flex min-h-screen flex-col" style="background: var(--d-bg);">
  <header
    class="sticky top-0 z-50 border-b backdrop-blur-xl"
    style="border-color: var(--d-border); background: color-mix(in srgb, var(--d-bg) 86%, transparent);"
  >
    <div class="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-6 max-md:px-4">
      <div class="flex items-center gap-2.5">
        <div
          class="grid h-7 w-7 place-items-center rounded-md text-[0.8125rem] font-bold"
          style="background: var(--d-accent-soft); color: var(--d-accent);"
          aria-hidden="true"
        >
          ◈
        </div>
        <span class="text-sm font-semibold tracking-tight" style="color: var(--d-text);">
          ANSEM Analytics
        </span>
        <span
          class="rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider"
          style="background: var(--d-accent-soft); color: var(--d-accent);"
        >
          Solana
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        {#each [{ href: '/dashboard/about', label: 'About' }, { href: '/dashboard/docs', label: 'Docs' }, { href: '/dashboard/api', label: 'API' }] as link (link.href)}
          <a
            href={link.href}
            class="rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--d-hover)]"
            style="color: {$page.url.pathname === link.href ? 'var(--d-accent)' : 'var(--d-text-2)'};"
          >
            {link.label}
          </a>
        {/each}
        <ThemeToggle />
      </div>
    </div>
  </header>

  <main class="flex-1">
    <slot />
  </main>

  <footer class="mt-8 border-t" style="border-color: var(--d-border);">
    <div class="mx-auto flex max-w-[1180px] flex-col items-center gap-6 px-6 py-9 text-center max-md:px-4">
      <!-- Identity -->
      <div class="flex items-center gap-3">
        <span class="text-2xl" aria-hidden="true">🐂🀄️</span>
        <div class="text-left">
          <p class="text-sm font-semibold" style="color: var(--d-text);">
            Black Bull - ANSEM Analytics
          </p>
          <p class="text-[0.6875rem]" style="color: var(--d-text-3);">
            Community Project • Built with ⚡ on Solana
          </p>
        </div>
      </div>

      <!-- Official sources -->
      <div class="flex flex-col items-center gap-3">
        <span class="d-label">Official Sources</span>
        <div class="flex flex-wrap items-center justify-center gap-2.5">
          {#each OFFICIAL_LINKS as link (link.href)}
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              title={link.label}
              class="relative grid h-10 w-10 place-items-center rounded-xl border transition-colors hover:bg-[var(--d-hover)]"
              class:vip-glow={link.vip}
              style="border-color: {link.vip
                ? 'color-mix(in srgb, var(--d-accent) 45%, transparent)'
                : 'var(--d-border)'};
                     color: {link.vip ? 'var(--d-accent)' : 'var(--d-text-2)'};"
            >
              <span class="h-[18px] w-[18px]"><SocialGlyph icon={link.icon} /></span>
              {#if link.vip}
                <span class="vip-dot" aria-hidden="true" />
              {/if}
            </a>
          {/each}
        </div>
      </div>

      <!-- Creator -->
      <div class="flex flex-col items-center gap-3">
        <span class="d-label">Creator</span>
        <div class="flex items-center justify-center gap-2.5">
          {#each CREATOR_LINKS as link (link.href)}
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              title={link.label}
              class="grid h-10 w-10 place-items-center rounded-xl border transition-colors hover:bg-[var(--d-hover)]"
              style="border-color: var(--d-border); color: var(--d-text-2);"
            >
              <span class="h-[18px] w-[18px]"><SocialGlyph icon={link.icon} /></span>
            </a>
          {/each}
        </div>
      </div>

      <!-- Support -->
      <button
        type="button"
        class="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[0.6875rem] transition-colors hover:bg-[var(--d-hover)]"
        style="border-color: var(--d-border); color: var(--d-text-3);"
        on:click={copyDonateAddress}
        title="Copy Solana address"
      >
        <span class="whitespace-nowrap">💛 Support the dev</span>
        <code class="d-numeric max-w-[130px] truncate">{donateAddress}</code>
        <span>{donateCopied ? '✅' : '📋'}</span>
      </button>

      <div
        class="flex flex-wrap items-center justify-center gap-2 text-[0.6875rem]"
        style="color: var(--d-text-3);"
      >
        <span>Market data from DexScreener · chain data from Solana mainnet</span>
        <span class="opacity-50 max-md:hidden">•</span>
        <span>Not financial advice</span>
        <span class="opacity-50 max-md:hidden">•</span>
        <span>Not affiliated with the $ANSEM team</span>
      </div>
    </div>
  </footer>
</div>

<style>
  /* The VIP link (Ansem's own account) pulses so it reads as the one worth
     clicking. Both the ring and the dot animate off the dashboard accent, so
     it stays correct in light and dark. */
  .vip-glow {
    animation: vipRing 2.4s ease-in-out infinite;
  }

  .vip-dot {
    position: absolute;
    top: -3px;
    right: -3px;
    width: 9px;
    height: 9px;
    border-radius: 9999px;
    background: var(--d-accent);
    border: 2px solid var(--d-bg);
    animation: vipBlink 2.4s ease-in-out infinite;
  }

  @keyframes vipRing {
    0%,
    100% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--d-accent) 40%, transparent);
    }
    50% {
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--d-accent) 0%, transparent);
    }
  }

  @keyframes vipBlink {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 5px color-mix(in srgb, var(--d-accent) 70%, transparent);
    }
    50% {
      opacity: 0.55;
      box-shadow: 0 0 12px color-mix(in srgb, var(--d-accent) 90%, transparent);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .vip-glow,
    .vip-dot {
      animation: none;
    }
  }
</style>
