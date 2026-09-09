"use client";

import { useEffect, useState } from "react";
import { COINS } from "@/lib/coins";
import type { Candle, OrderBookRow, Ticker, Trade } from "@/lib/binance";
import { CoinList } from "@/components/CoinList";
import { PriceChart } from "@/components/PriceChart";
import { OrderBook } from "@/components/OrderBook";
import { RecentTrades } from "@/components/RecentTrades";
import { PortfolioTable } from "@/components/PortfolioTable";
import { TimeRangeSelector } from "@/components/TimeRangeSelector";
import { DEFAULT_RANGE, labelForRange, rangeKeyOf, type RangeSelection } from "@/lib/timeRanges";

const TICKER_POLL_MS = 10_000;
const MARKET_POLL_MS = 8_000;

type MarketSnapshot = {
  candles: Candle[];
  orderBook: { bids: OrderBookRow[]; asks: OrderBookRow[] };
  trades: Trade[];
};

type SymbolSnapshot = {
  symbol: string;
  data: MarketSnapshot;
};

export function Dashboard() {
  const [selected, setSelected] = useState(COINS[0].symbol);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [snapshot, setSnapshot] = useState<SymbolSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeSelection>(DEFAULT_RANGE);
  const rangeKey = rangeKeyOf(range);

  useEffect(() => {
    let cancelled = false;

    async function loadTickers() {
      try {
        const res = await fetch("/api/tickers");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          setTickers(data.tickers);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Live data from Binance is temporarily unavailable.");
      }
    }

    loadTickers();
    const id = setInterval(loadTickers, TICKER_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMarket() {
      try {
        const query =
          range.kind === "custom"
            ? `?start=${range.startMs}&end=${range.endMs}`
            : `?range=${range.key}`;
        const res = await fetch(`/api/market/${selected}${query}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          setSnapshot({ symbol: selected, data });
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Live data from Binance is temporarily unavailable.");
      }
    }

    loadMarket();
    const id = setInterval(loadMarket, MARKET_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selected, range]);

  const coin = COINS.find((c) => c.symbol === selected) ?? COINS[0];
  const ticker = tickers.find((t) => t.symbol === selected);
  const market = snapshot?.symbol === selected ? snapshot.data : null;

  return (
    <main className="flex-1 px-4 sm:px-6 py-6 max-w-[1400px] w-full mx-auto flex flex-col gap-4">
      {error && (
        <div className="text-xs text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <CoinList selected={selected} onSelect={setSelected} tickers={tickers} />
          <PortfolioTable tickers={tickers} />
        </div>

        <div className="flex flex-col gap-4">
          <TimeRangeSelector value={range} onChange={setRange} />
          <PriceChart
            coin={coin}
            candles={market?.candles ?? []}
            ticker={ticker}
            rangeKey={rangeKey}
            rangeLabel={labelForRange(range)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <OrderBook coin={coin} orderBook={market?.orderBook} ticker={ticker} />
            <RecentTrades trades={market?.trades ?? []} />
          </div>
        </div>
      </div>
    </main>
  );
}
