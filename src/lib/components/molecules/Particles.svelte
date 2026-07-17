<script lang="ts">
  import { onMount } from 'svelte';

  let particles: Array<{
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
  }> = [];

  onMount(() => {
    particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.5 + 0.2
    }));
  });
</script>

<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
  {#each particles as particle, i}
    <div
      class="absolute rounded-full animate-float"
      style="
        left: {particle.x}%;
        top: {particle.y}%;
        width: {particle.size}px;
        height: {particle.size}px;
        opacity: {particle.opacity};
        animation-duration: {10 / particle.speed}s;
        animation-delay: -{i * 0.3}s;
        background: linear-gradient(135deg, #ef4444, #f59e0b);
      "
    />
  {/each}

  <!-- 3D Orb -->
  <div
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] opacity-40"
    style="perspective: 1200px;"
  >
    <div
      class="absolute inset-[36%] rounded-full animate-orbPulse"
      style="
        background: radial-gradient(circle at 32% 30%, #ffd700 0%, #f59e0b 35%, #ef4444 70%, transparent 100%);
        filter: blur(10px);
      "
    />
    <div
      class="absolute inset-0 rounded-full border-[1.5px] border-t-red-500/55 border-r-red-500/15 border-b-transparent border-l-transparent animate-orbSpin1"
      style="transform-style: preserve-3d;"
    />
    <div
      class="absolute inset-[10%] rounded-full border-[1.5px] border-t-accent-purple/45 border-l-accent-purple/15 border-b-transparent border-r-transparent animate-orbSpin2"
      style="transform-style: preserve-3d;"
    />
    <div
      class="absolute inset-[20%] rounded-full border-[1.5px] border-t-accent-amber/50 border-r-accent-amber/15 border-b-transparent border-l-transparent animate-orbSpin3"
      style="transform-style: preserve-3d;"
    />
  </div>
</div>
