import { NextResponse } from "next/server";
import { fetchAllTickers } from "@/lib/binance";

export async function GET() {
  try {
    const tickers = await fetchAllTickers();
    return NextResponse.json({ tickers });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch tickers" },
      { status: 502 }
    );
  }
}
