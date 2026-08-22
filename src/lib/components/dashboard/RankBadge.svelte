<script lang="ts">
  // Rank insignia for the leaderboard. Top three get metal medals, the rest of
  // the top ten get a hex crest tinted with the holder's tier colour.
  import { TIERS } from '$lib/tiers';

  export let rank: number;
  export let tierId: string;
  export let size: number = 44;

  const MEDALS: Record<number, { ring: string; glow: string; glyph: string }> = {
    1: { ring: 'linear-gradient(140deg, #ffe89a, #f5b301 45%, #a26e00)', glow: '#f5b301', glyph: '👑' },
    2: { ring: 'linear-gradient(140deg, #f2f4f8, #b9c1cc 45%, #7c8695)', glow: '#c3cad4', glyph: '🥈' },
    3: { ring: 'linear-gradient(140deg, #f0c08a, #cd7f32 45%, #8a4f16)', glow: '#cd7f32', glyph: '🥉' }
  };

  $: medal = MEDALS[rank] ?? null;
  $: tierColor = TIERS.find((t) => t.id === tierId)?.color ?? '#8b8b8b';
  $: ring = medal ? medal.ring : `linear-gradient(140deg, ${tierColor}, color-mix(in srgb, ${tierColor} 40%, #000))`;
  $: glow = medal ? medal.glow : tierColor;
</script>

<div
  class="relative grid shrink-0 place-items-center rounded-2xl p-[2px]"
  style="width: {size}px; height: {size}px; background: {ring}; box-shadow: 0 0 18px -4px {glow};"
>
  <div
    class="grid h-full w-full place-items-center rounded-[14px]"
    style="background: var(--d-surface-solid);"
  >
    {#if medal}
      <span style="font-size: {size * 0.42}px; line-height: 1;" aria-hidden="true">{medal.glyph}</span>
    {:else}
      <span
        class="d-numeric font-bold"
        style="font-size: {size * 0.34}px; color: {tierColor};">{rank}</span
      >
    {/if}
  </div>

  {#if medal}
    <span
      class="d-numeric absolute -bottom-1 -right-1 grid place-items-center rounded-full px-1.5 text-[0.625rem] font-bold"
      style="background: var(--d-surface-solid); border: 1px solid var(--d-border); color: var(--d-text);"
      >{rank}</span
    >
  {/if}
</div>
