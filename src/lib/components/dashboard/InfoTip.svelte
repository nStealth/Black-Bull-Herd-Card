<script lang="ts">
  // Small "!" affordance next to a panel title that explains what the panel is.
  //
  // The bubble is position:fixed rather than absolute. Every panel card is
  // `overflow-hidden`, so an absolutely-positioned popover would be clipped by
  // its own card; fixed coordinates are measured from the button instead, which
  // escapes the clip and lets the bubble flip when it would run off-screen.

  import { onDestroy } from 'svelte';

  export let text: string;
  /** Accessible name, so screen readers hear which panel this explains. */
  export let label: string;
  /**
   * Which provider these numbers came from. Rendered as a footer line so the
   * answer to "where did this come from" sits on the panel itself rather than
   * only in the page footer.
   *
   * Deliberately not a timestamp: the snapshot is fetched as one unit, so a
   * per-panel "updated 4s ago" would be the same number repeated sixteen times
   * dressed up as sixteen measurements. Freshness is reported once, in the
   * header, where it is true.
   */
  export let source = '';

  const WIDTH = 260;
  const GAP = 10;
  const MARGIN = 12;

  let open = false;
  let trigger: HTMLButtonElement;
  let x = 0;
  let y = 0;
  let above = false;
  let closeTimer: ReturnType<typeof setTimeout>;

  function place() {
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();

    // Flip above the trigger when there is not enough room below.
    const estimatedHeight = source ? 160 : 120;
    above = r.bottom + GAP + estimatedHeight > window.innerHeight;
    y = above ? r.top - GAP : r.bottom + GAP;

    // Centre on the trigger, then pull back inside the viewport at both edges.
    const ideal = r.left + r.width / 2 - WIDTH / 2;
    x = Math.min(Math.max(ideal, MARGIN), window.innerWidth - WIDTH - MARGIN);
  }

  function show() {
    clearTimeout(closeTimer);
    place();
    open = true;
  }

  /** Small delay so moving the pointer between button and bubble does not close it. */
  function scheduleHide() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => (open = false), 120);
  }

  function hideNow() {
    clearTimeout(closeTimer);
    open = false;
  }

  function toggle() {
    if (open) hideNow();
    else show();
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') hideNow();
  }

  onDestroy(() => clearTimeout(closeTimer));
</script>

<svelte:window on:scroll={hideNow} on:resize={hideNow} />
<svelte:document on:keydown={onKey} />

<button
  bind:this={trigger}
  type="button"
  class="info-trigger"
  class:is-open={open}
  aria-label="About {label}"
  aria-expanded={open}
  on:click|stopPropagation={toggle}
  on:mouseenter={show}
  on:mouseleave={scheduleHide}
  on:focus={show}
  on:blur={scheduleHide}
>
  !
</button>

{#if open}
  <div
    class="info-bubble"
    class:above
    role="tooltip"
    style="left: {x}px; top: {y}px; width: {WIDTH}px;"
    on:mouseenter={show}
    on:mouseleave={scheduleHide}
  >
    {text}
    {#if source}
      <span class="info-source">Source: {source}</span>
    {/if}
  </div>
{/if}

<style>
  .info-trigger {
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 15px;
    height: 15px;
    margin-left: 6px;
    border-radius: 9999px;
    border: 1px solid var(--d-border-strong);
    background: transparent;
    color: var(--d-text-3);
    font-size: 0.625rem;
    font-weight: 700;
    line-height: 1;
    cursor: help;
    vertical-align: middle;
    transition:
      color 0.15s ease,
      border-color 0.15s ease,
      background 0.15s ease;
  }

  /*
    The visual dot is 15px, which is right for something sitting beside a
    heading. The hit area is not: a finger needs about 44px, so an invisible
    pad is stretched around it rather than making the marker itself shout.
  */
  .info-trigger::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  .info-trigger:hover,
  .info-trigger:focus-visible,
  .info-trigger.is-open {
    color: var(--d-accent-ink);
    border-color: var(--d-accent-ink);
    background: var(--d-accent-soft);
    outline: none;
  }

  .info-bubble {
    position: fixed;
    z-index: 80;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--d-border);
    background: var(--d-surface);
    color: var(--d-text-2);
    box-shadow: var(--d-shadow-lg);
    font-size: 0.6875rem;
    line-height: 1.55;
    text-align: left;
    font-weight: 400;
    animation: tipIn 0.14s ease-out;
  }

  .info-source {
    display: block;
    margin-top: 8px;
    padding-top: 7px;
    border-top: 1px solid var(--d-border);
    color: var(--d-text-3);
    font-size: 0.625rem;
    line-height: 1.5;
  }

  /* When flipped, `top` is the trigger's top edge, so sit the bubble above it. */
  .info-bubble.above {
    transform: translateY(-100%);
  }

  @keyframes tipIn {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
    }
  }

  .info-bubble.above {
    animation: tipInAbove 0.14s ease-out;
  }

  @keyframes tipInAbove {
    from {
      opacity: 0;
      transform: translateY(calc(-100% + 3px));
    }
    to {
      opacity: 1;
      transform: translateY(-100%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .info-bubble,
    .info-bubble.above {
      animation: none;
    }
  }
</style>
