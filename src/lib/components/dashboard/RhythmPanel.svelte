<script lang="ts">
  // When this token actually trades, folded from a week of hourly candles.
  //
  // Useful because slippage is not constant through the day: the hours with the
  // most volume are the hours a large order is least likely to move the price.
  // Shown in the viewer's own timezone as well as UTC, since "16:00 UTC" is not
  // a time anybody plans around.

  import type { TradingRhythm } from '$lib/dashboard/types';
  import { usdCompact } from '$lib/dashboard/format';
  import InfoTip from '$lib/components/dashboard/InfoTip.svelte';

  export let rhythm: TradingRhythm | null;

  /** Hour under the pointer, so the bars are readable without a tooltip each. */
  let hovered: number | null = null;

  const tzOffsetHours = -new Date().getTimezoneOffset() / 60;

  function localHour(utcHour: number): number {
    return (((utcHour + tzOffsetHours) % 24) + 24) % 24;
  }

  function fmt(hour: number): string {
    return `${String(Math.floor(hour)).padStart(2, '0')}:00`;
  }

  $: peak = rhythm ? Math.max(...rhythm.hours) : 0;
  $: currentUtcHour = new Date().getUTCHours();
  $: active = hovered ?? currentUtcHour;
</script>

<section class="d-card overflow-hidden">
  <header
    class="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3.5"
    style="border-color: var(--d-border);"
  >
    <h2 class="text-sm font-semibold" style="color: var(--d-text);">
      Trading Rhythm
      <InfoTip
        label="Trading Rhythm"
        text="Average volume by hour of day, folded from a week of hourly candles. Slippage is not constant through the day — the busiest hours are the ones where a large order is least likely to move the price. Bars are UTC; the labels underneath convert to your own timezone."
      />
    </h2>
    {#if rhythm}
      <span class="d-numeric text-[0.6875rem]" style="color: var(--d-text-3);">
        {rhythm.daysCovered}d average
      </span>
    {/if}
  </header>

  {#if rhythm && peak > 0}
    <div class="px-5 py-4">
      <div class="flex h-24 items-end gap-[2px]" role="img" aria-label="Volume by hour of day">
        {#each rhythm.hours as volume, hour (hour)}
          {@const isPeak = hour === rhythm.peakHourUtc}
          {@const isNow = hour === currentUtcHour}
          <button
            type="button"
            class="flex-1 rounded-sm transition-opacity"
            style="height: {Math.max(3, (volume / peak) * 100)}%;
                   background: {isPeak
              ? 'var(--d-accent)'
              : isNow
                ? 'var(--d-up)'
                : 'color-mix(in srgb, var(--d-accent) 32%, transparent)'};
                   opacity: {hovered === null || hovered === hour ? 1 : 0.45};"
            aria-label="{fmt(hour)} UTC: {usdCompact(volume)} average volume"
            on:mouseenter={() => (hovered = hour)}
            on:mouseleave={() => (hovered = null)}
            on:focus={() => (hovered = hour)}
            on:blur={() => (hovered = null)}
          />
        {/each}
      </div>

      <div class="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <span class="d-numeric text-xs font-semibold" style="color: var(--d-text);">
          {fmt(active)} UTC
          <span class="font-normal" style="color: var(--d-text-3);">
            · {fmt(localHour(active))} your time
          </span>
        </span>
        <span class="d-numeric text-xs font-semibold" style="color: var(--d-text);">
          {usdCompact(rhythm.hours[active] ?? 0)}
          <span class="font-normal text-[0.6875rem]" style="color: var(--d-text-3);">avg/hour</span>
        </span>
      </div>
    </div>

    <div class="grid grid-cols-2 border-t" style="border-color: var(--d-border);">
      <div class="px-5 py-3">
        <p class="d-label">Busiest hour</p>
        <p class="d-numeric mt-1 text-sm font-semibold" style="color: var(--d-accent);">
          {fmt(rhythm.peakHourUtc)} UTC
        </p>
        <p class="mt-0.5 text-[0.625rem]" style="color: var(--d-text-3);">
          {fmt(localHour(rhythm.peakHourUtc))} your time · {usdCompact(rhythm.peakVolumeUsd)}
        </p>
      </div>
      <div class="px-5 py-3" style="border-left: 1px solid var(--d-border);">
        <p class="d-label">Quietest hour</p>
        <p class="d-numeric mt-1 text-sm font-semibold" style="color: var(--d-text-2);">
          {fmt(rhythm.quietHourUtc)} UTC
        </p>
        <p class="mt-0.5 text-[0.625rem]" style="color: var(--d-text-3);">
          {fmt(localHour(rhythm.quietHourUtc))} your time · thinnest book
        </p>
      </div>
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
      <p class="text-sm font-medium" style="color: var(--d-text);">Rhythm unavailable</p>
      <p class="max-w-xs text-[0.6875rem]" style="color: var(--d-text-3);">
        Needs at least a day of hourly candles.
      </p>
    </div>
  {/if}
</section>
