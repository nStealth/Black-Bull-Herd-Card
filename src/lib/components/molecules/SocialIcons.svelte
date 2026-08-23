<script lang="ts">
  // Social bar for the marketing site — official project links plus the
  // creator's own. The destinations live in $lib/social so the dashboard
  // footer links to the same places; only the styling below is site-specific.
  import { OFFICIAL_LINKS, CREATOR_LINKS } from '$lib/social';
  import SocialGlyph from '$lib/components/ui/SocialGlyph.svelte';
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
      {#each OFFICIAL_LINKS as link (link.href)}
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          class="social-btn group {link.vip ? 'vip-btn' : ''}"
        >
          <div class="social-icon"><SocialGlyph icon={link.icon} /></div>
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
      {#each CREATOR_LINKS as link (link.href)}
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          class="social-btn group personal-btn"
        >
          <div class="social-icon"><SocialGlyph icon={link.icon} /></div>
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
