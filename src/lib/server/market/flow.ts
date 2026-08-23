// Who is accumulating and who is distributing, right now.
//
// Built by folding the raw trade tape by wallet: every swap in the window is
// added to that wallet's running total, buys positive and sells negative. What
// comes out is the thing aggregate volume hides — a 50/50 buy-sell split can be
// one wallet quietly taking the other side of two hundred small sells.
//
// The window is whatever the tape actually covers, which is roughly ninety
// minutes on this pool, not a day. It is measured from the trades themselves
// and reported, because "top buyer today" would be wrong by a factor of sixteen.

import type { Holder, TradeEvent, TradeFlow, WalletFlow } from '$lib/dashboard/types';

/** Trades at or above this count as whale-sized for the split below. */
const WHALE_USD = 10_000;
/** Below this is retail. Between the two is the middle band. */
const RETAIL_USD = 1_000;

const TOP_N = 5;

export function buildTradeFlow(
  trades: TradeEvent[],
  holders: Holder[] | null
): TradeFlow | null {
  if (trades.length === 0) return null;

  const rankByOwner = new Map<string, number>();
  const entityByOwner = new Map<string, string>();
  for (const h of holders ?? []) {
    rankByOwner.set(h.owner, h.rank);
    if (h.entity) entityByOwner.set(h.owner, h.entity);
  }

  interface Acc {
    bought: number;
    sold: number;
    trades: number;
  }
  const byWallet = new Map<string, Acc>();

  let buyVolume = 0;
  let sellVolume = 0;
  const bands = { retail: 0, mid: 0, whale: 0 };

  for (const t of trades) {
    const acc = byWallet.get(t.wallet) ?? { bought: 0, sold: 0, trades: 0 };
    if (t.kind === 'buy') {
      acc.bought += t.amountUsd;
      buyVolume += t.amountUsd;
    } else {
      acc.sold += t.amountUsd;
      sellVolume += t.amountUsd;
    }
    acc.trades += 1;
    byWallet.set(t.wallet, acc);

    if (t.amountUsd >= WHALE_USD) bands.whale += t.amountUsd;
    else if (t.amountUsd >= RETAIL_USD) bands.mid += t.amountUsd;
    else bands.retail += t.amountUsd;
  }

  const wallets: WalletFlow[] = [...byWallet.entries()].map(([wallet, a]) => ({
    wallet,
    netUsd: a.bought - a.sold,
    boughtUsd: a.bought,
    soldUsd: a.sold,
    trades: a.trades,
    rank: rankByOwner.get(wallet) ?? null,
    entity: entityByOwner.get(wallet) ?? null
  }));

  const accumulators = wallets
    .filter((w) => w.netUsd > 0)
    .sort((a, b) => b.netUsd - a.netUsd)
    .slice(0, TOP_N);

  const distributors = wallets
    .filter((w) => w.netUsd < 0)
    .sort((a, b) => a.netUsd - b.netUsd)
    .slice(0, TOP_N);

  const timestamps = trades.map((t) => t.timestamp);
  const totalVolume = buyVolume + sellVolume;

  return {
    accumulators,
    distributors,
    netUsd: buyVolume - sellVolume,
    buyVolumeUsd: buyVolume,
    sellVolumeUsd: sellVolume,
    uniqueWallets: byWallet.size,
    tradeCount: trades.length,
    windowMinutes: Math.max(1, Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 60_000)),
    sizeSplit: {
      retailPct: totalVolume > 0 ? (bands.retail / totalVolume) * 100 : 0,
      midPct: totalVolume > 0 ? (bands.mid / totalVolume) * 100 : 0,
      whalePct: totalVolume > 0 ? (bands.whale / totalVolume) * 100 : 0
    }
  };
}
