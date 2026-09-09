"use client";

import { MOCK_CASH_BALANCE, MOCK_HOLDINGS } from "@/lib/coins";
import type { Ticker } from "@/lib/binance";
import { formatPrice } from "@/lib/format";

type PortfolioTableProps = {
  tickers: Ticker[];
};

export function PortfolioTable({ tickers }: PortfolioTableProps) {
  const rows = MOCK_HOLDINGS.map((holding) => {
    const ticker = tickers.find((t) => t.symbol === holding.symbol);
    const price = ticker?.lastPrice ?? 0;
    const value = price * holding.amount;
    return { holding, price, value };
  });

  const holdingsValue = rows.reduce((sum, row) => sum + row.value, 0);
  const totalValue = holdingsValue + MOCK_CASH_BALANCE;

  return (
    <div className="border border-zinc-800 rounded-lg p-4" id="portfolio">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-sm font-medium text-zinc-300">
          Sample Portfolio{" "}
          <span className="text-xs font-normal text-zinc-500">(illustrative holdings)</span>
        </span>
        <span className="text-sm font-semibold text-zinc-100">
          $
          {totalValue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      <div className="grid grid-cols-4 text-xs text-zinc-500 mb-1 px-1">
        <span>Asset</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Price</span>
        <span className="text-right">Value</span>
      </div>
      {rows.map(({ holding, price, value }) => (
        <div key={holding.symbol} className="grid grid-cols-4 text-xs px-1 py-1.5 border-t border-zinc-900">
          <span className="text-zinc-100 font-medium">{holding.symbol}</span>
          <span className="text-right text-zinc-300">{holding.amount}</span>
          <span className="text-right text-zinc-500">{price ? `$${formatPrice(price)}` : "···"}</span>
          <span className="text-right text-zinc-200">
            ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
      <div className="grid grid-cols-4 text-xs px-1 py-1.5 border-t border-zinc-900">
        <span className="text-zinc-100 font-medium">USD Cash</span>
        <span className="text-right text-zinc-300">—</span>
        <span className="text-right text-zinc-500">—</span>
        <span className="text-right text-zinc-200">
          $
          {MOCK_CASH_BALANCE.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}
