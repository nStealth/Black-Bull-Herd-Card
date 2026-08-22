<script lang="ts">
  // Rank chip. Top three get a tinted treatment; everyone else stays neutral.
  export let rank: number;
  export let size: number = 32;

  const HIGHLIGHT: Record<number, { fg: string; bg: string }> = {
    1: { fg: '#b98900', bg: 'rgba(185, 137, 0, 0.13)' },
    2: { fg: '#8b95a1', bg: 'rgba(139, 149, 161, 0.15)' },
    3: { fg: '#a9673b', bg: 'rgba(169, 103, 59, 0.14)' }
  };

  $: highlight = HIGHLIGHT[rank] ?? null;
</script>

<div
  class="d-numeric grid shrink-0 place-items-center rounded-lg font-semibold"
  style="width: {size}px; height: {size}px; font-size: {size * 0.36}px;
    color: {highlight ? highlight.fg : 'var(--d-text-3)'};
    background: {highlight ? highlight.bg : 'var(--d-bg-subtle)'};
    border: 1px solid {highlight ? 'transparent' : 'var(--d-border)'};"
>
  {rank}
</div>
