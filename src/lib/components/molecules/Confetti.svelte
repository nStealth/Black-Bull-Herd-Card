<script lang="ts">
  const colors = ['#ef4444', '#f59e0b', '#ffd700', '#22c55e', '#3b82f6', '#a855f7'];

  interface ConfettiPiece {
    left: string;
    color: string;
    delay: string;
    duration: string;
  }

  export let show: boolean = false;

  let pieces: ConfettiPiece[] = [];
  $: if (show) {
    pieces = Array.from({ length: 50 }, () => ({
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 2}s`
    }));
  }
</script>

{#if show}
  <div class="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
    {#each pieces as piece}
      <div
        class="absolute w-2.5 h-2.5 rounded-sm"
        style="
          left: {piece.left};
          top: -10px;
          background: {piece.color};
          animation: confetti {piece.duration} ease-out forwards;
          animation-delay: {piece.delay};
        "
      />
    {/each}
  </div>
{/if}
