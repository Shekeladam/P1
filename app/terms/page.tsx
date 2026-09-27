export default function TermsPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-8 max-w-[720px] w-full mx-auto flex flex-col gap-4 text-sm text-zinc-300">
      <h1 className="text-xl font-semibold text-zinc-100 mb-1">Terms of Use</h1>
      <p className="text-xs text-zinc-500">Last updated: 2026</p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">No real money, no financial advice</h2>
      <p>
        NovaX is a free, view-only market dashboard and a simulated paper-trading game. All balances,
        holdings, and trades on NovaX use play money — nothing here is real money, a real brokerage
        account, or a real financial product. Nothing on NovaX is financial advice; prices and data are
        shown for informational and entertainment purposes only.
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">Accounts</h2>
      <p>
        You&apos;re responsible for keeping your account credentials secure. You may not use NovaX to
        impersonate someone else, and we may suspend or remove accounts that abuse the service (for
        example, automated scraping or attempts to disrupt the site for other users).
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">Data accuracy</h2>
      <p>
        Prices and market data are sourced from third-party public APIs (Binance, Coinbase, CoinGecko,
        alternative.me, Frankfurter) and may be delayed, incomplete, or occasionally wrong. NovaX makes no
        guarantee about the accuracy of any data shown.
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">Leaderboard</h2>
      <p>
        Your simulated portfolio performance and chosen display name may be shown publicly on the
        leaderboard to other users of the site.
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-2">Changes</h2>
      <p>NovaX is a personal, evolving project and these terms may change as the site changes.</p>
    </main>
  );
}
