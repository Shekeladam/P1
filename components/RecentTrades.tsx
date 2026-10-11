"use client";

import type { Trade } from "@/lib/binance";
import { formatPrice } from "@/lib/format";

type RecentTradesProps = {
  trades: Trade[];
};

export function RecentTrades({ trades }: RecentTradesProps) {
  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <div className="text-sm font-medium text-zinc-300 mb-3">
        Recent Trades <span className="text-xs font-normal text-zinc-500">· live</span>
      </div>
      <div className="grid grid-cols-3 text-xs text-zinc-500 mb-1 px-1">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {trades.map((trade) => (
          <div key={trade.id} className="grid grid-cols-3 text-xs px-1 py-0.5">
            <span className={trade.side === "buy" ? "text-emerald-500" : "text-red-500"}>
              {formatPrice(trade.price)}
            </span>
            <span className="text-right text-zinc-300">{trade.size.toFixed(4)}</span>
            <span className="text-right text-zinc-500">
              {new Date(trade.time * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
