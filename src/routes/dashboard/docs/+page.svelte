<script lang="ts">
  // Full reference for the dashboard.
  //
  // Distinct from /about, which is a short overview of what each panel shows.
  // This is the manual: how to read every figure, what the vocabulary means,
  // and where each number stops being trustworthy. The sidebar tracks the
  // heading currently in view so a long page stays navigable.

  import { onMount } from 'svelte';
  import { ANSEM_MINT } from '$lib/tiers';

  interface Section {
    id: string;
    title: string;
  }

  const SECTIONS: Section[] = [
    { id: 'start', title: 'What this is' },
    { id: 'reading', title: 'Reading the dashboard' },
    { id: 'wallet', title: 'Looking up a wallet' },
    { id: 'glossary', title: 'Glossary' },
    { id: 'sources', title: 'Where numbers come from' },
    { id: 'limits', title: 'What it will not tell you' },
    { id: 'faq', title: 'FAQ' }
  ];

  /**
   * Which section is being read.
   *
   * Driven by the bound scroll position, which is the idiomatic way to make
   * this recompute. Note for anyone debugging it: scroll-driven behaviour
   * cannot be exercised in a headless pane — those do not dispatch scroll
   * events or run animation frames even while scrollY changes — so verify this
   * in a real browser rather than concluding it is broken.
   */
  let scrollY = 0;
  let headings: HTMLElement[] = [];

  onMount(() => {
    headings = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );
  });

  /**
   * The heading closest above the top quarter of the viewport is the one in
   * view.
   *
   * Both inputs are passed as arguments rather than closed over, so the
   * reactive statement's dependencies are unambiguous at a glance.
   */
  function sectionInView(_scrollY: number, els: HTMLElement[]): string {
    if (els.length === 0) return SECTIONS[0].id;
    let current = els[0].id;
    for (const el of els) {
      if (el.getBoundingClientRect().top <= window.innerHeight * 0.25) current = el.id;
    }
    return current;
  }

  $: activeId = sectionInView(scrollY, headings);

  const PANELS = [
    {
      name: 'Price History',
      read: 'Candles from the deepest pool, with a volume strip underneath. Hover anywhere to read the exact price and volume at that moment.',
      watch: 'The deepest pool is used because it is the hardest to move with one trade. Thin pools can print prices nobody could actually get.'
    },
    {
      name: 'Market cap comparison',
      read: 'Takes another meme coin\u2019s market cap, divides it by ANSEM\u2019s circulating supply, and shows the price ANSEM would trade at with the same cap \u2014 plus what a given holding would be worth there.',
      watch: 'A scenario, not a forecast. Nothing here says the move is likely; it only answers what the price would be if the cap matched. All five coins are read from one source on a circulating-supply basis, because pairing a peer\u2019s circulating cap with ANSEM\u2019s fully-diluted one would overstate every figure by a factor of 2.4.'
    },
    {
      name: 'Market Pulse',
      read: 'Pace is this hour’s volume divided by the average hour of the last day — 1.0x is a normal hour. Buy pressure shows how the split has drifted across 1H, 6H and 24H.',
      watch: 'Turnover above 1x means more than the entire pooled liquidity changed hands in a day. That is a lot of activity relative to how much depth is actually there.'
    },
    {
      name: 'Trading Rhythm',
      read: 'Average volume by hour of day over the past week. The tallest bars are the hours the book is deepest.',
      watch: 'Trading in a quiet hour means worse fills. The spread between busiest and quietest hour on this token runs to roughly fifteen times.'
    },
    {
      name: 'Wallet Flow',
      read: 'Every trade in the window folded by wallet: buys positive, sells negative. Names the biggest movers on each side with their holder rank.',
      watch: 'The window is about ninety minutes, not a day — it is printed in the header. A balanced overall split can still be one wallet absorbing everyone else.'
    },
    {
      name: 'Trade Depth',
      read: 'What a market order of each size would cost in slippage, quoted live by the Jupiter router across every Solana venue.',
      watch: 'Small sizes are noisy — routing for a $1,000 trade flips between pools and the quote can swing several fold minute to minute. The $100K and $1M rows are the stable, meaningful ones.'
    },
    {
      name: 'Risk Profile',
      read: 'Annualised volatility, worst drawdowns, best and worst single day, and the share of days that closed green.',
      watch: 'Measured over a trailing 30 days. Over the whole history these are dominated by the launch, where a single day moved several thousand percent.'
    },
    {
      name: 'Contract Safety',
      read: 'Read straight off the mint account. Mint authority revoked means no new supply can appear; freeze authority revoked means nobody can freeze your account.',
      watch: 'A list of facts, not a score. Anything unreadable says Unknown rather than defaulting to a pass.'
    },
    {
      name: 'Supply Distribution',
      read: 'How tightly supply is held. Gini runs 0 (everyone equal) to 1 (one wallet holds everything).',
      watch: 'The footer states what share of supply the index actually covers. When it says Partial, the concentration figures are a floor, not a total.'
    },
    {
      name: 'Live Tape',
      read: 'Individual swaps above $250 as they land, newest first. Every row links to Solscan.',
      watch: 'This is the raw feed the Wallet Flow panel is folded from.'
    }
  ];

  const GLOSSARY = [
    { term: 'Slippage', def: 'The gap between the quoted price and what you actually pay, caused by your own order moving the price. Grows with order size.' },
    { term: 'Liquidity', def: 'Money sitting in the pools available to trade against. Deep liquidity absorbs large orders with little price movement.' },
    { term: 'Turnover', def: 'Volume divided by liquidity or by market cap. It says how many times the available depth changed hands in a day.' },
    { term: 'Drawdown', def: 'The fall from a previous peak. Max drawdown is the worst such fall in the window; current drawdown is where price sits against the recent high.' },
    { term: 'Realised volatility', def: 'The standard deviation of daily returns, scaled to a year. A measure of how violently price has been moving, not a forecast.' },
    { term: 'Gini coefficient', def: 'A concentration measure from 0 to 1. Near 1 means a small number of wallets hold nearly everything.' },
    { term: 'Mint authority', def: 'The address permitted to create new tokens. Revoked means supply is fixed forever.' },
    { term: 'Freeze authority', def: 'The address permitted to freeze token accounts. Revoked means nobody can stop you moving your tokens.' },
    { term: 'Bonding curve', def: 'The launch mechanism on pump.fun. Graduating means the token left it and moved to open AMM pools.' },
    { term: 'AMM pool', def: 'A liquidity pool traded against by formula rather than an order book. Balances held there are liquidity, not somebody’s position.' }
  ];

  const FAQ = [
    { q: 'How often does the data refresh?', a: 'The page pulls a fresh snapshot every 30 seconds and the trade tape every 20. Individual figures are cached between 15 seconds and 30 minutes depending on how fast they actually change; the header always states how long ago it synced.' },
    { q: 'Why does the holder count end in a plus?', a: 'Enumerating every token account is bounded by a time budget. When the walk stops short, the count is a floor rather than a total, and the plus says so. The distribution panel prints the exact share of supply covered.' },
    { q: 'Do I need to connect a wallet?', a: 'No. Nothing on this dashboard asks for a wallet connection or a signature. Wallet lookup takes a pasted address and reads public chain data.' },
    { q: 'Why is there no chart indicator or price prediction?', a: 'Everything shown is measured. Nothing here forecasts, scores or rates the token, because a number that looks precise invites more trust than a guess deserves.' },
    { q: 'Can I use this data elsewhere?', a: 'Yes. The read-only endpoints are open and documented on the API page, with CORS enabled and no key required.' },
    { q: 'Is this affiliated with the $ANSEM team?', a: 'No. It is a community project, published as-is, and is not financial advice.' }
  ];
