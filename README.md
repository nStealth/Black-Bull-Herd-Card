<div align="center">

# 🐂 **Black Bull Herd Card** 🀄️

### *The Premier Community NFT Experience for $ANSEM Holders*

<strong>Charge Forward. Join the Herd. 🚀</strong>

<br>

<p align="center">
  <a href="https://svelte.dev">
    <img src="https://img.shields.io/badge/SvelteKit-2.0-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" alt="SvelteKit">
  </a>
  <a href="https://solana.com">
    <img src="https://img.shields.io/badge/Solana-Web3.js-9945FF?style=for-the-badge&logo=solana&logoColor=white" alt="Solana">
  </a>
  <a href="https://drizzle.team">
    <img src="https://img.shields.io/badge/Database-NeonDB-00E5FF?style=for-the-badge&logo=postgresql&logoColor=white" alt="NeonDB">
  </a>
  <a href="https://vercel.com">
    <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
  </a>
</p>

<p align="center">
  <a href="#-vision">
    <b>🎯 Vision</b>
  </a> •
  <a href="#-how-it-works">
    <b>⚡ Quick Start</b>
  </a> •
  <a href="#-security">
    <b>🛡️ Security</b>
  </a> •
  <a href="#-architecture">
    <b>🏗️ Architecture</b>
  </a>
</p>

<img src="static/cards/preview.jpg" alt="Black Bull Herd Cards Preview" width="800"/>

</div>

---

<br>

## 🎯 **Vision & Mission**

The **Black Bull Herd Card** project was created with a clear mission: **to ignite a vibrant, engaged community around the $ANSEM ecosystem while introducing new people to the project in a fun, secure, and interactive way.**

We believe that community is the heartbeat of every successful crypto project. Our goal is not just to distribute NFTs — **we are building a movement.** A movement where every holder feels valued, every participant has a voice, and every newcomer can discover the $ANSEM community through a beautifully crafted, professional experience.

### 🌍 **What This Project Represents**

| Core Value | Description |
|------------|-------------|
| **Community First** | Built by bulls, for bulls. Every feature is designed to bring people together. |
| **Accessibility** | No barriers to entry. No signatures, no transactions, no risk. |
| **Professionalism** | Enterprise-grade architecture with pixel-perfect UI/UX design. |
| **Transparency** | Fully open-source. Every line of code is auditable and community-owned. |
| **Growth** | Spreading awareness about $ANSEM to the wider crypto community through viral social engagement. |

<div align="center">

**$ANSEM Token:** `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`

</div>

---

<br>

## ✨ **Features**

<table>
<tr>
<td width="50%">

### 🔌 **Zero-Risk Wallet Verification**
Connect your Phantom wallet with **absolutely no signatures required.** We only perform read-only balance lookups on the blockchain — your wallet never signs anything, and your tokens never move.

### 🎨 **Dynamic NFT Card Generator**
5 uniquely designed tier cards rendered in real-time using the HTML5 Canvas API at **1024×1024 resolution.** Each card features your wallet address, balance, percentage of supply, and tier rank.

### 🏆 **5-Tier Progression System**
| Tier | Name | Min Balance | Rarity |
|------|------|-------------|--------|
| 🐂 Common | Recruit Bull | 1+ | Gray |
| 💎 Rare | Iron Bull | 100K+ | Blue |
| 💜 Epic | Gold Bull | 1M+ | Purple |
| 👑 Legendary | Legendary Bull | 10M+ | Gold |
| ⚡ Mythic | Black God Bull | 50M+ | Red |

</td>
<td width="50%">

### ⏱️ **Live Campaign Countdown**
Real-time countdown timer tracking the campaign window with smooth, animated transitions.

### 📤 **One-Click Social Sharing**
Auto-generated pre-filled tweets with your tier, balance stats, and campaign hashtags. Spread the word instantly!

### 📱 **Fully Responsive Design**
Optimized for mobile, tablet, and desktop with a dark cyber-aesthetic theme, particle animations, and micro-interactions.

### 🎉 **Celebration Effects**
Confetti explosions and animated modals on successful submission for that dopamine hit.

### ✅ **Anti-Cheat Protection**
One-wallet-one-entry enforcement at the database level prevents duplicate claims.

</td>
</tr>
</table>

---

<br>

## ⚡ **How It Works**

Getting your **Black Bull Herd Card** takes less than 60 seconds:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  1. Connect     │────▶│  2. Verify       │────▶│  3. Generate    │
│  Phantom Wallet │     │  $ANSEM Balance  │     │  Your Card NFT  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  4. Share on X  │────▶│  5. Submit Link  │────▶│  6. Get         │
│  (Pre-filled)   │     │  (Anti-cheat)    │     │  Airdropped! 🎉 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

