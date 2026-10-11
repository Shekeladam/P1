"use client";

import { useEffect, useState } from "react";
import { CURRENCIES } from "@/lib/currencies";

type RatesResponse = { base: string; date: string; rates: Record<string, number> };

export default function CurrencyPage() {
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("ILS");
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadRates() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/currency?base=${from}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setRates(data);
      } catch {
        if (!cancelled) setError("Couldn't load exchange rates. Try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadRates();
    const id = setInterval(loadRates, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [from]);

  function handleSwap() {
    setFrom(to);
    setTo(from);
  }

  const rate = from === to ? 1 : rates?.rates[to];
  const amountNum = Number(amount);
  const converted = rate != null && Number.isFinite(amountNum) ? amountNum * rate : null;

  return (
    <main className="flex-1 px-4 sm:px-6 py-8 max-w-[560px] w-full mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 mb-1">Currency Converter</h1>
        <p className="text-sm text-zinc-500">
          Live exchange rates for world currencies — dollars, shekels, euros, and more.
        </p>
      </div>

      <div className="border border-zinc-800 rounded-lg p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-500">Amount</label>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            title="Swap currencies"
            className="mb-0.5 shrink-0 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-2 text-sm text-zinc-300 cursor-pointer"
          >
            ⇄
          </button>

          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="border-t border-zinc-800 pt-4">
          {loading && !rates ? (
            <p className="text-sm text-zinc-500">Loading rates…</p>
          ) : converted != null ? (
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-semibold text-zinc-100">
                {converted.toLocaleString("en-US", { maximumFractionDigits: 2 })} {to}
              </div>
              <div className="text-xs text-zinc-500">
                1 {from} = {rate?.toFixed(4)} {to}
                {rates?.date && ` · rates as of ${rates.date}`}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">···</p>
          )}
        </div>
      </div>

      <p className="text-xs text-zinc-600">
        Rates via Frankfurter (European Central Bank reference rates), updated daily on banking days. Not
        financial advice.
      </p>
    </main>
  );
}