</script>

<svelte:window bind:scrollY />

<svelte:head>
  <title>Docs — ANSEM Analytics</title>
  <meta
    name="description"
    content="How to read every panel on the ANSEM dashboard: what each figure means, where it comes from, and where it stops being reliable."
  />
</svelte:head>

<div class="mx-auto flex max-w-[1180px] gap-10 px-6 py-10 max-lg:gap-0 max-md:px-4 max-md:py-7">
  <!-- Sidebar -->
  <aside class="w-52 shrink-0 max-lg:hidden">
    <nav class="sticky top-20" aria-label="Contents">
      <p class="d-label mb-3">Contents</p>
      <ul class="flex flex-col gap-0.5">
        {#each SECTIONS as section (section.id)}
          <li>
            <a
              href="#{section.id}"
              class="block rounded-md px-2.5 py-1.5 text-[0.8125rem] transition-colors hover:bg-[var(--d-hover)]"
              style="color: {activeId === section.id ? 'var(--d-accent)' : 'var(--d-text-2)'};
                     background: {activeId === section.id ? 'var(--d-accent-soft)' : 'transparent'};"
            >
              {section.title}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </aside>

  <main class="min-w-0 flex-1">
    <header class="mb-10">
      <p class="d-label">Documentation</p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight max-md:text-xl" style="color: var(--d-text);">
        How to read this dashboard
      </h1>
      <p class="mt-3 text-sm leading-relaxed" style="color: var(--d-text-2);">
        Every figure here is measured, never estimated. This page explains what each one means,
        how it is calculated, and — just as importantly — the point at which it stops being
        reliable.
      </p>
    </header>

    <!-- What this is -->
    <section class="mb-12">
      <h2 id="start" class="scroll-mt-20 text-lg font-semibold" style="color: var(--d-text);">
        What this is
      </h2>
      <p class="mt-3 text-[0.9375rem] leading-relaxed" style="color: var(--d-text-2);">
        A single screen for everything worth knowing about $ANSEM: what it costs, who is trading
        it, how the supply is spread, how much a trade of size would actually cost, and whether
        the contract can still be changed underneath you.
      </p>
      <p class="mt-3 text-[0.9375rem] leading-relaxed" style="color: var(--d-text-2);">
        It is read-only. There is no wallet connection anywhere on it, no signature to approve
        and nothing to install. Everything refreshes on its own.
      </p>
      <div
        class="mt-4 rounded-xl border px-4 py-3"
        style="border-color: var(--d-border); background: var(--d-surface-2);"
      >
        <p class="d-label">Contract</p>
        <p class="d-numeric mt-1 break-all text-[0.8125rem]" style="color: var(--d-text);">
          {ANSEM_MINT}
        </p>
      </div>
    </section>

    <!-- Reading the dashboard -->
    <section class="mb-12">
      <h2 id="reading" class="scroll-mt-20 text-lg font-semibold" style="color: var(--d-text);">
        Reading the dashboard
      </h2>
      <p class="mt-3 text-[0.9375rem] leading-relaxed" style="color: var(--d-text-2);">
        Each panel answers one question. The note under each explains where the figure is strong
        and where it is not.
      </p>

      <div class="mt-5 flex flex-col gap-3">
        {#each PANELS as panel (panel.name)}
          <article class="d-card overflow-hidden">
            <header class="border-b px-5 py-2.5" style="border-color: var(--d-border);">
              <h3 class="text-[0.8125rem] font-semibold" style="color: var(--d-text);">
                {panel.name}
              </h3>
            </header>
            <div class="px-5 py-3.5">
              <p class="text-[0.8125rem] leading-relaxed" style="color: var(--d-text-2);">
                {panel.read}
              </p>
              <p
                class="mt-2 border-l-2 pl-3 text-[0.75rem] leading-relaxed"
                style="border-color: var(--d-accent-ink); color: var(--d-text-3);"
              >
                {panel.watch}
              </p>
            </div>
          </article>
        {/each}
      </div>
    </section>

    <!-- Wallet lookup -->
    <section class="mb-12">
      <h2 id="wallet" class="scroll-mt-20 text-lg font-semibold" style="color: var(--d-text);">
        Looking up a wallet
      </h2>
      <p class="mt-3 text-[0.9375rem] leading-relaxed" style="color: var(--d-text-2);">
        Paste any Solana address into <strong style="color: var(--d-text);">Find Your Rank</strong>
        to see its position among every holder, its balance and live value, its tier, and how far
        it is from the next one. No connection, no signature, nothing to approve.
      </p>
      <p class="mt-3 text-[0.9375rem] leading-relaxed" style="color: var(--d-text-2);">
        Ranks are exact within the ranked slice. A wallet below it shows
        <strong style="color: var(--d-text);">Unranked</strong> with its real balance and tier —
        everyone at that level holds dust, and ordering dust by dust would be precision about
        nothing.
      </p>
    </section>

    <!-- Glossary -->
    <section class="mb-12">
      <h2 id="glossary" class="scroll-mt-20 text-lg font-semibold" style="color: var(--d-text);">
        Glossary
      </h2>
      <dl class="mt-4 d-card overflow-hidden">
        {#each GLOSSARY as item, i (item.term)}
          <div class="px-5 py-3.5" style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};">
            <dt class="text-[0.8125rem] font-semibold" style="color: var(--d-text);">{item.term}</dt>
            <dd class="mt-1 text-[0.8125rem] leading-relaxed" style="color: var(--d-text-2);">
              {item.def}
            </dd>
          </div>
        {/each}
      </dl>
    </section>

    <!-- Sources -->
    <section class="mb-12">
      <h2 id="sources" class="scroll-mt-20 text-lg font-semibold" style="color: var(--d-text);">
        Where numbers come from
      </h2>
      <div class="mt-4 d-card overflow-hidden">
        {#each [{ k: 'Price, liquidity, 24h trade counts', v: 'DexScreener, across every Solana pool' }, { k: 'Candles and the trade tape', v: 'GeckoTerminal, on the deepest pool' }, { k: 'Slippage at size', v: 'Jupiter router quotes' }, { k: 'Rank, all-time high/low, 7d & 30d', v: 'CoinGecko, across every venue' }, { k: 'Supply, mint & freeze authority', v: 'Solana mainnet, read from the mint' }, { k: 'Holder rankings', v: 'Helius DAS token-account index' }] as row, i (row.k)}
          <div
            class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3"
            style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};"
          >
            <span class="text-[0.8125rem]" style="color: var(--d-text);">{row.k}</span>
            <span class="text-[0.6875rem]" style="color: var(--d-text-3);">{row.v}</span>
          </div>
        {/each}
      </div>
      <p class="mt-3 text-[0.8125rem] leading-relaxed" style="color: var(--d-text-2);">
        When a provider rate-limits, the last good payload is served rather than a blank panel,
        and the header states how old it is. Nothing is interpolated to fill a gap.
      </p>
    </section>

    <!-- Limits -->
    <section class="mb-12">
      <h2 id="limits" class="scroll-mt-20 text-lg font-semibold" style="color: var(--d-text);">
        What it will not tell you
      </h2>
      <div class="mt-4 flex flex-col gap-2.5">
        {#each [{ t: 'Nothing is forecast', d: 'No price targets, no ratings, no proprietary score. Every figure is something that already happened or is happening now.' }, { t: 'Trade counts stop at 24 hours', d: 'The 7d and 30d rows carry real price change and volume, with counts left blank. No free provider breaks buys and sells out beyond a day, and a zero would read as "nobody traded".' }, { t: 'Holder coverage is partial', d: 'The token-account walk is time-bounded. The distribution panel prints exactly what share of supply it reached, and calls itself partial when it stops short.' }, { t: 'There is no X feed', d: 'X rate-limits its embed and only renders timelines for viewers already signed in, so the footer links to the accounts instead of showing a box that errors for most visitors.' }] as item (item.t)}
          <div class="d-card px-5 py-3.5">
            <p class="text-[0.8125rem] font-semibold" style="color: var(--d-text);">{item.t}</p>
            <p class="mt-1 text-[0.8125rem] leading-relaxed" style="color: var(--d-text-2);">
              {item.d}
            </p>
          </div>
        {/each}
      </div>
    </section>

    <!-- FAQ -->
    <section class="mb-10">
      <h2 id="faq" class="scroll-mt-20 text-lg font-semibold" style="color: var(--d-text);">FAQ</h2>
      <div class="mt-4 d-card overflow-hidden">
        {#each FAQ as item, i (item.q)}
          <details class="group" style="border-top: {i === 0 ? 'none' : '1px solid var(--d-border)'};">
            <summary
              class="flex cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-[0.8125rem] font-medium transition-colors hover:bg-[var(--d-hover)]"
              style="color: var(--d-text);"
            >
              {item.q}
              <span
                class="shrink-0 transition-transform group-open:rotate-45"
                style="color: var(--d-text-3);"
                aria-hidden="true">+</span
              >
            </summary>
            <p class="px-5 pb-4 text-[0.8125rem] leading-relaxed" style="color: var(--d-text-2);">
              {item.a}
            </p>
          </details>
        {/each}
      </div>
    </section>

    <div class="flex flex-wrap gap-2.5">
      <a
        href="/dashboard"
        class="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--d-hover)]"
        style="border-color: var(--d-border); color: var(--d-text);"
      >
        ← Back to the dashboard
      </a>
      <a
        href="/dashboard/api"
        class="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--d-hover)]"
        style="border-color: var(--d-border); color: var(--d-text);"
      >
        API reference →
      </a>
    </div>
  </main>
</div>
