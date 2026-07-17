<script lang="ts">
  // ============================================
  // Social bar — split into official project links
  // and personal / VIP links with distinct styling
  // ============================================

  interface SocialLink {
    href: string;
    label: string;
    icon: 'globe' | 'coinmarketcap' | 'coingecko' | 'bullpen' | 'x' | 'github';
    vip?: boolean;
  }

  const officialLinks: SocialLink[] = [
    {
      href: 'https://www.blackbullsol.com/',
      label: 'Official Website',
      icon: 'globe',
    },
    {
      href: 'https://coinmarketcap.com/de/currencies/the-black-bull/',
      label: 'CoinMarketCap',
      icon: 'coinmarketcap',
    },
    {
      href: 'https://www.coingecko.com/de/munze/the-black-bull',
      label: 'CoinGecko',
      icon: 'coingecko',
    },
    {
      href: 'https://app.bullpen.fi/',
      label: 'BullPen',
      icon: 'bullpen',
    },
    {
      href: 'https://x.com/blackbullsol',
      label: 'Black Bull X (Twitter)',
      icon: 'x',
    },
    {
      href: 'https://x.com/blknoiz06',
      label: 'VIP — blknoiz06',
      icon: 'x',
      vip: true,
    },
  ];

  const personalLinks: SocialLink[] = [
    {
      href: 'https://github.com/nStealth',
      label: 'GitHub — nStealth',
      icon: 'github',
    },
    {
      href: 'https://x.com/nstealth666',
      label: 'X — nStealth',
      icon: 'x',
    },
  ];
</script>

<div class="w-full">
  <!-- Top decorative line -->
  <div class="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

  <div class="flex flex-col items-center gap-4 sm:gap-5">
    <!-- Official Section Label -->
    <span class="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-text-muted">
      Official Sources
    </span>

    <!-- Official Links Row -->
    <div class="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
      {#each officialLinks as link}
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          class="social-btn group {link.vip ? 'vip-btn' : ''}"
        >
          <div class="social-icon">
            {#if link.icon === 'globe'}
              <!-- Globe / Website -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            {:else if link.icon === 'coinmarketcap'}
              <!-- CoinMarketCap diamond -->
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z"/>
              </svg>
            {:else if link.icon === 'coingecko'}
              <!-- CoinGecko lizard eye abstract -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10S2 17.5 2 12z"/>
                <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
                <path d="M12 5v-2M12 21v-2M5 12H3M21 12h-2" stroke-width="1.2" opacity="0.6"/>
              </svg>
            {:else if link.icon === 'bullpen'}
              <!-- Bull / shield -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M12 8v4M9 10h6" stroke-width="1.4"/>
              </svg>
            {:else if link.icon === 'x'}
              <!-- X (Twitter) -->
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            {/if}
          </div>
          {#if link.vip}
            <div class="vip-indicator" />
          {/if}
          <span class="tooltip {link.vip ? 'tooltip-gold' : ''}">{link.label}</span>
        </a>
      {/each}
    </div>

    <!-- Divider -->
    <div class="flex items-center gap-3 sm:gap-4 my-2 w-full max-w-[200px]">
      <div class="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
      <span class="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-text-muted/60">Creator</span>
      <div class="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
    </div>

    <!-- Personal Links Row -->
    <div class="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
      {#each personalLinks as link}
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          class="social-btn group personal-btn"
        >
          <div class="social-icon">
            {#if link.icon === 'github'}
              <!-- GitHub -->
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            {:else}
              <!-- X (Twitter) -->
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            {/if}
          </div>
          <span class="tooltip">{link.label}</span>
        </a>
      {/each}
    </div>
  </div>
</div>

<style>
  /* ============================================
     Base social button
     ============================================ */
  .social-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: visible;
  }

  .social-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px) scale(1.08);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  }

  .social-btn:active {
    transform: translateY(-1px) scale(0.98);
  }

  .social-icon {
    width: 20px;
    height: 20px;
    color: #a0a0b0;
    transition: color 0.3s ease;
  }

  .social-btn:hover .social-icon {
    color: #ffffff;
  }

  /* Personal links slightly different accent */
  .personal-btn:hover {
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.3),
      0 0 16px rgba(59, 130, 246, 0.15),
      0 0 0 1px rgba(59, 130, 246, 0.2) inset;
  }

  .personal-btn:hover .social-icon {
    color: #3b82f6;
  }

  /* ============================================
     VIP badge in Official Sources
     ============================================ */
  .vip-btn {
    border-color: rgba(245, 158, 11, 0.35);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(239, 68, 68, 0.04));
  }

  .vip-btn:hover {
    border-color: rgba(245, 158, 11, 0.6);
    box-shadow:
      0 8px 24px rgba(245, 158, 11, 0.15),
      0 0 0 1px rgba(245, 158, 11, 0.2) inset;
  }

  .vip-btn .social-icon {
    color: #f59e0b;
  }

  .vip-btn:hover .social-icon {
    color: #ffcc00;
  }

  /* Small VIP dot */
  .vip-indicator {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #f59e0b;
    border: 2px solid #0a0a0f;
    animation: vipBlink 2s ease-in-out infinite;
  }

  @keyframes vipBlink {
    0%, 100% { box-shadow: 0 0 4px rgba(245, 158, 11, 0.4); opacity: 1; }
    50% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.8); opacity: 0.7; }
  }

  /* ============================================
     Tooltip
     ============================================ */
  .tooltip,
  .tooltip-gold {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    padding: 6px 12px;
    border-radius: 10px;
    background: #1a1a25;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #a0a0b0;
    font-size: 0.6875rem;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 50;
  }

  .tooltip-gold {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.2);
    background: linear-gradient(135deg, #1a1a25, rgba(245, 158, 11, 0.05));
  }

  /* Tooltip arrow */
  .tooltip::after,
  .tooltip-gold::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #1a1a25;
  }

  .tooltip-gold::after {
    border-top-color: transparent;
  }

  .social-btn:hover .tooltip,
  .social-btn:hover .tooltip-gold {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
</style>
