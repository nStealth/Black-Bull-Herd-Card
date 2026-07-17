<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import SocialIcons from '$lib/components/molecules/SocialIcons.svelte';

  const donateAddress = import.meta.env.VITE_DONATION_ADDRESS || '2EqZkzFGoPkZhymX9FpBqaEMN6YmzyNe85x9ygQ3atGs';
  let donateCopied = false;
  async function copyDonateAddress() {
    try {
      await navigator.clipboard.writeText(donateAddress);
      donateCopied = true;
      setTimeout(() => (donateCopied = false), 2000);
    } catch {
      // clipboard not available
    }
  }
</script>

<div class="min-h-screen flex flex-col">
  <!-- Header -->
  <header
    class="fixed top-0 left-0 right-0 h-[72px] max-md:h-16 bg-cyber-bg/90 backdrop-blur-xl border-b border-cyber-border z-[100]"
  >
    <div
      class="max-w-[1200px] mx-auto px-6 max-md:px-4 h-full flex items-center justify-between"
    >
      <!-- Logo -->
      <a
        href="/"
        class="flex items-center gap-3 hover:opacity-85 transition-opacity min-w-0"
      >
        <div
          class="w-[42px] h-[42px] rounded-xl flex items-center justify-center border border-cyber-border shrink-0 leading-none"
          style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.12));"
        >
          <span class="text-md leading-none inline-flex translate-y-px"
            >🐂🀄️</span
          >
        </div>
        <div class="flex flex-col gap-0.5 min-w-0">
          <span
            class="font-bold text-base text-text-primary leading-tight whitespace-nowrap"
            >Black Bull Herd</span
          >
          <span
            class="text-[0.625rem] font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap max-md:hidden"
            >Community Project</span
          >
        </div>
      </a>

      <!-- Nav -->
      <nav class="flex items-center gap-1.5 shrink-0">
        <a
          href="/"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-secondary font-medium text-[0.9375rem] transition-all hover:text-text-primary hover:bg-white/5 border {$page
            .url.pathname === '/'
            ? 'bg-red-500/12 text-text-primary border-red-500/30'
            : 'border-transparent'}"
        >
          <span class="text-[0.9375rem] leading-none">🏠</span>
          <span class="max-md:hidden">Home</span>
        </a>
        <a
          href="/rules"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-secondary font-medium text-[0.9375rem] transition-all hover:text-text-primary hover:bg-white/5 border {$page
            .url.pathname === '/rules'
            ? 'bg-red-500/12 text-text-primary border-red-500/30'
            : 'border-transparent'}"
        >
          <span class="text-[0.9375rem] leading-none">📜</span>
          <span class="max-md:hidden">Rules</span>
        </a>
      </nav>
    </div>
  </header>

  <!-- Main content -->
  <main class="flex-1 pt-[140px] max-md:pt-[120px]">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="px-6 py-10 max-md:px-4 max-md:py-8 border-t border-cyber-border mt-auto">
    <div class="max-w-[1200px] mx-auto flex flex-col items-center gap-6 text-center">
      <!-- Logo -->
      <div class="flex items-center gap-3.5">
        <span class="text-3xl">🐂🀄️</span>
        <div class="text-left">
          <p class="font-semibold text-[0.9375rem] text-text-primary m-0">Black Bull Herd Card</p>
          <p class="text-xs text-text-muted m-0">Community Project • Built with ⚡ on Solana</p>
        </div>
      </div>

      <!-- Social Icons -->
      <SocialIcons />

      <!-- Bottom legal row -->
      <div class="flex items-center gap-3 text-[0.8125rem] text-text-muted max-md:flex-col max-md:gap-2 mt-2">
        <a href="/rules" class="text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors">Campaign Rules</a>
        <span class="opacity-50 max-md:hidden">•</span>
        <span>Not affiliated with $ANSEM team</span>
      </div>

      <!-- Support button -->
      <button
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyber-border bg-transparent text-text-muted text-xs transition-all hover:border-accent-amber/30 hover:text-text-secondary hover:bg-accent-amber/[0.06]"
        on:click={copyDonateAddress}
        title="Copy Solana address"
      >
        <span class="whitespace-nowrap">💛 Support the dev</span>
        <code class="font-mono text-[0.6875rem] text-text-muted max-w-[130px] truncate whitespace-nowrap">{donateAddress}</code>
        <span class="text-[0.6875rem]">{donateCopied ? '✅' : '📋'}</span>
      </button>
    </div>
  </footer>
</div>
