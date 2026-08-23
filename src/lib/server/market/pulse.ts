// Derived signals: how hard the token is trading right now, and when it
// usually trades. Both are computed from data the dashboard already loads, so
// they cost no extra upstream call and cannot disagree with the panels above.

import type { ActivityStats, Candle, MarketPulse, TradingRhythm } from '$lib/dashboard/types';

/**
 * Compare the current hour against the day's own average.
 *
 * Absolute volume says nothing without a baseline — $400k in an hour is quiet
 * for one token and frantic for another. Dividing by the token's own 24h pace
 * makes the number self-referential and therefore readable at a glance.
 */
export function buildPulse(
  activity: ActivityStats | null,
  liquidityUsd: number,
  marketCapUsd: number
): MarketPulse | null {
  if (!activity?.h1 || !activity.h24) return null;

  const { h1, h6, h24 } = activity;
  const hourlyBaseline = h24.volumeUsd / 24;

  const share = (w: { buys: number | null; sells: number | null }): number | null => {
    if (w.buys === null || w.sells === null) return null;
    const total = w.buys + w.sells;
    return total === 0 ? null : (w.buys / total) * 100;
  };

  const buyNow = share(h1);
  const buyDay = share(h24);

  return {
    volumePace: hourlyBaseline > 0 ? h1.volumeUsd / hourlyBaseline : null,
    hourVolumeUsd: h1.volumeUsd,
    dayVolumeUsd: h24.volumeUsd,
    buyShareNow: buyNow,
    buyShare6h: share(h6),
    buyShareDay: buyDay,
    buyShareShift: buyNow !== null && buyDay !== null ? buyNow - buyDay : null,
    // Turnover: how many times the pooled liquidity, and the whole market cap,
    // changed hands in a day. High turnover against thin liquidity is the
    // signature of a token being traded far harder than it is capitalised.
    liquidityTurnover: liquidityUsd > 0 ? h24.volumeUsd / liquidityUsd : null,
    marketCapTurnover: marketCapUsd > 0 ? h24.volumeUsd / marketCapUsd : null
  };
}

/**
 * Fold a week of hourly candles into a 24-hour profile.
 *
 * Every candle is bucketed by its UTC hour, so the result answers "when does
 * this actually trade?" — the hours where liquidity is deepest and a large
 * order is least likely to move the price. Seven days is enough to average out
 * one loud session without smoothing the shape away entirely.
 */
export function buildRhythm(candles: Candle[]): TradingRhythm | null {
  if (candles.length < 24) return null;

  const volume = new Array<number>(24).fill(0);
  const samples = new Array<number>(24).fill(0);

  for (const candle of candles) {
    const hour = new Date(candle.t).getUTCHours();
    volume[hour] += candle.v;
    samples[hour] += 1;
  }

  // Average per occurrence, so a partial final day cannot inflate its hours.
  const hourly = volume.map((total, i) => (samples[i] > 0 ? total / samples[i] : 0));
  const peak = Math.max(...hourly);
  if (peak <= 0) return null;

  const busiest = hourly.indexOf(peak);
  const quietest = hourly.indexOf(Math.min(...hourly.filter((v) => v > 0)));

  return {
    hours: hourly,
    peakHourUtc: busiest,
    quietHourUtc: quietest === -1 ? 0 : quietest,
    peakVolumeUsd: peak,
    daysCovered: Math.round(candles.length / 24)
  };
}
