import { NextResponse } from "next/server";
import { fetchCandles, fetchOrderBook, fetchTrades, SYMBOL_MAP } from "@/lib/binance";
import {
  candleParamsForCustomRange,
  candleParamsForPreset,
  PRESET_RANGES,
  type PresetRangeKey,
} from "@/lib/timeRanges";

const PRESET_KEYS = new Set(PRESET_RANGES.map((r) => r.key));

function isPresetKey(value: string): value is PresetRangeKey {
  return PRESET_KEYS.has(value as PresetRangeKey);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!SYMBOL_MAP[symbol]) {
    return NextResponse.json({ error: "Unknown symbol" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const rangeParam = searchParams.get("range");

  let candleParams: { interval: string; limit: number; startTime?: number; endTime?: number };
  if (start && end && Number.isFinite(Number(start)) && Number.isFinite(Number(end))) {
    candleParams = candleParamsForCustomRange(Number(start), Number(end));
  } else if (rangeParam && isPresetKey(rangeParam)) {
    candleParams = candleParamsForPreset(rangeParam);
  } else {
    candleParams = candleParamsForPreset("1d");
  }

  try {
    const [candles, orderBook, trades] = await Promise.all([
      fetchCandles(
        symbol,
        candleParams.interval,
        candleParams.limit,
        candleParams.startTime != null && candleParams.endTime != null
          ? { startTime: candleParams.startTime, endTime: candleParams.endTime }
          : undefined
      ),
      fetchOrderBook(symbol),
      fetchTrades(symbol),
    ]);
    return NextResponse.json({ candles, orderBook, trades });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch market data" },
      { status: 502 }
    );
  }
}
