<script lang="ts">
  import { cn } from '$lib/utils/cn';

  export let className: string = '';
  export let hover: boolean = true;
</script>

<div
  class={cn(
    'bg-cyber-bg-card border border-cyber-border rounded-3xl p-8 relative overflow-hidden transition-all duration-300',
    hover && 'hover:border-white/20 hover:-translate-y-1',
    className
  )}
>
  <div
    class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
    aria-hidden="true"
  />
  <slot />
</div>
