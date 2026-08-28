<script lang="ts">
  // Stands in for a panel whose data provider is not configured.
  export let title: string;
  export let message: string;
</script>

<div class="d-card flex flex-col items-center justify-center gap-2.5 px-6 py-14 text-center">
  <p class="text-sm font-semibold" style="color: var(--d-text);">{title}</p>
  <p class="max-w-md text-[0.8125rem] leading-relaxed" style="color: var(--d-text-2);">
    {message}
  </p>
  <slot />
</div>
