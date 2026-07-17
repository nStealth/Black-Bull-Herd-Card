<script lang="ts">
  export let message: string;
  export let variant: 'error' | 'success' | 'warning' | 'info' = 'error';
  export let className: string = '';

  const variantStyles: Record<string, string> = {
    error: 'bg-red-500/10 border-red-500/30 text-red-500',
    success: 'bg-green-500/10 border-green-500/30 text-green-500',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  };

  $: styles = variantStyles[variant] ?? variantStyles.error;
</script>

{#if message}
  <div class="{styles} border rounded-xl px-4 py-3.5 text-sm mt-4 {className}">
    {message}
  </div>
{/if}
