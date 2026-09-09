"use client";

import { COINS } from "@/lib/coins";
import type { Ticker } from "@/lib/binance";
import { formatPrice } from "@/lib/format";

type CoinListProps = {
  selected: string;
  onSelect: (symbol: string) => void;
  tickers: Ticker[];
};

export function CoinList({ selected, onSelect, tickers }: CoinListProps) {
  return (
    <div className="flex flex-col border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 text-sm font-medium text-zinc-300">
        Markets <span className="text-xs font-normal text-zinc-500">· live</span>
      </div>
      <div className="overflow-y-auto max-h-[420px]">
        {COINS.map((coin) => {
          const ticker = tickers.find((t) => t.symbol === coin.symbol);
          const isSelected = coin.symbol === selected;
          const isUp = (ticker?.priceChangePercent ?? 0) >= 0;
          return (
            <button
              key={coin.symbol}
              onClick={() => onSelect(coin.symbol)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left border-b border-zinc-900 transition-colors cursor-pointer ${
                isSelected ? "bg-zinc-800/70" : "hover:bg-zinc-900"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-100">{coin.symbol}</span>
                <span className="text-xs text-zinc-500">{coin.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm text-zinc-100">
                  {ticker ? `$${formatPrice(ticker.lastPrice)}` : "···"}
                </span>
                {ticker && (
                  <span
                    className={`text-xs font-medium ${isUp ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {isUp ? "+" : ""}
                    {ticker.priceChangePercent.toFixed(2)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
