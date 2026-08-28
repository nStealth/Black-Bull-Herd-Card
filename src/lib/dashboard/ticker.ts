import { writable } from "svelte/store";

export type TickerReading = {
  priceUsd: number;
  changePct: number | null;
};

/**
 * The headline reading, published by the dashboard page so the layout header
 * can echo it once the hero has scrolled away.
 *
 * A store rather than a prop because the header lives in the layout and the
 * price lives in the page, and a second sticky bar of our own would sit under
 * the existing one — two stacked headers on a 375px screen is most of the
 * viewport gone.
 */
export const ticker = writable<TickerReading | null>(null);

/** True once the price hero has passed above the header. */
export const heroPassed = writable(false);
