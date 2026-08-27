// Market-cap comparison against the well-known meme coins.
//
// Every coin here, including ANSEM, is read from the same CoinGecko endpoint in
// a single call. That is deliberate rather than convenient: CoinGecko quotes
// market cap on *circulating* supply, and the dashboard's own headline figure
// uses total supply. On this token the two differ by a factor of 2.4 —
// 414.8M circulating against 997.4M total — so pairing a peer's circulating
// market cap with ANSEM's fully-diluted one would overstate every ratio on the
// page by that same factor. One source, one basis, no mixing.

import type { PeerCoin, PeerComparison } from '$lib/dashboard/types';

const BASE = 'https://api.coingecko.com/api/v3';
const TIMEOUT_MS = 10_000;

/** CoinGecko ids. ANSEM last so it is easy to pull out of the response. */
const PEER_IDS = ['dogecoin', 'shiba-inu', 'pepe', 'bonk'] as const;
const ANSEM_ID = 'the-black-bull';

interface MarketRow {
  id: string;
  symbol?: string;
  name?: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
  circulating_supply?: number;
  ath?: number;
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function getPeerComparison(): Promise<PeerComparison | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const ids = [...PEER_IDS, ANSEM_ID].join(',');
    const res = await fetch(
      `${BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`,
      { signal: controller.signal, headers: { accept: 'application/json' } }
    );
    if (!res.ok) return null;

    const rows = (await res.json()) as MarketRow[];
    if (!Array.isArray(rows)) return null;

    const byId = new Map(rows.map((r) => [r.id, r]));
    const self = byId.get(ANSEM_ID);

    const price = num(self?.current_price);
    const marketCap = num(self?.market_cap);
    const supply = num(self?.circulating_supply);
    if (!price || !marketCap || !supply) return null;

    const peers: PeerCoin[] = [];
    for (const id of PEER_IDS) {
      const row = byId.get(id);
      const cap = num(row?.market_cap);
      const athPrice = num(row?.ath);
      const peerSupply = num(row?.circulating_supply);
      if (!row || !cap) continue;

      // ATH market cap is not published, so it is reconstructed from the peer's
      // all-time-high price and the supply circulating today. Supply was
      // smaller back then for most of these, which makes this an upper bound
      // rather than a historical fact — the UI says so where it is shown.
      const athCap = athPrice && peerSupply ? athPrice * peerSupply : null;

      peers.push({
        id,
        symbol: (row.symbol ?? id).toUpperCase(),
        name: row.name ?? id,
        imageUrl: row.image ?? null,
        marketCapUsd: cap,
        athMarketCapUsd: athCap,
        priceUsd: num(row.current_price) ?? 0
      });
    }

    if (peers.length === 0) return null;

    return {
      // Sorted small to large so the ladder reads as increasingly ambitious.
      peers: peers.sort((a, b) => a.marketCapUsd - b.marketCapUsd),
      ansem: {
        priceUsd: price,
        marketCapUsd: marketCap,
        circulatingSupply: supply,
        athPriceUsd: num(self?.ath)
      }
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
