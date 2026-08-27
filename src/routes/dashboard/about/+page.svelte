<script lang="ts">
  // Plain-language explainer for the dashboard.
  //
  // The "not shown" section is deliberate: every panel that is missing or
  // locked is missing for a reason, and stating the reason is what stops a gap
  // from reading as a bug.

  interface Panel {
    name: string;
    what: string;
    why: string;
  }

  const PANELS: Panel[] = [
    {
      name: 'Key metrics',
      what: 'Price, market cap, rank, liquidity, 24h volume, holders, total supply, top-10 share, distance from the all-time high, and market age.',
      why: 'The ten numbers worth checking before anything else.'
    },
    {
      name: 'Price History',
      what: 'Candles over 1H, 24H, 7D, 30D or the token’s whole life, with a volume strip and a hover readout.',
      why: 'Reads the deepest pool — the one hardest to move with a single trade.'
    },
    {
      name: 'Trading Activity',
      what: 'Buys against sells for 1H, 6H, 24H, 7D and 30D, with volume and price change per window.',
      why: 'Buy pressure over time says more than a single green candle.'
    },
    {
      name: 'Live Tape',
      what: 'Recent swaps above $250 with buy/sell volume, net flow and a whale marker, refreshing every 20 seconds.',
      why: 'Aggregates hide who is actually moving. Every row links to Solscan so you can verify a print.'
    },
    {
      name: 'Market cap comparison',
      what: 'What ANSEM would be worth per token at the market cap of Dogecoin, Shiba Inu, Pepe or BONK, and what a given holding would be worth there.',
      why: 'A hypothetical stated as one. The arithmetic is printed in full \u2014 peer cap divided by circulating supply \u2014 so it can be checked rather than trusted, and every input is live.'
    },
    {
      name: 'Wallet Flow',
      what: 'Every trade in the tape window folded by wallet — buys positive, sells negative — so the biggest accumulators and distributors are named, with their holder rank where they appear in the index.',
      why: 'Aggregate volume hides this entirely. A balanced buy-sell split can be one wallet quietly taking the other side of two hundred small sells. The window is whatever the tape covers, stated in the header rather than rounded up to a day.'
    },
    {
      name: 'Market Pulse',
      what: 'This hour\u2019s volume against the token\u2019s own 24-hour average, how buy pressure has drifted across 1H/6H/24H, and daily turnover of both liquidity and market cap.',
      why: 'Absolute volume is unreadable without a baseline. Every figure is a ratio against the token itself, so it stays meaningful whatever the market cap does.'
    },
    {
      name: 'Trading Rhythm',
      what: 'Average volume by hour of day, folded from a week of hourly candles, in UTC and your own timezone.',
      why: 'Slippage is not constant through the day. The busiest hours are the ones where a large order is least likely to move the price \u2014 useful if you are choosing when to trade.'
    },
    {
      name: 'If You Had Bought',
      what: 'Pick a date and an amount to see what that position would be worth today, in tokens, dollars and multiple.',
      why: 'Priced off real daily closes, never a projection. The launch entry is the bonding curve\u2019s opening day \u2014 a price almost nobody actually got \u2014 and is labelled as such rather than presented as a realistic entry.'
    },
    {
      name: 'vs Solana',
      what: 'The token\u2019s 7-day and 30-day move next to SOL\u2019s over the same windows, and the gap between them.',
      why: 'Up 60% while the chain is up 28% is a very different result from up 60% while the chain is up 55%. The comparison separates the token\u2019s own move from the market that carried it.'
    },
    {
      name: 'Find Your Rank',
      what: 'Paste any Solana address to see its position among every holder, its balance and live value, its tier, and how far it is from the next one.',
      why: 'Address only — no wallet connection, no signature, nothing to approve. Ranking runs on the server because it needs the whole holder list; sending ~90,000 rows to a browser to answer one question would cost megabytes a visitor.'
    },
    {
      name: 'Trade Depth',
      what: 'What a $1K, $10K, $100K or $1M market order would actually cost in slippage, in both directions.',
      why: 'Real router quotes across every Solana venue — not maths on published reserves, which is wrong for concentrated-liquidity pools. It answers the question a chart cannot: can you get in and out at size?'
    },
    {
      name: 'Risk Profile',
      what: 'Annualised volatility, worst drawdowns, best and worst single day, and the share of days that closed green.',
      why: 'Measured over a trailing 30 days. Over the full history these are dominated by the launch — the bonding curve produced a +4,856% day — which is arithmetically correct and useless.'
    },
    {
      name: 'Contract Safety',
      what: 'Mint authority, freeze authority, pooled liquidity, launchpad graduation and the largest non-pool wallet.',
      why: 'Read straight off the mint account on-chain. A list of facts, not a score — a single number invites trusting the number instead of the check.'
    },
    {
      name: 'Market Context',
      what: 'Market-cap rank, all-time high and low, and where the live price sits inside its 24h range.',
      why: 'Aggregated across every venue, not just the Solana pools.'
    },
    {
      name: 'Liquidity by Pool',
      what: 'Every tracked pool with its depth and share of total liquidity.',
      why: 'Liquidity concentrated in one pool behaves very differently from liquidity spread across several.'
    },
    {
      name: 'Supply Distribution',
      what: 'Top 10 / 50 / 100 concentration, a Gini coefficient and a per-tier breakdown.',
      why: 'Concentration is the difference between a wide holder base and a handful of wallets.'
    },
    {
      name: 'Herd Leaderboard',
      what: 'Every indexed wallet ranked by balance, up to 10,000.',
      why: 'Pool and program accounts are labelled separately — they are liquidity, not whales.'
    }
  ];

  const SOURCES = [
    { data: 'Price, liquidity, volume, 24h trade counts', from: 'DexScreener, across all Solana pools' },
    { data: 'Candles and the live trade tape', from: 'GeckoTerminal, on the deepest pool' },
    { data: 'Rank, all-time high/low, 7d & 30d change', from: 'CoinGecko, across every venue' },
    { data: 'Total supply, mint & freeze authority', from: 'Solana mainnet, read from the mint' },
    { data: 'Slippage at size, both directions', from: 'Jupiter router quotes' },
    { data: 'SOL benchmark for relative strength', from: 'CoinGecko daily closes' },
    { data: 'Holder rankings and distribution', from: 'Helius DAS token-account index' }
  ];

  const LIMITS = [
    {
      title: 'Buy/sell counts stop at 24 hours',
      body: 'The 7-day and 30-day rows carry real price change and volume from OHLCV history, but their trade counts are left blank. No free provider breaks buys and sells out beyond 24h, and a zero there would read as “nobody traded” rather than “not measured”.'
    },
    {
      title: 'There is no embedded X feed',
      body: 'X rate-limits its embed endpoint and, since 2026, only renders embedded timelines for viewers already signed in. Rather than ship a box that shows an error to most visitors, the footer links straight to the accounts.'
    },
    {
      title: 'Stale beats blank',
      body: 'The free tiers behind the chart and market context rate-limit. When a refresh fails, the last good payload is shown instead of an empty panel — and the header always states how long ago the data synced.'
    }
  ];
