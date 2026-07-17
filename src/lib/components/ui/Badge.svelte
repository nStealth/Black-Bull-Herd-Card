<script lang="ts">
  import { cn } from '$lib/utils/cn';

  type BadgeVariant = 'default' | 'outline' | 'tier';

  export let variant: BadgeVariant = 'default';
  export let color: string = '';
  export let className: string = '';
  export let children: string = '';
</script>

<span
  class={cn(
    'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider',
    variant === 'default' && 'bg-accent-purple/10 text-accent-purple border border-accent-purple/30',
    variant === 'outline' && 'bg-transparent border border-cyber-border text-text-secondary',
    variant === 'tier' && color ? 'border-2' : 'border border-cyber-border',
    className
  )}
  style={variant === 'tier' && color ? `border-color: ${color}; color: ${color}; background: ${color}20;` : ''}
>
  {#if children}
    {children}
  {:else}
    <slot />
  {/if}
</span>
