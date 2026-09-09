import { NextResponse } from "next/server";
import { ensureSchema, getUserById, getHoldings, getTrades, STARTING_CASH_BALANCE } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { fetchTicker } from "@/lib/binance";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    await ensureSchema();
    const user = await getUserById(userId);
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const [holdings, trades] = await Promise.all([getHoldings(userId), getTrades(userId)]);

    const priced = await Promise.all(
      holdings.map(async (h) => {
        try {
          const ticker = await fetchTicker(h.symbol);
          return { symbol: h.symbol, quantity: h.quantity, price: ticker.lastPrice, value: h.quantity * ticker.lastPrice };
        } catch {
          return { symbol: h.symbol, quantity: h.quantity, price: null, value: 0 };
        }
      })
    );

    const holdingsValue = priced.reduce((sum, h) => sum + h.value, 0);
    const totalValue = user.cash_balance + holdingsValue;

    return NextResponse.json({
      email: user.email,
      cashBalance: user.cash_balance,
      holdings: priced,
      holdingsValue,
      totalValue,
      startingBalance: STARTING_CASH_BALANCE,
      gainLoss: totalValue - STARTING_CASH_BALANCE,
      gainLossPct: ((totalValue - STARTING_CASH_BALANCE) / STARTING_CASH_BALANCE) * 100,
      trades,
    });
  } catch (err) {
    console.error("portfolio fetch failed:", err);
    return NextResponse.json({ error: "Failed to load portfolio." }, { status: 502 });
  }
}