> **🎁 Limited to the first 20,000 eligible holders! Don't miss your spot in the herd.**

---

<br>

## 🛡️ **Security & Trust**

This project was built with **security as the top priority.** We understand that in the crypto space, trust is everything.

### ✅ **What This Project NEVER Does**

| ❌ Never | ✅ Instead |
|----------|-----------|
| Asks for wallet signatures | **Read-only** balance verification only |
| Requests token approvals | No smart contract interactions at all |
| Asks for your seed phrase or private key | **Phantom handles everything locally** |
| Stores wallet credentials | Only saves wallet address and public tweet URL |
| Charges any fees | Completely **free** to participate |

### 🔐 **Read-Only Architecture**

Our application uses **@solana/web3.js** in *read-only* mode. When you connect your wallet, we call:

```typescript
// This is a READ-ONLY operation. No signature required.
const response = await connection.getParsedTokenAccountsByOwner(
  walletPubkey,
  { mint: ANSEM_MINT }
);
```

This fetches your token balance **directly from the Solana blockchain** without needing any transaction approval. Your wallet never signs a message, never approves a transaction, and your funds never leave your wallet.

### 🕵️ **Open Source = Trustless**

This entire project is **open-source.** Every line of code is right here in this repository. Don't trust — verify:

- Review the wallet connection logic in `src/lib/solana.ts`
- Inspect the API routes in `src/routes/api/`
- Audit the database schema in `src/lib/db/schema.ts`
- Check that no secrets are exposed in `.env.example`

> **"Code is law."** We believe transparency is the foundation of trust.

---

<br>

## 🏗️ **Architecture**

### Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                         │
│  SvelteKit 2.0  +  Svelte 4  +  TypeScript  +  Vite 5      │
│  TailwindCSS  +  Custom Design System  +  HTML5 Canvas      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                       API LAYER                             │
│  SvelteKit API Routes  +  Zod Validation  +  Drizzle ORM   │
│  RPC Queue (Rate Limited)  +  Upstash Redis (Caching)      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    INFRASTRUCTURE                           │
│  Solana Mainnet  +  NeonDB Postgres  +  Vercel Edge        │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

- **`src/lib/solana.ts`** — Read-only Solana blockchain interactions with rate-limited RPC requests
- **`src/lib/tiers.ts`** — Tier calculation engine and supply percentage math
- **`src/lib/cardGenerator.ts`** — HTML5 Canvas-based 1024×1024 NFT card renderer
- **`src/lib/db/`** — Drizzle ORM schema and NeonDB connection
- **`src/lib/rpcQueue.ts`** — Intelligent rate-limiting queue for Solana RPC calls
- **`src/routes/api/check/[wallet]/`** — Wallet balance verification endpoint
- **`src/routes/api/submit/`** — Anti-cheat tweet submission handler

---

<br>

## 🚀 **Getting Started**

### Prerequisites

