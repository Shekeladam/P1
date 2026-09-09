"use client";

import type { Coin } from "@/lib/coins";
import type { OrderBookRow, Ticker } from "@/lib/binance";
import { formatPrice } from "@/lib/format";

type OrderBookProps = {
  coin: Coin;
  orderBook?: { bids: OrderBookRow[]; asks: OrderBookRow[] };
  ticker?: Ticker;
};

export function OrderBook({ coin, orderBook, ticker }: OrderBookProps) {
  const bids = orderBook?.bids ?? [];
  const asks = orderBook?.asks ?? [];
  const maxTotal = Math.max(bids[bids.length - 1]?.total ?? 1, asks[asks.length - 1]?.total ?? 1);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <div className="text-sm font-medium text-zinc-300 mb-3">
        Order Book <span className="text-xs font-normal text-zinc-500">· live</span>
      </div>
      <div className="grid grid-cols-3 text-xs text-zinc-500 mb-1 px-1">
        <span>Price (USDT)</span>
        <span className="text-right">Size ({coin.symbol})</span>
        <span className="text-right">Total</span>
      </div>
      <div className="flex flex-col-reverse">
        {asks
          .slice()
          .reverse()
          .map((row) => (
            <Row key={`ask-${row.price}`} row={row} side="ask" maxTotal={maxTotal} />
          ))}
      </div>
      <div className="text-sm font-semibold text-zinc-100 py-2 border-y border-zinc-800 my-1 px-1">
        {ticker ? `$${formatPrice(ticker.lastPrice)}` : "···"}
      </div>
      <div className="flex flex-col">
        {bids.map((row) => (
          <Row key={`bid-${row.price}`} row={row} side="bid" maxTotal={maxTotal} />
        ))}
      </div>
    </div>
  );
}

function Row({
  row,
  side,
  maxTotal,
}: {
  row: OrderBookRow;
  side: "bid" | "ask";
  maxTotal: number;
}) {
  const pct = Math.min(100, (row.total / maxTotal) * 100);
  return (
    <div className="relative grid grid-cols-3 text-xs px-1 py-0.5">
      <div
        className={`absolute inset-y-0 right-0 ${
          side === "bid" ? "bg-emerald-500/10" : "bg-red-500/10"
        }`}
        style={{ width: `${pct}%` }}
      />
      <span className={`relative ${side === "bid" ? "text-emerald-500" : "text-red-500"}`}>
        {formatPrice(row.price)}
      </span>
      <span className="relative text-right text-zinc-300">{row.size.toFixed(4)}</span>
      <span className="relative text-right text-zinc-500">{row.total.toFixed(4)}</span>
    </div>
  );
}
