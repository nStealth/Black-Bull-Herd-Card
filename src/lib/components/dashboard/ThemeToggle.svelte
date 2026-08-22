<script lang="ts">
  import { theme, toggleTheme } from '$lib/dashboard/theme';
</script>

<button
  type="button"
  class="group relative flex h-10 w-[76px] items-center rounded-full border p-1 transition-colors"
  style="background: var(--d-surface-solid); border-color: var(--d-border);"
  on:click={toggleTheme}
  aria-label="Switch to {$theme === 'dark' ? 'light' : 'dark'} theme"
  title="Toggle theme"
>
  <span
    class="absolute h-8 w-8 rounded-full transition-transform duration-300 ease-out"
    style="background: var(--d-accent); opacity: 0.18; transform: translateX({$theme === 'dark'
      ? '0'
      : '36px'});"
  />
  <span
    class="z-10 flex h-8 w-8 items-center justify-center text-sm transition-opacity"
    style="opacity: {$theme === 'dark' ? 1 : 0.35};">🌙</span
  >
  <span
    class="z-10 flex h-8 w-8 items-center justify-center text-sm transition-opacity"
    style="opacity: {$theme === 'light' ? 1 : 0.35};">☀️</span
  >
</button>
