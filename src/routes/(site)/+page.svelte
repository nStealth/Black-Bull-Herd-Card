<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { disconnectWallet } from "$lib/solana";
  import { getTier, formatBalance, shortAddress, type Tier } from "$lib/tiers";

  import Particles from "$lib/components/molecules/Particles.svelte";
  import Confetti from "$lib/components/molecules/Confetti.svelte";
  import HeroSection from "$lib/components/organisms/HeroSection.svelte";
  import CampaignEndedBanner from "$lib/components/organisms/CampaignEndedBanner.svelte";
  import WhatSection from "$lib/components/organisms/WhatSection.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Message from "$lib/components/ui/Message.svelte";
  import WalletConnect from "$lib/components/molecules/WalletConnect.svelte";
  import TierDisplay from "$lib/components/molecules/TierDisplay.svelte";
  import StatsGrid from "$lib/components/molecules/StatsGrid.svelte";
  import CardPreview from "$lib/components/molecules/CardPreview.svelte";
  import ActionButtons from "$lib/components/molecules/ActionButtons.svelte";
  import SubmitModal from "$lib/components/molecules/SubmitModal.svelte";
  import SuccessModal from "$lib/components/molecules/SuccessModal.svelte";

  // State
  let walletAddress = "";
  let isConnected = false;
  let isChecking = false;
  let isGenerating = false;
  let isSubmitting = false;
  let error = "";
  let success = "";

  // Results
  let balance = 0;
  let tier: Tier | null = null;
  let percentSupply = 0;
  let rank = "";
  let hasSubmitted = false;

  // UI State
  let showSubmitModal = false;
  let showSuccessModal = false;
  let tweetUrl = "";
  let tweetUrlError = "";
  let cardDataUrl = "";

  // Confetti
  let showConfetti = false;

  // Wallet state
  let hasWallet = false;
  let walletChecked = false;

  // Environment
  const siteUrl = import.meta.env.VITE_SITE_URL || "https://ansemherd.online";

  onMount(async () => {
    if (browser) {
      hasWallet = !!window?.solana?.isPhantom;

      try {
        if (window.solana?.isPhantom) {
          // @ts-ignore
          const response = await window.solana.connect({ onlyIfTrusted: true });
          if (response?.publicKey) {
            walletAddress = response.publicKey.toString();
            isConnected = true;
            await checkWallet();
          }
        }
      } catch {
        // User hasn't connected before
      }

      walletChecked = true;
    }
  });

  async function checkWallet() {
    if (!walletAddress || walletAddress.length < 32) {
      error = "Please connect your wallet first";
      return;
    }

    isChecking = true;
    error = "";
    success = "";

    try {
      const response = await fetch(`/api/check/${walletAddress}`);
      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      balance = data.balance;
      percentSupply = data.percent;
      rank = data.rank;
      hasSubmitted = data.hasSubmitted;

      const tierResult = getTier(balance);
      tier = tierResult.tier;

      await generateCard();

      if (hasSubmitted) {
        success = "🎉 You already submitted! Your NFT is reserved!";
      }
    } catch (e) {
      error = "Failed to check wallet. Please try again.";
      console.error(e);
    } finally {
      isChecking = false;
    }
  }

  async function generateCard() {
    if (!tier) return;

    isGenerating = true;

    try {
      const { renderHerdCard } = await import("$lib/cardGenerator");
      const cardData = {
        wallet: walletAddress,
        balance,
        tier,
        percentSupply,
      };

      cardDataUrl = await renderHerdCard(cardData);
    } catch (e) {
      console.error("Card generation error:", e);
    } finally {
      isGenerating = false;
    }
  }

  function shareToTwitter() {
    const tierName = tier?.name || "Bull";
    const formattedBalance = formatBalance(balance);

    const text = encodeURIComponent(
      `🐂🀄️ Just claimed my ${tierName} Herd Card!\n\n💰 Balance: ${formattedBalance} $ANSEM\n📊 Supply: ${percentSupply.toFixed(4)}%\n\nJoin the campaign & claim your exclusive NFT card before the 20K cap fills up! 🔥⚡️\n\n👉 https://ansemherd.online\n\n#Ansem #blackbullherd #ansemherd`,
    );

    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(twitterUrl, "_blank");
  }

  function openSubmitModal() {
    tweetUrl = "";
    tweetUrlError = "";
    showSubmitModal = true;
  }

  function validateTweetUrl(url: string): boolean {
    const pattern =
      /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+([?#].*)?$/i;
    return pattern.test(url);
  }

  async function submitTweet() {
    tweetUrlError = "";

    const trimmedTweetUrl = tweetUrl.trim();

    if (!validateTweetUrl(trimmedTweetUrl)) {
      tweetUrlError = "Please enter a valid Twitter/X URL";
      return;
    }

    isSubmitting = true;
    tweetUrlError = "";

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          tweetUrl: trimmedTweetUrl,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        showSubmitModal = false;
        showSuccessModal = true;
        hasSubmitted = true;
        showConfetti = true;
        setTimeout(() => {
          showConfetti = false;
        }, 5000);
      } else {
        if (data.reason === "already_submitted") {
          tweetUrlError = "This wallet has already submitted! ✅";
        } else if (data.reason === "wallet_not_found") {
          tweetUrlError = "Wallet not found. Please check your wallet first.";
        } else {
          tweetUrlError = "Failed to submit. Please try again.";
        }
      }
    } catch (e) {
      tweetUrlError = "Network error. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }

  function downloadCard() {
    if (!cardDataUrl) return;

    const link = document.createElement("a");
    link.download = `black-bull-herd-card-${shortAddress(walletAddress)}.webp`;
    link.href = cardDataUrl;
    link.click();
  }

  function handleDisconnect() {
    // Note: WalletConnect component already calls disconnectWallet(),
    // so we only reset local state here
    walletAddress = "";
    isConnected = false;
    balance = 0;
    tier = null;
    percentSupply = 0;
    rank = "";
    hasSubmitted = false;
    cardDataUrl = "";
    error = "";
    success = "";
  }

  function closeModalOnKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      showSubmitModal = false;
      showSuccessModal = false;
    }
  }
