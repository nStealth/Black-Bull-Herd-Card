<script lang="ts">
  import { cn } from '$lib/utils/cn';

  export let className: string = '';
  export let size: 'sm' | 'md' = 'md';

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };
</script>

<svg
  class={cn('animate-spin shrink-0', sizeClasses[size], className)}
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
>
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
</svg>
