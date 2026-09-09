import Link from "next/link";

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-4 sm:px-6 py-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-emerald-500 flex items-center justify-center font-bold text-black text-sm">
          N
        </div>
        <span className="font-semibold tracking-tight text-zinc-100">NovaX</span>
        <span className="hidden sm:inline text-xs text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5 ml-1">
          live · view-only
        </span>
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
        <Link className="text-zinc-100" href="/">
          Markets
        </Link>
        <Link className="hover:text-zinc-100" href="/#portfolio">
          Sample
        </Link>
        <Link className="hover:text-zinc-100" href="/trade">
          Trade
        </Link>
        <Link className="hover:text-zinc-100" href="/leaderboard">
          Leaderboard
        </Link>
        <Link className="hover:text-zinc-100" href="/subscribe">
          Digest
        </Link>
      </nav>
      <a
        href="https://www.binance.com"
        target="_blank"
        rel="noreferrer"
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        Data via Binance
      </a>
    </header>
  );
}
