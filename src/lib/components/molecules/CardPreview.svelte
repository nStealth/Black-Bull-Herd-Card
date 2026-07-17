<script lang="ts">
  import type { Tier } from '$lib/tiers';
  import { cn } from '$lib/utils/cn';

  export let cardDataUrl: string;
  export let tier: Tier | null;
  export let className: string = '';

  $: tierColor = tier?.color || '#ffffff';
</script>

<div class={cn('relative mx-auto max-w-sm my-6', className)}>
  <!-- Glow effect -->
  <div
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full blur-[80px] opacity-30 -z-10"
    style="background: {tierColor};"
  />
  <!-- Card image -->
  <div class="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/50 hover:scale-[1.02] transition-transform duration-300">
    <img src={cardDataUrl} alt="Your Black Bull Herd Card" class="w-full h-full object-cover" />
  </div>
</div>