</script>

<svelte:head>
  <title>About — Black Bull ANSEM Analytics</title>
  <meta
    name="description"
    content="What the ANSEM dashboard tracks, where every number comes from, and what it deliberately does not show."
  />
</svelte:head>

<div class="mx-auto max-w-[820px] px-6 py-10 max-md:px-4 max-md:py-7">
  <header class="mb-8">
    <p class="d-label">About</p>
    <h1 class="mt-2 text-2xl font-semibold tracking-tight max-md:text-xl" style="color: var(--d-text);">
      An overwatch for $ANSEM
    </h1>
    <p class="mt-3 text-sm leading-relaxed" style="color: var(--d-text-2);">
      One screen for everything worth knowing about the token: what it costs, who is trading it,
      how the supply is spread, and whether the contract can still be changed underneath you.
      Everything refreshes on its own and every number is traceable to a named source.
    </p>
  </header>

  <section class="mb-9">
    <h2 class="mb-3 text-sm font-semibold" style="color: var(--d-text);">What's on the dashboard</h2>
    <div class="d-card overflow-hidden">
      {#each PANELS as panel, i (panel.name)}
        <div class="px-5 py-4" style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};">
          <p class="text-sm font-semibold" style="color: var(--d-text);">{panel.name}</p>
          <p class="mt-1 text-[0.8125rem] leading-relaxed" style="color: var(--d-text-2);">
            {panel.what}
          </p>
          <p class="mt-1 text-[0.6875rem] leading-relaxed" style="color: var(--d-text-3);">
            {panel.why}
          </p>
        </div>
      {/each}
    </div>
  </section>

  <section class="mb-9">
    <h2 class="mb-3 text-sm font-semibold" style="color: var(--d-text);">
      Where the numbers come from
    </h2>
    <div class="d-card overflow-hidden">
      {#each SOURCES as source, i (source.data)}
        <div
          class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3"
          style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};"
        >
          <span class="text-[0.8125rem]" style="color: var(--d-text);">{source.data}</span>
          <span class="text-[0.6875rem]" style="color: var(--d-text-3);">{source.from}</span>
        </div>
      {/each}
    </div>
    <p class="mt-2.5 text-[0.6875rem] leading-relaxed" style="color: var(--d-text-3);">
      Nothing here is estimated or interpolated. If a provider is unreachable, the panel says so
      rather than filling the gap with a guess. Responses are cached so the same figure is not
      re-fetched for every visitor, and a rate-limited provider serves its last good payload
      rather than a blank panel.
    </p>
  </section>

  <section class="mb-9">
    <h2 class="mb-3 text-sm font-semibold" style="color: var(--d-text);">
      What it deliberately doesn't show
    </h2>
    <div class="flex flex-col gap-2.5">
      {#each LIMITS as limit (limit.title)}
        <div class="d-card px-5 py-4">
          <p class="text-[0.8125rem] font-semibold" style="color: var(--d-text);">{limit.title}</p>
          <p class="mt-1 text-[0.8125rem] leading-relaxed" style="color: var(--d-text-2);">
            {limit.body}
          </p>
        </div>
      {/each}
    </div>
  </section>

  <section class="mb-8">
    <div
      class="rounded-xl border px-5 py-4"
      style="border-color: var(--d-border); background: var(--d-surface-2);"
    >
      <p class="text-[0.8125rem] font-semibold" style="color: var(--d-text);">Not financial advice</p>
      <p class="mt-1 text-[0.8125rem] leading-relaxed" style="color: var(--d-text-2);">
        This is a community project and is not affiliated with the $ANSEM team. The data is
        published as-is so you can check it yourself — it is not a recommendation to buy or sell
        anything.
      </p>
    </div>
  </section>

  <a
    href="/dashboard"
    class="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--d-hover)]"
    style="border-color: var(--d-border); color: var(--d-text);"
  >
    ← Back to the dashboard
  </a>
</div>
