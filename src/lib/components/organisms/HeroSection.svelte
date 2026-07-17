<script lang="ts">
  import CountdownTimer from '$lib/components/molecules/CountdownTimer.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
</script>

<div class="text-center mb-12">
  <div class="flex flex-col items-center gap-6 animate-fadeIn">
    <Badge variant="default">
      <span class="w-2 h-2 rounded-full bg-accent-purple animate-pulse inline-block" />
      Community Project
    </Badge>

    <CountdownTimer />

    <h1 class="text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold leading-tight">
      <span class="block text-3xl mb-2">🐂🀄️</span>
      <span
        class="bg-gradient-to-r from-accent-red via-accent-amber to-accent-gold bg-clip-text text-transparent"
      >
        Black Bull Herd Card
      </span>
    </h1>

    <p class="text-xl text-accent-amber font-semibold animate-fadeIn animate-delay-1">
      ⚡ Join the most exclusive NFT collection for $ANSEM holders ⚡
    </p>

    <p class="text-lg text-text-secondary max-w-xl leading-relaxed animate-fadeIn animate-delay-2">
      Connect your Phantom wallet to verify your holdings and claim your unique Herd Card NFT.
      <strong class="text-text-primary">Only 20,000 cards</strong>
      will be airdropped to eligible holders!
    </p>
  </div>
</div>
