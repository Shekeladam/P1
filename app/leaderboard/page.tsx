"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LeaderRow = {
  rank: number;
  displayName: string;
  totalValue: number;
  gainLoss: number;
  gainLossPct: number;
  isYou: boolean;
};

type LeaderboardData = {
  leaders: LeaderRow[];
  you: LeaderRow | null;
  totalPlayers: number;
};

function formatUsd(value: number): string {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RankBadge({ rank }: { rank: number }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <span className="inline-flex items-center justify-center w-7 text-sm font-semibold text-zinc-400">
      {medal ?? `#${rank}`}
    </span>
  );
}

function LeaderRowView({ row }: { row: LeaderRow }) {
  const isUp = row.gainLoss >= 0;
  return (
    <tr className={row.isYou ? "bg-amber-500/10" : ""}>
      <td className="py-2.5 pl-3">
        <RankBadge rank={row.rank} />
      </td>
      <td className="py-2.5 text-sm text-zinc-100 font-medium">
        {row.displayName}
        {row.isYou && <span className="ml-2 text-xs text-amber-500 font-semibold">You</span>}
      </td>
      <td className="py-2.5 text-right text-sm text-zinc-300">{formatUsd(row.totalValue)}</td>
      <td className={`py-2.5 pr-3 text-right text-sm font-semibold ${isUp ? "text-emerald-500" : "text-red-500"}`}>
        {isUp ? "+" : ""}
        {row.gainLossPct.toFixed(2)}%
      </td>
    </tr>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Couldn't load the leaderboard. Try again later.");
      }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="flex-1 px-4 sm:px-6 py-8 max-w-[720px] w-full mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 mb-1">Leaderboard</h1>
        <p className="text-sm text-zinc-500">
          Ranked by paper-trading gain since signup — starting balance {formatUsd(8750)}, simulated money only.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!data && !error && <p className="text-sm text-zinc-500">Loading…</p>}

      {data && (
        <>
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-zinc-500 border-b border-zinc-800">
                  <th className="text-left font-normal py-2 pl-3">Rank</th>
                  <th className="text-left font-normal py-2">Trader</th>
                  <th className="text-right font-normal py-2">Portfolio</th>
                  <th className="text-right font-normal py-2 pr-3">Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {data.leaders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-zinc-500">
                      No traders yet — be the first on the board.
                    </td>
                  </tr>
                ) : (
                  data.leaders.map((row) => <LeaderRowView key={row.rank} row={row} />)
                )}
              </tbody>
              {data.you && (
                <tfoot>
                  <tr className="border-t border-zinc-800">
                    <td colSpan={4} className="py-1"></td>
                  </tr>
                  <LeaderRowView row={data.you} />
                </tfoot>
              )}
            </table>
          </div>
          <p className="text-xs text-zinc-600">{data.totalPlayers} trader{data.totalPlayers === 1 ? "" : "s"} total.</p>
        </>
      )}

      <Link href="/trade" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← Back to Trade
      </Link>
    </main>
  );
}
