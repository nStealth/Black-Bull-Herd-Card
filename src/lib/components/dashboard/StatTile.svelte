<script lang="ts">
  // One metric. Label, value, optional delta chip — nothing else.
  export let label: string;
  export let value: string;
  export let delta: number | null = null;
  export let hint: string = '';
  export let muted: boolean = false;

  $: deltaColor = delta === null ? '' : delta >= 0 ? 'var(--d-up)' : 'var(--d-down)';
</script>

<div class="d-card px-4 py-3.5">
  <p class="d-label">{label}</p>

  <p
    class="d-numeric mt-1.5 text-[1.375rem] font-semibold leading-none max-md:text-lg"
    style="color: {muted ? 'var(--d-text-3)' : 'var(--d-text)'};"
  >
    {value}
  </p>

  <div class="mt-2 flex items-center gap-1.5">
    {#if delta !== null}
      <span class="d-numeric text-[0.6875rem] font-semibold" style="color: {deltaColor};">
        {delta >= 0 ? '▲' : '▼'}
        {Math.abs(delta).toFixed(2)}%
      </span>
    {/if}
    {#if hint}
      <span class="truncate text-[0.6875rem]" style="color: var(--d-text-3);">{hint}</span>
    {/if}
  </div>
</div>
