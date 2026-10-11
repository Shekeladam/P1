import { NextResponse } from "next/server";
import { ensureSchema, getLeaderboardUsers, STARTING_CASH_BALANCE } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { fetchAllTickers } from "@/lib/binance";

export const runtime = "nodejs";

const TOP_N = 20;

export async function GET() {
  try {
    await ensureSchema();
    const [users, tickers, viewerId] = await Promise.all([
      getLeaderboardUsers(),
      fetchAllTickers().catch(() => []),
      getSessionUserId(),
    ]);

    const priceMap = new Map(tickers.map((t) => [t.symbol, t.lastPrice]));

    const ranked = users
      .map((u) => {
        const holdingsValue = u.holdings.reduce((sum, h) => sum + h.quantity * (priceMap.get(h.symbol) ?? 0), 0);
        const totalValue = u.cashBalance + holdingsValue;
        const gainLoss = totalValue - STARTING_CASH_BALANCE;
        const gainLossPct = (gainLoss / STARTING_CASH_BALANCE) * 100;
        return {
          id: u.id,
          displayName: u.displayName ?? `Trader${u.id}`,
          totalValue,
          gainLoss,
          gainLossPct,
        };
      })
      .sort((a, b) => b.gainLossPct - a.gainLossPct)
      .map((row, i) => ({ ...row, rank: i + 1 }));

    const top = ranked.slice(0, TOP_N).map((row) => ({ ...row, isYou: row.id === viewerId }));
    const you = viewerId != null ? ranked.find((row) => row.id === viewerId) ?? null : null;
    const youInTop = you != null && top.some((row) => row.id === you.id);
    const stripId = (row: (typeof top)[number]) => ({
      rank: row.rank,
      displayName: row.displayName,
      totalValue: row.totalValue,
      gainLoss: row.gainLoss,
      gainLossPct: row.gainLossPct,
      isYou: row.isYou,
    });

    return NextResponse.json({
      leaders: top.map(stripId),
      you: you && !youInTop ? stripId({ ...you, isYou: true }) : null,
      totalPlayers: ranked.length,
    });
  } catch (err) {
    console.error("leaderboard fetch failed:", err);
    return NextResponse.json({ error: "Failed to load leaderboard." }, { status: 502 });
  }
}