- **Node.js 18+**
- **Phantom Wallet** browser extension (for testing wallet features)
- **NeonDB** account (free tier available at [neon.tech](https://neon.tech))
- **Solana RPC** (Helius recommended for reliability)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ansem-herd-card.git
cd ansem-herd-card

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

Create a `.env` file with the following:

```env
# Your live site URL (used in Twitter share, meta tags)
VITE_SITE_URL=https://your-domain.com

# Solana Mainnet RPC - Helius recommended
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Neon Postgres connection string
DATABASE_URL=postgresql://username:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Upstash Redis (optional, for caching)
REDIS_URL=https://your-redis-endpoint.upstash.io
REDIS_TOKEN=your_upstash_token

# Dashboard holder leaderboard (optional).
# Left unset if RPC_URL already points at Helius.
HELIUS_API_KEY=your_helius_api_key

# Optional: Twitter Bearer Token for future auto-verification
# X_BEARER_TOKEN=your_twitter_bearer_token
```

> **Note on `RPC_URL`:** without it the app falls back to Solana's public
> endpoint, which rate-limits aggressively (HTTP 429). Set it in production.

### Dashboard Data Sources

`/dashboard` reads live on-chain and market data. Each panel sources
independently, so a missing provider degrades one panel instead of the page.

| Panel | Source | Key required |
|---|---|---|
| Price, market cap, liquidity, volume, buy/sell counts (1h/6h/24h) | DexScreener, aggregated across every Solana pool | No |
| Total supply | `getTokenSupply` on the configured RPC | No |
| Holder leaderboard, supply distribution, tier breakdown | Helius DAS `getTokenAccounts` | **Yes** — `HELIUS_API_KEY` |
| 7-day / 30-day trade counts and unique buyers | Needs an indexed history provider | Not yet wired |

Holder enumeration is impossible on the free public RPC — `getTokenAccounts`
and `getTokenLargestAccounts` are rate-limited there. Until `HELIUS_API_KEY` is
set the leaderboard renders an explicit locked state rather than partial or
estimated numbers. A free Helius key is sufficient.

Responses are cached through Upstash Redis when configured (30s for market
data, 15min for the holder index) and fall back to a per-instance memory cache
otherwise. Failed upstream calls are never cached.

### Database Setup

```bash
npm run db:push
```

### Run Locally

```bash
npm run dev
# Open http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

---

<br>

## 📦 **Deployment**

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

**Framework Preset:** `SvelteKit`

**Required Environment Variables:**

| Variable | Description |
|----------|-------------|
| `RPC_URL` | Solana mainnet RPC endpoint (Helius recommended) |
| `DATABASE_URL` | Neon Postgres connection string |
| `VITE_SITE_URL` | Your deployed domain |

---

<br>

## 📁 **Project Structure**

```
ansem-herd-card/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte              # Root layout with meta tags
│   │   ├── +page.svelte                # Main application page
│   │   ├── rules/+page.svelte          # Campaign rules & FAQ
│   │   └── api/
│   │       ├── check/[wallet]/         # Balance verification API
│   │       │   └── +server.ts
│   │       ├── submit/                 # Tweet submission API
│   │       │   └── +server.ts
│   │       └── stats/                  # Campaign statistics API
│   ├── lib/
│   │   ├── components/                 # Reusable Svelte components
│   │   │   ├── ui/                     # Atoms: Button, Card, Message
│   │   │   ├── molecules/              # Molecules: WalletConnect, TierDisplay
│   │   │   └── organisms/              # Organisms: HeroSection, WhatSection
│   │   ├── db/                         # Drizzle ORM & schema
│   │   ├── tiers.ts                    # Tier config & calculation
│   │   ├── solana.ts                   # Read-only blockchain module
│   │   ├── cardGenerator.ts            # Canvas NFT renderer
│   │   ├── rpcQueue.ts                 # Rate-limited RPC queue
│   │   └── redis.ts                    # Upstash Redis client
│   ├── app.css                         # Global styles & Tailwind
│   └── app.html                        # HTML template
├── static/
│   ├── cards/                          # Tier card background assets
│   │   ├── common/, rare/, epic/
│   │   ├── legendary/, mythic/
│   │   └── preview.jpg
│   └── robots.txt
├── .env.example                        # Environment template
├── drizzle.config.ts                   # Drizzle ORM config
├── svelte.config.js                    # SvelteKit configuration
├── tailwind.config.js                  # TailwindCSS theme
├── package.json
└── README.md              🐂 🀄️ You are here!
```

---

<br>

## 🎨 **Design Philosophy**

We crafted the UI/UX with obsessive attention to detail:

- **Dark Cyber Theme** — Deep blacks with vibrant accent glows create an immersive, premium feel
- **Glassmorphism Cards** — Subtle transparency and backdrop-blur for depth
- **Particle System** — Canvas-based floating particles add life to the background
- **Micro-interactions** — Every button, card, and modal has subtle hover and click animations
- **Typography** — Clean, modern fonts (Inter + JetBrains Mono) ensure readability at all sizes
- **Responsive** — Mobile-first design that scales beautifully to any screen
- **Accessibility** — semantic HTML, keyboard navigation, and clear visual hierarchy

---

<br>

## 📊 **Campaign Statistics**

Track the campaign progress in real-time through the `/stats` API endpoint. This provides:

- Total number of eligible participants
- Distribution across tiers
- Submission rate over time
- Geographic spread of participants

---

<br>

## 🤝 **Community & Support**

<div align="center">

**This project is built by the community, for the community.**

We welcome:
- 🐛 Bug reports
- 💡 Feature suggestions
- 🎨 Design improvements
- 📝 Documentation updates
- 🌐 Translations

Join the conversation in the official **$ANSEM community channels**.

</div>

---

<br>

## ⚠️ **Disclaimer**

This is a **community-driven project** and is **NOT officially affiliated with the $ANSEM team.**

- 🐂 Built by bulls, for bulls
- 💎 NFTs are collectibles with no guaranteed monetary value
- ⛓️ All blockchain operations are irreversible by nature
- 💡 Always Do Your Own Research (DYOR)
- 🔒 Never share your private key or seed phrase with anyone

---

<br>

## 📜 **License**

This project is open-sourced under the **MIT License**. Feel free to fork, modify, and build upon it. Just remember: **bulls charge forward together.** 🐂🀄️

---

<div align="center">

### ⚡ **CHARGE FORWARD!** 🐂🀄️

<strong>Built with 💜 by the $ANSEM Community</strong>

<br>

<p align="center">
  <sub>Last Updated: July 2026</sub>
</p>

</div>
