<script lang="ts">
  // Shown in place of a panel whose data provider is not configured.
  // Deliberately explicit: an empty state beats an invented number.
  export let title: string;
  export let message: string;
  export let icon: string = '🔌';
</script>

<div
  class="d-card flex flex-col items-center gap-3 px-6 py-12 text-center"
  style="border-style: dashed;"
>
  <span class="text-3xl opacity-60" aria-hidden="true">{icon}</span>
  <p class="text-base font-semibold" style="color: var(--d-text);">{title}</p>
  <p class="max-w-md text-sm leading-relaxed" style="color: var(--d-text-secondary);">
    {message}
  </p>
  <slot />
</div>
