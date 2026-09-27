export default function AboutPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-8 max-w-[720px] w-full mx-auto flex flex-col gap-4 text-sm text-zinc-300">
      <h1 className="text-xl font-semibold text-zinc-100 mb-1">About NovaX</h1>

      <p>
        NovaX is a free crypto market dashboard. It shows real, live prices and charts for over a hundred
        coins, sourced straight from public exchange data — no account needed to watch the markets.
      </p>

      <p>
        On top of that, NovaX has a paper-trading game: sign up and you get a starting balance of
        simulated cash to buy and sell coins at real live prices. Nothing you do here touches real money —
        it&apos;s a safe way to practice trading and see how your calls would have played out. Everyone who
        plays is ranked on a global leaderboard by how much their simulated portfolio has gained.
      </p>

      <p>
        NovaX also includes a live fiat currency converter, a Fear &amp; Greed style crypto digest emailed
        to subscribers, and a growing set of tools for exploring the crypto market.
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-4">Where the data comes from</h2>
      <p>
        Live prices and charts come from Binance&apos;s public market API, with Coinbase as a backup
        source. Currency conversion rates come from the European Central Bank via Frankfurter. Trending
        coins and market dominance come from CoinGecko, and the Fear &amp; Greed Index comes from
        alternative.me. All of these are free, public data sources — NovaX doesn&apos;t sell or share your
        data with them.
      </p>

      <h2 className="text-base font-semibold text-zinc-100 mt-4">Who built this</h2>
      <p>NovaX is an independent, personal project — not affiliated with Binance, Coinbase, or any exchange.</p>
    </main>
  );
}
