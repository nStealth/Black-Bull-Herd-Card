// Risk metrics derived from the daily candle history.
//
// Everything here is computed from the OHLCV series the chart already loads,
// so the panel costs no extra upstream call and cannot disagree with the chart
// sitting above it.

import type { Candle, RiskProfile } from '$lib/dashboard/types';

/** Trading days per year. Crypto never closes, so it is all of them. */
const PERIODS_PER_YEAR = 365;

/**
 * Window for the headline metrics.
 *
 * Measured over the whole history these numbers are dominated by the launch:
 * the first days off a bonding curve produced a +4,856% day and pushed
 * annualised volatility past 1,000%. Both are arithmetically correct and
 * useless — nobody can trade on a launch artefact. A trailing 30-day window is
 * the usual convention for realised volatility and describes the token as it
 * trades now. Peak-to-trough since launch is kept separately, where the full
 * history genuinely is the interesting part.
 */
const WINDOW_DAYS = 30;

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Largest peak-to-trough decline across a close series, in percent. */
function maxDrawdown(closes: number[]): number {
  let peak = closes[0];
  let worst = 0;
  for (const close of closes) {
    if (close > peak) peak = close;
    const drop = ((peak - close) / peak) * 100;
    if (drop > worst) worst = drop;
  }
  return worst;
}

/**
 * Build the risk profile from daily candles.
 *
 * Volatility is the annualised standard deviation of daily log returns — the
 * standard realised-volatility measure, not a proprietary score. Drawdowns are
 * measured on closes, so they reflect days that actually closed at a loss
 * rather than an intraday wick nobody could have sold into.
 */
export function buildRiskProfile(candles: Candle[]): RiskProfile | null {
  const allCloses = candles.map((c) => c.c).filter((c) => c > 0);
  if (allCloses.length < 3) return null;

  const closes = allCloses.slice(-WINDOW_DAYS);
  if (closes.length < 3) return null;

  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push(Math.log(closes[i] / closes[i - 1]));
  }

  const highestClose = Math.max(...closes);
  const last = closes[closes.length - 1];
  const simpleReturns = returns.map((r) => (Math.exp(r) - 1) * 100);
  const upDays = simpleReturns.filter((r) => r > 0).length;

  return {
    volatilityPct: stdev(returns) * Math.sqrt(PERIODS_PER_YEAR) * 100,
    maxDrawdownPct: maxDrawdown(closes),
    maxDrawdownAllPct: maxDrawdown(allCloses),
    currentDrawdownPct: ((highestClose - last) / highestClose) * 100,
    bestDayPct: Math.max(...simpleReturns),
    worstDayPct: Math.min(...simpleReturns),
    upDayRatio: (upDays / simpleReturns.length) * 100,
    days: closes.length,
    historyDays: allCloses.length
  };
}