</script>

<svelte:head>
  <title>Black Bull Herd Card 🐂🀄️ | $ANSEM</title>
  <!--
    The description is what a link preview shows, so it has to describe what is
    here now. It sold the claim window for weeks after that window shut.
  -->
  <meta
    name="description"
    content="The Black Bull Herd Card, a community project for $ANSEM holders on Solana. Claiming closed on 17 August 2026; the live ANSEM Analytics dashboard is open to everyone."
  />
  <link rel="canonical" href={siteUrl} />
  <meta property="og:title" content="Black Bull Herd Card 🐂🀄️ | $ANSEM" />
  <meta
    property="og:description"
    content="A community project for $ANSEM holders. Claiming has closed — the live analytics dashboard is open to everyone, no wallet needed."
  />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={siteUrl} />
  <meta property="og:image" content="{siteUrl}/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="ANSEM Analytics — live overwatch for $ANSEM on Solana" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@blackbullsol" />
  <meta name="twitter:title" content="Black Bull Herd Card 🐂🀄️ | $ANSEM" />
  <meta
    name="twitter:description"
    content="A community project for $ANSEM holders. Claiming has closed — the live analytics dashboard is open to everyone, no wallet needed."
  />
  <meta name="twitter:image" content="{siteUrl}/og.png" />
  <meta name="twitter:url" content={siteUrl} />
</svelte:head>

<svelte:window on:keydown={closeModalOnKey} />

<Particles />

<main class="flex flex-col items-center px-6 pb-16 pt-[72px]">
  <CampaignEndedBanner />

  <HeroSection />
  <WhatSection />

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-8">
    <!-- Wallet Connection Card -->
    <Card className="animate-slideUp animate-delay-3">
      <div
        class="w-14 h-14 rounded-2xl bg-cyber-bg-secondary flex items-center justify-center mb-5 text-text-secondary"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M22 10h-4a2 2 0 0 0 0 4h4" />
        </svg>
      </div>
      <h2 class="text-xl font-bold mb-2">Connect Phantom Wallet</h2>
      <p class="text-text-secondary mb-6 text-[0.9375rem]">
        {#if !walletChecked}
          <span class="animate-pulse">🔍 Checking for Phantom...</span>
        {:else if hasWallet}
          Click to connect and verify your $ANSEM holdings
        {:else}
          <span class="text-red-500">Phantom not detected!</span>
        {/if}
      </p>

      <WalletConnect
        {walletAddress}
        {isConnected}
        {hasWallet}
        {walletChecked}
        onConnect={(address) => {
          walletAddress = address;
          isConnected = true;
          checkWallet();
        }}
        onDisconnect={handleDisconnect}
      />

      {#if isConnected}
        <Button
          variant="phantom"
          fullWidth
          className="mt-4"
          loading={isChecking || isGenerating}
          on:click={checkWallet}
        >
          {#if isChecking || isGenerating}
            ⚡ Checking on-chain data... hang tight!
          {:else}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Check My Holdings
          {/if}
        </Button>
      {/if}
    </Card>

    <!-- Balance & Tier Card -->
    {#if tier}
      <Card className="animate-slideUp animate-delay-4">
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style="background: {tier.color}20; color: {tier.color}"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            />
          </svg>
        </div>
        <h2 class="text-xl font-bold mb-2">Your Herd Status</h2>

        <TierDisplay {tier} />
        <StatsGrid {balance} {percentSupply} {rank} {tier} />

        {#if error}
          <Message variant="error" message={error} className="animate-shake" />
        {/if}

        {#if success}
          <Message
            variant="success"
            message={success}
            className="animate-glow"
          />
        {/if}
      </Card>
    {/if}

    <!-- Card Preview Card -->
    {#if cardDataUrl && tier}
      <Card className="md:col-span-2 animate-slideUp animate-delay-5">
        <h2
          class="text-xl font-bold mb-2 flex items-center justify-center gap-3"
        >
          <span>🀄️</span>
          Your Herd Card
          <span>🀄️</span>
        </h2>

        <CardPreview {cardDataUrl} {tier} />

        <ActionButtons
          {balance}
          {hasSubmitted}
          onShare={shareToTwitter}
          onSubmit={openSubmitModal}
          onDownload={downloadCard}
        />
      </Card>
    {/if}
  </div>

  <!-- Community Badge -->
  <div
    class="flex items-center justify-center gap-3 mt-12 text-sm text-text-muted animate-fadeIn animate-delay-6 max-md:flex-col"
  >
    <span>Built by bulls, for bulls 🐂</span>
    <span class="opacity-50 max-md:hidden">•</span>
    <a
      href="/rules"
      class="underline underline-offset-2 hover:text-text-primary transition-colors"
      >Campaign Rules</a
    >
  </div>
</main>

<SubmitModal
  open={showSubmitModal}
  bind:tweetUrl
  {tweetUrlError}
  {isSubmitting}
  onClose={() => (showSubmitModal = false)}
  onSubmit={submitTweet}
/>

<SuccessModal
  open={showSuccessModal}
  onClose={() => (showSuccessModal = false)}
/>

<Confetti show={showConfetti} />
