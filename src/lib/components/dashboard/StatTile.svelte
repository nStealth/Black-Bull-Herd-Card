<script lang="ts">
  // A single headline metric. `delta` renders a coloured change chip when set.
  export let label: string;
  export let value: string;
  export let icon: string = '';
  export let delta: number | null = null;
  export let hint: string = '';
  export let accent: string = 'var(--d-accent)';
  export let loading: boolean = false;

  $: deltaColor = delta === null ? '' : delta >= 0 ? 'var(--d-buy)' : 'var(--d-sell)';
  $: deltaLabel = delta === null ? '' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}%`;
</script>

<div class="d-card group relative overflow-hidden p-5 transition-transform hover:-translate-y-0.5">
  <div
    class="absolute inset-x-0 top-0 h-px opacity-60"
    style="background: linear-gradient(90deg, transparent, {accent}, transparent);"
    aria-hidden="true"
  />

  <div class="flex items-start justify-between gap-3">
    <span
      class="text-[0.6875rem] font-semibold uppercase tracking-[0.12em]"
      style="color: var(--d-text-muted);">{label}</span
    >
    {#if icon}
      <span class="text-base leading-none opacity-70" aria-hidden="true">{icon}</span>
    {/if}
  </div>

  {#if loading}
    <div
      class="mt-3 h-8 w-3/4 animate-pulse rounded-md"
      style="background: var(--d-border);"
      aria-hidden="true"
    />
  {:else}
    <p class="d-numeric mt-2 text-2xl font-bold max-md:text-xl" style="color: var(--d-text);">
      {value}
    </p>
  {/if}

  <div class="mt-2 flex items-center gap-2">
    {#if delta !== null && !loading}
      <span
        class="d-numeric rounded-md px-1.5 py-0.5 text-[0.6875rem] font-semibold"
        style="color: {deltaColor}; background: color-mix(in srgb, {deltaColor} 14%, transparent);"
      >
        {deltaLabel}
      </span>
    {/if}
    {#if hint}
      <span class="text-[0.6875rem]" style="color: var(--d-text-muted);">{hint}</span>
    {/if}
  </div>
</div>
