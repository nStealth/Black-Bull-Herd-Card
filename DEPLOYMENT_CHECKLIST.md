# Deployment Checklist

> Quick checklist for me and my buddy before every deploy.

---

## 1. Update `.env`

- [ ] `VITE_SITE_URL` is set to the live domain (e.g. `https://blackbullherd.vercel.app`)
- [ ] `VITE_DONATION_ADDRESS` is set to our real Solana address
- [ ] `VITE_RPC_URL` uses a paid/reliable endpoint (Helius free plan is throttled — the backend queues requests at 10/sec, but paid is safer)
- [ ] `DATABASE_URL` points to the live Neon DB (if using DB)
- [ ] `REDIS_URL` and `REDIS_TOKEN` are set (get from console.upstash.com)
  - Shared queue = all Vercel instances respect the same 10 req/s limit
  - Shared cache = wallet check results cached for 30s across all instances

---

## 2. Check Footer Donation Address

- [ ] Footer shows the real address (copied from `VITE_DONATION_ADDRESS`)
- [ ] Clicking "Support the dev" copies the correct address

---

## 3. Check Share Links

- [ ] "Share on X" pre-filled text includes the correct `VITE_SITE_URL`
- [ ] Twitter share URL works and points to the site

---

## 4. Check Meta Tags

- [ ] `<meta property="og:url">` has the correct `VITE_SITE_URL`
- [ ] `<meta property="twitter:url">` has the correct `VITE_SITE_URL`

---

## 5. Sanity Check

- [ ] No hardcoded URLs or addresses anywhere in the code (grep for `http`, `YOUR_SOLANA_ADDRESS`)
- [ ] Build passes (`npm run build` or `pnpm build`)
- [ ] Smoke test the live site: connect wallet, check tier, share button

---

## Last Updated

- **Date:**
- **Deployed by:**
