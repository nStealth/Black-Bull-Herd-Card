<script lang="ts">
  import { CAMPAIGN_CLOSED, CAMPAIGN_CLOSED_ON } from '$lib/campaign';
  const siteUrl = import.meta.env.VITE_SITE_URL || "";
</script>

<svelte:head>
  <title>Campaign Rules | Black Bull Herd Card 🐂🀄️</title>
  <meta
    name="description"
    content="Rules for the Black Bull Herd Card community campaign, which closed on 17 August 2026."
  />
  <meta name="robots" content="noindex" />
  <meta property="og:url" content={siteUrl} />
  <meta name="twitter:url" content={siteUrl} />
</svelte:head>

<div
  class="max-w-[800px] mx-auto px-6 max-md:px-4 max-md:pt-[100px] pt-[120px] pb-20"
>
  <!-- Header -->
  <div class="text-center mb-12 animate-fadeIn">
    <div
      class="w-[100px] h-[100px] mx-auto mb-6 bg-cyber-bg-card rounded-[28px] flex items-center justify-center border border-cyber-border text-5xl"
    >
      🐂🀄️
    </div>
    <h1 class="text-[2.5rem] max-md:text-[2rem] font-extrabold mb-3">
      Campaign Rules
    </h1>
    <p class="text-lg text-text-secondary mb-4">
      Black Bull Herd Card – Community Initiative
    </p>
    <div
      class="inline-flex items-center gap-2 px-4 py-2 bg-accent-purple/10 border border-accent-purple/30 rounded-full text-sm text-accent-purple"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-accent-purple" />
      Community Project
    </div>

    {#if CAMPAIGN_CLOSED}
      <!--
        Everything below is written in the present tense for a window that has
        shut. Rather than rewrite rules nobody can act on, the page says up
        front that they are a record.
      -->
      <div
        class="mt-6 mx-auto max-w-2xl rounded-2xl border border-accent-amber/30 bg-accent-amber/[0.07] px-6 py-5 text-center"
      >
        <p class="text-sm font-semibold text-accent-amber">
          These rules are a record, not an open call
        </p>
        <p class="mt-2 text-[0.9375rem] leading-relaxed text-text-secondary">
          Claiming closed on {CAMPAIGN_CLOSED_ON} and cards can no longer be submitted. The
          rules are kept here for anyone who took part. What is still running is
          <a href="/dashboard" class="text-accent-amber underline">ANSEM Analytics</a> — free,
          live, and open to everyone.
        </p>
      </div>
    {/if}
  </div>

  <!-- Content -->
  <div
    class="bg-cyber-bg-card border border-cyber-border rounded-3xl p-10 max-md:p-6 animate-slideUp animate-delay-2"
  >
    <!-- Introduction -->
    <section class="mb-9 pb-9 border-b border-cyber-border">
      <p class="text-[1.0625rem] text-text-secondary leading-relaxed mb-3">
        🐂 <strong class="text-text-primary">Hey Bulls!</strong> This is a community
        love project created by $ANSEM believers, for $ANSEM believers. We're not
        the official team – we're just bulls who love the project and want to give
        back to the community!
      </p>
      <p class="text-[1.0625rem] text-text-secondary leading-relaxed">
        Our mission? <strong class="text-text-primary"
          >Build engagement, reward holders, and have fun together!</strong
        > Think of this as a collectible – like trading cards, but on-chain. Show
        off your rank, share your card, and be part of the herd! ⚡
      </p>
    </section>

    <!-- Rules -->
    <section class="mb-9 pb-9 border-b border-cyber-border">
      <h2 class="flex items-center gap-4 text-xl font-bold mb-4 flex-wrap">
        <span
          class="font-mono text-sm text-accent-red bg-accent-red/10 px-2.5 py-1 rounded-md"
          >01</span
        >
        Who Can Participate?
      </h2>
      <p class="text-text-secondary leading-relaxed mb-3">
        The Black Bull Herd Card NFT is for verified $ANSEM holders on Solana.
        You need:
      </p>
      <ul class="text-text-secondary list-disc pl-6 space-y-2 mb-4">
        <li>🔌 A Phantom wallet (recommended)</li>
        <li>
          💰 At least <strong class="text-text-primary">1 $ANSEM token</strong> in
          your wallet
        </li>
        <li>📱 Your tokens must be visible on-chain</li>
      </ul>
      <p
        class="flex items-start gap-2.5 px-4 py-3.5 rounded-xl text-sm bg-accent-blue/10 border border-accent-blue/20 text-accent-blue"
      >
        <svg
          class="w-4 h-4 mt-0.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span
          >We use read-only wallet connection. <strong
            >No signatures needed. Your funds are safe!</strong
          ></span
        >
      </p>
    </section>

    <section class="mb-9 pb-9 border-b border-cyber-border">
      <h2 class="flex items-center gap-4 text-xl font-bold mb-4 flex-wrap">
        <span
          class="font-mono text-sm text-accent-red bg-accent-red/10 px-2.5 py-1 rounded-md"
          >02</span
        >
        One Wallet = One Card
      </h2>
      <p class="text-text-secondary leading-relaxed mb-3">
        Each wallet gets <strong class="text-text-primary"
          >ONE unique Herd Card NFT</strong
        >. Simple rules:
      </p>
      <ul class="text-text-secondary list-disc pl-6 space-y-2">
        <li>✅ One wallet = one entry</li>
        <li>❌ No multi-accounting or abuse</li>
        <li>🔄 You can disconnect and reconnect a different wallet</li>
      </ul>
    </section>

    <section class="mb-9 pb-9 border-b border-cyber-border">
      <h2 class="flex items-center gap-4 text-xl font-bold mb-4 flex-wrap">
        <span
          class="font-mono text-sm text-accent-red bg-accent-red/10 px-2.5 py-1 rounded-md"
          >03</span
        >
        How to Get Your NFT
      </h2>
      <p class="text-text-secondary leading-relaxed mb-3">
        Follow these steps to secure your card:
      </p>
      <ul class="text-text-secondary list-disc pl-6 space-y-2 mb-4">
        <li>
          <strong class="text-text-primary">1.</strong> Connect your Phantom wallet
        </li>
        <li>
          <strong class="text-text-primary">2.</strong> Click "Check My Holdings"
          to verify your $ANSEM
        </li>
        <li>
          <strong class="text-text-primary">3.</strong> Share on X (we pre-fill the
          tweet for you!)
        </li>
        <li>
          <strong class="text-text-primary">4.</strong> Submit your tweet link
        </li>
        <li>
          <strong class="text-text-primary">5.</strong> Wait for the airdrop! 🎉
        </li>
      </ul>
      <p
        class="flex items-start gap-2.5 px-4 py-3.5 rounded-xl text-sm bg-accent-amber/10 border border-accent-amber/20 text-accent-amber"
      >
        ⚠️ Keep your tweet <strong class="text-text-primary">public</strong> until
        the campaign ends or you might not get your NFT!
      </p>
    </section>

    <section class="mb-9 pb-9 border-b border-cyber-border">
      <h2 class="flex items-center gap-4 text-xl font-bold mb-4 flex-wrap">
        <span
          class="font-mono text-sm text-accent-red bg-accent-red/10 px-2.5 py-1 rounded-md"
          >04</span
        >
        Limited Supply – First 20,000!
      </h2>
      <p class="text-text-secondary leading-relaxed mb-3">
        Only <strong class="text-text-primary">20,000 NFTs</strong> will be airdropped!
        After that, new entries are recorded but may not receive an NFT.
      </p>
      <ul class="text-text-secondary list-disc pl-6 space-y-2">
        <li>⏰ First-come, first-served</li>
        <li>🏆 Get in early for better tiers</li>
        <li>📈 Community may vote to expand supply</li>
      </ul>
    </section>

    <section class="mb-9 pb-9 border-b border-cyber-border">
      <h2 class="flex items-center gap-4 text-xl font-bold mb-4 flex-wrap">
        <span
          class="font-mono text-sm text-accent-red bg-accent-red/10 px-2.5 py-1 rounded-md"
          >05</span
        >
        Your Card Tiers
      </h2>
      <p class="text-text-secondary leading-relaxed mb-5">
        Your card rarity depends on how much $ANSEM you hold:
      </p>
      <div class="space-y-2.5">
        {#each [{ icon: "🐂", name: "Recruit Bull", balance: "1+ $ANSEM", color: "#8b8b8b", border: "border-l-[#8b8b8b]" }, { icon: "💎", name: "Iron Bull", balance: "100K+ $ANSEM", color: "#3b82f6", border: "border-l-accent-blue" }, { icon: "💜", name: "Gold Bull", balance: "1M+ $ANSEM", color: "#a855f7", border: "border-l-accent-purple" }, { icon: "👑", name: "Legendary Bull", balance: "10M+ $ANSEM", color: "#f59e0b", border: "border-l-accent-amber" }, { icon: "⚡", name: "Black God Bull", balance: "50M+ $ANSEM", color: "#ef4444", border: "border-l-accent-red", special: true }] as item}
          <div
            class="flex max-md:flex-wrap items-center gap-4 px-4 py-3.5 bg-cyber-bg-secondary rounded-xl transition-all hover:translate-x-1 hover:bg-cyber-bg-card-hover border-l-[3px]"
            style="border-color: {item.color}; {item.special
              ? 'background: rgba(239, 68, 68, 0.1);'
              : ''}"
          >
            <span class="text-2xl">{item.icon}</span>
            <span class="flex-1 font-semibold text-text-primary text-sm"
              >{item.name}</span
            >
            <span
              class="font-mono text-sm text-text-secondary max-md:w-full max-md:mt-1"
              >{item.balance}</span
            >
          </div>
        {/each}
      </div>
    </section>

    <section class="mb-9 pb-9 border-b border-cyber-border">
      <h2 class="flex items-center gap-4 text-xl font-bold mb-4 flex-wrap">
        <span
          class="font-mono text-sm text-accent-red bg-accent-red/10 px-2.5 py-1 rounded-md"
          >06</span
        >
        Campaign Timeline
      </h2>
      <p class="text-text-secondary leading-relaxed mb-3">
        <strong class="text-text-primary">30 days</strong> of pure bull energy! Here's
        what happens:
      </p>
      <ul class="text-text-secondary list-disc pl-6 space-y-2">
        <li>
          📅 <strong class="text-text-primary">Day 1-30:</strong> Connect, share,
          submit!
        </li>
        <li>
          📊 <strong class="text-text-primary">Day 31:</strong> Campaign ends, we
          verify everything
        </li>
        <li>
          🚀 <strong class="text-text-primary">Day 32-38:</strong> NFT airdrops begin!
        </li>
      </ul>
    </section>

    <section class="mb-9 pb-9 border-b border-cyber-border">
      <h2 class="flex items-center gap-4 text-xl font-bold mb-4 flex-wrap">
        <span
          class="font-mono text-sm text-accent-red bg-accent-red/10 px-2.5 py-1 rounded-md"
          >07</span
        >
        Safety First! 🛡️
      </h2>
      <p class="text-text-secondary leading-relaxed mb-3">
        We will <strong class="text-text-primary">NEVER</strong> ask you to:
      </p>
      <ul class="text-text-secondary list-disc pl-6 space-y-2 mb-4">
        <li>❌ Sign any transaction</li>
        <li>❌ Approve token spending</li>
        <li>❌ Send us any tokens</li>
        <li>❌ Share your seed phrase (ever!)</li>
      </ul>
      <p
        class="flex items-start gap-2.5 px-4 py-3.5 rounded-xl text-sm bg-accent-green/10 border border-accent-green/20 text-accent-green"
      >
        🛡️ If someone asks for these, they're scamming you! Report them.
      </p>
    </section>

    <section class="mb-0">
      <h2 class="flex items-center gap-4 text-xl font-bold mb-4 flex-wrap">
        <span
          class="font-mono text-sm text-accent-red bg-accent-red/10 px-2.5 py-1 rounded-md"
          >08</span
        >
        The Fine Print
      </h2>
      <p class="text-text-secondary leading-relaxed mb-3">
        This is a <strong class="text-text-primary">community project</strong>:
      </p>
      <ul class="text-text-secondary list-disc pl-6 space-y-2 mb-5">
        <li>🐂 Not affiliated with official $ANSEM team</li>
        <li>🎨 NFTs are collectibles – no guaranteed value</li>
        <li>⛓️ Blockchain = irreversible transactions</li>
        <li>💡 DYOR always! Don't invest more than you can lose.</li>
      </ul>
      <p
        class="px-5 py-5 bg-white/[0.02] rounded-xl italic text-text-muted text-sm"
      >
        By participating, you agree these are community-made collectibles for
        fun and engagement. Let's build something awesome together! ⚡ CHARGE
        FORWARD! 🐂
      </p>
    </section>

    <!-- CTA -->
    <section
      class="text-center p-10 max-md:p-6 mt-10 rounded-2xl"
      style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);"
    >
      <span class="text-5xl block mb-4">🐂🀄️</span>
      <h3 class="text-2xl font-bold mb-2">Ready to Join the Herd?</h3>
      <p class="text-text-secondary mb-6">
        Connect your wallet and claim your card before the 20K cap fills up!
      </p>
      <a
        href="/"
        class="inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-accent-red to-accent-amber text-white font-bold text-lg rounded-2xl transition-all hover:-translate-y-[3px] hover:shadow-xl hover:shadow-red-900/40"
      >
        ⚡ Let's Go!
      </a>
    </section>

    <p class="text-center mt-10 text-text-muted text-[0.8125rem]">
      Last updated: July 10, 2026
    </p>
  </div>
</div>
