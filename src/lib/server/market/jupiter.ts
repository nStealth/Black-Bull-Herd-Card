// Jupiter quote client — real executable prices, not an estimate.
//
// Price impact could be approximated from DexScreener's pool reserves, but the
// deepest pools here are Meteora DLMM and Orca concentrated-liquidity, where
// constant-product maths gives the wrong answer: reserves say nothing about how
// much is actually in range. Jupiter routes across every Solana venue and
// returns the quote a trader would really get, so the number on the dashboard
// is one someone could act on.
//
// Free, no key. Docs: https://dev.jup.ag/docs/swap-api

const ENDPOINT = 'https://lite-api.jup.ag/swap/v1/quote';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDC_DECIMALS = 6;
const TIMEOUT_MS = 8000;

/** Notional sizes probed in both directions, in USD. */
export const DEPTH_LADDER = [1_000, 10_000, 100_000, 1_000_000];

export interface DepthStep {
  usd: number;
  /** Price impact as a percentage. Null when Jupiter could not route the size. */
  impactPct: number | null;
}

export interface DepthLadder {
  buys: DepthStep[];
  sells: DepthStep[];
  /** Largest size that still routes at all, in USD. */
  maxRoutableUsd: number | null;
}

interface QuoteResponse {
  outAmount?: string;
  priceImpactPct?: string | number;
  error?: string;
}

async function quote(
  inputMint: string,
  outputMint: string,
  rawAmount: bigint
): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${ENDPOINT}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${rawAmount}&slippageBps=100`;
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!res.ok) return null;

    const body = (await res.json()) as QuoteResponse;
    if (body.error || !body.outAmount) return null;

    const impact = Number(body.priceImpactPct);
    return Number.isFinite(impact) ? impact * 100 : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface SingleQuote {
  usd: number;
  side: 'buy' | 'sell';
  impactPct: number | null;
  /** Tokens received on a buy, dollars received on a sell. */
  outAmount: number | null;
  /** Venues the router would split across, in order. */
  route: string[];
}

/**
 * Quote one arbitrary size, for the calculator.
 *
 * Separate from the ladder because the ladder is four fixed rungs cached as a
 * unit, while this answers whatever a visitor typed. The route is returned too:
 * knowing a trade would split across three venues explains a slippage number
 * far better than the number alone.
 */
export async function getSingleQuote(
  mint: string,
  decimals: number,
  priceUsd: number,
  usd: number,
  side: 'buy' | 'sell'
): Promise<SingleQuote | null> {
  if (!(priceUsd > 0) || !(usd > 0)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const [inputMint, outputMint, rawAmount, outDecimals] =
      side === 'buy'
        ? [USDC_MINT, mint, BigInt(Math.round(usd * 10 ** USDC_DECIMALS)), decimals]
        : [
            mint,
            USDC_MINT,
            BigInt(Math.round((usd / priceUsd) * 10 ** decimals)),
            USDC_DECIMALS
          ];

    const url = `${ENDPOINT}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${rawAmount}&slippageBps=100`;
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!res.ok) return null;

    const body = (await res.json()) as QuoteResponse & {
      routePlan?: { swapInfo?: { label?: string } }[];
    };
    if (body.error || !body.outAmount) return null;

    const impact = Number(body.priceImpactPct);
    const labels = (body.routePlan ?? [])
      .map((step) => step.swapInfo?.label)
      .filter((l): l is string => Boolean(l));

    return {
      usd,
      side,
      impactPct: Number.isFinite(impact) ? impact * 100 : null,
      outAmount: Number(body.outAmount) / 10 ** outDecimals,
      // The same venue can appear twice in a split route; show each once.
      route: [...new Set(labels)]
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probe both sides of the book at a ladder of notional sizes.
 *
 * Buys are quoted USDC -> token; sells convert the USD notional to a token
 * amount at spot first, so both columns describe the same dollar exposure.
 * Sizes are probed sequentially rather than in parallel: this is a free public
 * endpoint and a burst of eight is the kind of thing that gets an IP throttled.
 */
export async function getDepthLadder(
  mint: string,
  decimals: number,
  priceUsd: number
): Promise<DepthLadder | null> {
  if (!(priceUsd > 0)) return null;

  const buys: DepthStep[] = [];
  const sells: DepthStep[] = [];
  let maxRoutableUsd: number | null = null;

  for (const usd of DEPTH_LADDER) {
    const usdcAmount = BigInt(Math.round(usd * 10 ** USDC_DECIMALS));
    const buyImpact = await quote(USDC_MINT, mint, usdcAmount);
    buys.push({ usd, impactPct: buyImpact });

    const tokenAmount = BigInt(Math.round((usd / priceUsd) * 10 ** decimals));
    const sellImpact = await quote(mint, USDC_MINT, tokenAmount);
    sells.push({ usd, impactPct: sellImpact });

    if (buyImpact !== null || sellImpact !== null) maxRoutableUsd = usd;
  }

  // Every probe failed — report nothing rather than an all-blank ladder.
  if (maxRoutableUsd === null) return null;

  return { buys, sells, maxRoutableUsd };
}
