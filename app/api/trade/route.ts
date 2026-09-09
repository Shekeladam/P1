import { NextResponse } from "next/server";
import { ensureSchema, executeTrade } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { fetchTicker, SYMBOL_MAP } from "@/lib/binance";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const symbol = typeof body?.symbol === "string" ? body.symbol.toUpperCase() : "";
  const side = body?.side === "buy" || body?.side === "sell" ? body.side : null;
  const quantity = Number(body?.quantity);

  if (!SYMBOL_MAP[symbol]) {
    return NextResponse.json({ error: "Unknown asset." }, { status: 400 });
  }
  if (!side) {
    return NextResponse.json({ error: "side must be 'buy' or 'sell'." }, { status: 400 });
  }
  if (!(quantity > 0) || !Number.isFinite(quantity)) {
    return NextResponse.json({ error: "Enter a valid quantity." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const ticker = await fetchTicker(symbol);
    const result = await executeTrade(userId, symbol, side, quantity, ticker.lastPrice);
    return NextResponse.json({
      symbol,
      side,
      quantity,
      price: ticker.lastPrice,
      cashBalance: result.cashBalance,
      holdingQuantity: result.holdingQuantity,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Trade failed.";
    const isValidationError =
      message === "Not enough cash for this trade." ||
      message === "You don't own that much to sell." ||
      message === "Enter a valid quantity.";
    if (!isValidationError) console.error("trade failed:", err);
    return NextResponse.json({ error: message }, { status: isValidationError ? 400 : 502 });
  }
}
