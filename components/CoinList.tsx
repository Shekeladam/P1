"use client";

import { useState } from "react";
import { COINS } from "@/lib/coins";
import type { Ticker } from "@/lib/binance";
import { formatPrice } from "@/lib/format";

type CoinListProps = {
  selected: string;
  onSelect: (symbol: string) => void;
  tickers: Ticker[];
};

const POPULAR = COINS.filter((c) => c.category === "popular");
const MORE = COINS.filter((c) => c.category === "more");

function CoinRow({
  coin,
  ticker,
  isSelected,
  onSelect,
}: {
  coin: (typeof COINS)[number];
  ticker: Ticker | undefined;
  isSelected: boolean;
  onSelect: (symbol: string) => void;
}) {
  const isUp = (ticker?.priceChangePercent ?? 0) >= 0;
  return (
    <button
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
        <span className="text-sm text-zinc-100">{ticker ? `$${formatPrice(ticker.lastPrice)}` : "···"}</span>
        {ticker && (
          <span className={`text-xs font-medium ${isUp ? "text-emerald-500" : "text-red-500"}`}>
            {isUp ? "+" : ""}
            {ticker.priceChangePercent.toFixed(2)}%
          </span>
        )}
      </div>
    </button>
  );
}

export function CoinList({ selected, onSelect, tickers }: CoinListProps) {
  const [showMore, setShowMore] = useState(false);
  const selectedIsMore = MORE.some((c) => c.symbol === selected);

  return (
    <div className="flex flex-col border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 text-sm font-medium text-zinc-300">
        Markets <span className="text-xs font-normal text-zinc-500">· live</span>
      </div>
      <div className="overflow-y-auto max-h-[420px]">
        <div className="px-4 pt-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Popular
        </div>
        {POPULAR.map((coin) => (
          <CoinRow
            key={coin.symbol}
            coin={coin}
            ticker={tickers.find((t) => t.symbol === coin.symbol)}
            isSelected={coin.symbol === selected}
            onSelect={onSelect}
          />
        ))}

        <button
          onClick={() => setShowMore((s) => !s)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left border-b border-t border-zinc-900 bg-zinc-950/50 hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            More Coins <span className="text-zinc-600">({MORE.length})</span>
          </span>
          <span className="text-xs text-zinc-500">{showMore || selectedIsMore ? "Hide ▲" : "Show ▼"}</span>
        </button>

        {(showMore || selectedIsMore) &&
          MORE.map((coin) => (
            <CoinRow
              key={coin.symbol}
              coin={coin}
              ticker={tickers.find((t) => t.symbol === coin.symbol)}
              isSelected={coin.symbol === selected}
              onSelect={onSelect}
            />
          ))}
      </div>
    </div>
  );
}
