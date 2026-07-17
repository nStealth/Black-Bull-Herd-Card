<script lang="ts">
  import { cn } from '$lib/utils/cn';

  type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'phantom' | 'danger';
  type ButtonSize = 'sm' | 'md' | 'lg';

  export let variant: ButtonVariant = 'primary';
  export let size: ButtonSize = 'md';
  export let fullWidth: boolean = false;
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let className: string = '';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-accent-green text-white hover:bg-green-600 hover:-translate-y-0.5 shadow-lg shadow-green-900/30',
    secondary:
      'bg-cyber-bg-secondary text-text-primary border border-cyber-border hover:border-white/20 hover:bg-white/5',
    outline:
      'bg-transparent border border-cyber-border text-text-secondary hover:border-white/30 hover:text-text-primary hover:bg-white/5',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
    phantom:
      'bg-gradient-to-br from-[#5500ff] to-[#a259ff] text-white hover:-translate-y-0.5 shadow-lg shadow-purple-900/40',
    danger:
      'bg-red-600 text-white hover:bg-red-500 hover:-translate-y-0.5 shadow-lg shadow-red-900/30'
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-sm gap-1.5 rounded-lg',
    md: 'px-5 py-3 text-base gap-2 rounded-xl',
    lg: 'px-7 py-4 text-lg gap-2.5 rounded-2xl'
  };
</script>

<button
  {type}
  class={cn(
    'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && 'w-full',
    className
  )}
  disabled={disabled || loading}
  on:click
>
  {#if loading}
    <svg
      class="animate-spin h-5 w-5 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  {/if}
  <slot />
</button>
