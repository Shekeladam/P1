# NovaX — Live Crypto Market Dashboard

A crypto market dashboard built with Next.js, Tailwind CSS, and
[lightweight-charts](https://tradingview.github.io/lightweight-charts/), showing
**real, live market data** pulled from Binance's public REST API (with a
Coinbase fallback if Binance is unreachable).

**No real money moves anywhere in this project.** The main dashboard is
view-only — the "Sample Portfolio" table there is illustrative, fixed example
holdings priced against live tickers, not anything you can trade. The
separate `/trade` page is a paper-trading game: you sign up for a free
account, start with $8,750 in simulated cash, and can buy/sell at live
prices to see if your (fake) portfolio goes up or down. Still no real
exchange, wallet, or funds involved anywhere.

## Features

- Market list with real live prices and 24h change for 16 assets
- Candlestick + volume chart per asset (1h candles, live from Binance)
- Real order book (bids/asks) and recent trades feed
- Sample portfolio table (fixed example quantities, valued at live prices)
- **Paper trading** (`/trade`): sign up/sign in, start with $8,750 simulated
  cash, buy/sell at live prices, track gain/loss — progress saved per
  account (see **Accounts setup** below)
- Optional: a "Crypto Digest" email newsletter — anyone can subscribe with
  their email, and once every 3 days gets a digest with market dominance,
  a chart, and top headlines (see **Newsletter setup** below)

## How it works

Two Next.js API routes (`app/api/tickers`, `app/api/market/[symbol]`) fetch
from Binance's public market-data endpoints server-side — no API key required,
since these are public endpoints. The browser polls those routes every 8-10
seconds and updates the UI. See `lib/binance.ts` for the fetch logic.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Requires outbound network
access to `api.binance.com`.

## Project structure

- `app/` — Next.js App Router pages, layout, global styles, and API routes
- `app/api/tickers` — live 24h ticker snapshot for all listed assets
- `app/api/market/[symbol]` — live candles, order book, and trades for one asset
- `app/subscribe` — newsletter signup page
- `app/api/subscribe` — adds an email to the subscriber list
- `app/api/unsubscribe` — removes an email via its unique link
- `app/api/newsletter/send` — composes and sends the digest to all subscribers
  (cron-protected, see below)
- `components/` — dashboard UI (chart, order book, trades, portfolio, etc.)
- `lib/binance.ts` — Binance public API client
- `lib/coins.ts` — asset list and sample portfolio holdings
- `lib/format.ts` — price formatting helper
- `lib/db.ts` — Postgres subscriber storage (works with any standard
  Postgres connection string — Neon, Supabase, etc.)
- `lib/newsletter.ts` — digest content: market dominance (CoinGecko), news
  (CoinDesk & CoinTelegraph public RSS feeds), and a chart image
  (QuickChart) — all free, no API key
- `lib/mailer.ts` — sends via your own Gmail account (App Password)
- `app/trade` — paper-trading page (sign up/in, buy/sell, holdings)
- `app/reset-password` — set a new password from an emailed reset link
- `app/api/auth/*` — sign up, sign in, sign out, forgot/reset password
- `app/api/portfolio` — current user's cash, holdings, and gain/loss
- `app/api/trade` — executes a buy or sell at the live price
- `lib/auth.ts` — password hashing and session cookies (Node's built-in
  `crypto` only, no extra auth dependency)

## Accounts setup (for `/trade`)

Uses the same `DATABASE_URL` and Gmail sending config as the newsletter
(see below) — no separate database or email account needed. Just add one
more value:

- **`SESSION_SECRET`** — a second long random string you make up yourself
  (different from `CRON_SECRET`), signs the sign-in session cookie.

Forgot-password links are sent from the same Gmail account configured for
the newsletter (`GMAIL_USER` / `GMAIL_APP_PASSWORD`) and expire after 1
hour. Passwords are hashed with `scrypt` (Node's built-in, no extra
dependency) — never stored in plain text or recoverable, even by you.

## Newsletter setup

The dashboard itself needs no setup. The email digest is optional and needs
2 free accounts (no credit card for either):

1. **A database, for the subscriber list.** Create a free project at
   [neon.tech](https://neon.tech) (or Supabase). Copy its connection string
   into `DATABASE_URL`.
2. **Gmail sending.** Turn on 2-Step Verification on your Google account,
   then generate an App Password at
   [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
   Use that (not your normal password) as `GMAIL_APP_PASSWORD`, and your
   Gmail address as `GMAIL_USER`.
3. **A secret you make up yourself** for `CRON_SECRET` — protects the send
   endpoint from being triggered by anyone else.

Copy `.env.example` to `.env.local` and fill those in for local testing.
When deployed on Vercel, set the same variables in Project Settings →
Environment Variables — `vercel.json` already configures a daily cron job
that hits `/api/newsletter/send`; the route itself only actually sends once
3+ days have passed since the last send, so the daily trigger is just a
reliable heartbeat.

To send a test digest manually once env vars are set:

```bash
curl -X POST https://your-deployed-site.example/api/newsletter/send \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint the project
