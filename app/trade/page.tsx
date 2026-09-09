"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COINS } from "@/lib/coins";

type Holding = { symbol: string; quantity: number; price: number | null; value: number };
type Trade = { id: number; symbol: string; side: "buy" | "sell"; quantity: number; price: number; total: number; created_at: string };
type Portfolio = {
  email: string;
  displayName: string | null;
  cashBalance: number;
  holdings: Holding[];
  holdingsValue: number;
  totalValue: number;
  startingBalance: number;
  gainLoss: number;
  gainLossPct: number;
  trades: Trade[];
};
type Ticker = { symbol: string; lastPrice: number; priceChangePercent: number };

function formatUsd(value: number): string {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TradePage() {
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupDisplayName, setSignupDisplayName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const [nameDraft, setNameDraft] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const [signedIn, setSignedIn] = useState<boolean | null>(null); // null = checking
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [tickers, setTickers] = useState<Ticker[]>([]);

  const [tradeSymbol, setTradeSymbol] = useState(COINS[0].symbol);
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [tradeQty, setTradeQty] = useState("");
  const [tradeError, setTradeError] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);

  async function loadPortfolio() {
    const res = await fetch("/api/portfolio");
    if (res.status === 401) {
      setSignedIn(false);
      setPortfolio(null);
      return;
    }
    if (res.ok) {
      setPortfolio(await res.json());
      setSignedIn(true);
    }
  }

  async function loadTickers() {
    try {
      const res = await fetch("/api/tickers");
      if (res.ok) setTickers((await res.json()).tickers);
    } catch {
      // non-critical for this page; buy/sell will still validate server-side
    }
  }

  useEffect(() => {
    async function loadInitial() {
      await Promise.all([loadPortfolio(), loadTickers()]);
    }
    loadInitial();
    const id = setInterval(() => {
      loadTickers();
      loadPortfolio();
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const body =
        authMode === "signup"
          ? { email, password, displayName: signupDisplayName }
          : { email, password };
      const res = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Something went wrong.");
        return;
      }
      setPassword("");
      await loadPortfolio();
    } catch {
      setAuthError("Network error — try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setForgotMessage("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setForgotMessage(data.message ?? "If an account with that email exists, a reset link has been sent.");
    } catch {
      setAuthError("Network error — try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setSignedIn(false);
    setPortfolio(null);
  }

  async function handleSaveDisplayName(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: nameDraft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error ?? "Couldn't save that name.");
        return;
      }
      await loadPortfolio();
    } catch {
      setNameError("Network error — try again.");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleTrade(e: React.FormEvent) {
    e.preventDefault();
    setTradeError("");
    const quantity = Number(tradeQty);
    if (!(quantity > 0)) {
      setTradeError("Enter a valid quantity.");
      return;
    }
    setTradeLoading(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: tradeSymbol, side: tradeSide, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTradeError(data.error ?? "Trade failed.");
        return;
      }
      setTradeQty("");
      await loadPortfolio();
    } catch {
      setTradeError("Network error — try again.");
    } finally {
      setTradeLoading(false);
    }
  }

  const currentTicker = tickers.find((t) => t.symbol === tradeSymbol);

  if (signedIn === null) {
    return <main className="flex-1 px-4 py-16 text-center text-sm text-zinc-500">Loading…</main>;
  }

  if (!signedIn) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm border border-zinc-800 rounded-lg p-6">
          <h1 className="text-lg font-semibold text-zinc-100 mb-1">Paper Trading</h1>
          <p className="text-sm text-zinc-400 mb-5">
            Start with {formatUsd(8750)} in simulated cash. Buy and sell at live prices and see if your
            portfolio goes up or down — sign in to save your progress.
          </p>

          <div className="flex rounded-md overflow-hidden border border-zinc-800 mb-4 text-sm">
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`flex-1 py-2 font-medium cursor-pointer ${authMode === "signup" ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400"}`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signin")}
              className={`flex-1 py-2 font-medium cursor-pointer ${authMode === "signin" ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400"}`}
            >
              Sign In
            </button>
          </div>

          {authMode === "forgot" ? (
            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
              <p className="text-xs text-zinc-500">
                Enter your account email and we&apos;ll send you a link to set a new password.
              </p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-md py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? "Sending…" : "Send Reset Link"}
              </button>
              {forgotMessage && <p className="text-xs text-emerald-500">{forgotMessage}</p>}
              {authError && <p className="text-xs text-red-500">{authError}</p>}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setForgotMessage("");
                  setAuthError("");
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                ← Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              />
              {authMode === "signup" && (
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={24}
                  value={signupDisplayName}
                  onChange={(e) => setSignupDisplayName(e.target.value)}
                  placeholder="Display name (shown on leaderboard)"
                  className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                />
              )}
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (6+ characters)"
                className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-md py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? "Please wait…" : authMode === "signup" ? "Create Account" : "Sign In"}
              </button>
              {authError && <p className="text-xs text-red-500">{authError}</p>}
              {authMode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("forgot");
                    setAuthError("");
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer text-left"
                >
                  Forgot password?
                </button>
              )}
            </form>
          )}

          <p className="text-xs text-zinc-600 mt-4">
            Simulated money only — no real funds, no real exchange, nothing here is financial advice.
          </p>
        </div>
      </main>
    );
  }

  if (!portfolio) {
    return <main className="flex-1 px-4 py-16 text-center text-sm text-zinc-500">Loading your portfolio…</main>;
  }

  const isUp = portfolio.gainLoss >= 0;

  return (
    <main className="flex-1 px-4 sm:px-6 py-6 max-w-[1100px] w-full mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">
          Signed in as <span className="text-zinc-100">{portfolio.displayName ?? portfolio.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/leaderboard"
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded px-2 py-1"
          >
            Leaderboard
          </Link>
          <button
            onClick={handleSignOut}
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded px-2 py-1 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {!portfolio.displayName && (
        <form
          onSubmit={handleSaveDisplayName}
          className="flex flex-wrap items-center gap-2 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 text-xs"
        >
          <span className="text-amber-500">Pick a display name to show up on the leaderboard:</span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={24}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Display name"
            className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-zinc-100 outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            disabled={nameSaving}
            className="px-2.5 py-1 rounded-md font-semibold bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 cursor-pointer"
          >
            {nameSaving ? "Saving…" : "Save"}
          </button>
          {nameError && <span className="text-red-500">{nameError}</span>}
        </form>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 mb-1">Total Value</div>
          <div className="text-lg font-semibold text-zinc-100">{formatUsd(portfolio.totalValue)}</div>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 mb-1">vs Start ({formatUsd(portfolio.startingBalance)})</div>
          <div className={`text-lg font-semibold ${isUp ? "text-emerald-500" : "text-red-500"}`}>
            {isUp ? "+" : ""}
            {formatUsd(portfolio.gainLoss)} ({isUp ? "+" : ""}
            {portfolio.gainLossPct.toFixed(2)}%)
          </div>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 mb-1">Cash</div>
          <div className="text-lg font-semibold text-zinc-100">{formatUsd(portfolio.cashBalance)}</div>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 mb-1">Holdings Value</div>
          <div className="text-lg font-semibold text-zinc-100">{formatUsd(portfolio.holdingsValue)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="border border-zinc-800 rounded-lg p-4">
          <div className="text-sm font-medium text-zinc-300 mb-3">Trade</div>
          <form onSubmit={handleTrade} className="flex flex-col gap-3">
            <select
              value={tradeSymbol}
              onChange={(e) => setTradeSymbol(e.target.value)}
              className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            >
              {COINS.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.symbol} — {c.name}
                </option>
              ))}
            </select>

            <div className="flex rounded-md overflow-hidden border border-zinc-800 text-sm">
              <button
                type="button"
                onClick={() => setTradeSide("buy")}
                className={`flex-1 py-2 font-medium cursor-pointer ${tradeSide === "buy" ? "bg-emerald-600 text-white" : "bg-zinc-900 text-zinc-400"}`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setTradeSide("sell")}
                className={`flex-1 py-2 font-medium cursor-pointer ${tradeSide === "sell" ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400"}`}
              >
                Sell
              </button>
            </div>

            <input
              type="number"
              min="0"
              step="any"
              value={tradeQty}
              onChange={(e) => setTradeQty(e.target.value)}
              placeholder={`Amount (${tradeSymbol})`}
              className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />

            <div className="flex justify-between text-xs text-zinc-500">
              <span>Live price</span>
              <span>{currentTicker ? formatUsd(currentTicker.lastPrice) : "···"}</span>
            </div>
            {currentTicker && tradeQty && Number(tradeQty) > 0 && (
              <div className="flex justify-between text-sm text-zinc-200 font-medium">
                <span>Estimated total</span>
                <span>{formatUsd(Number(tradeQty) * currentTicker.lastPrice)}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={tradeLoading}
              className={`w-full rounded-md py-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                tradeSide === "buy" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"
              }`}
            >
              {tradeLoading ? "Placing…" : tradeSide === "buy" ? "Buy" : "Sell"}
            </button>
            {tradeError && <p className="text-xs text-red-500">{tradeError}</p>}
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-zinc-800 rounded-lg p-4">
            <div className="text-sm font-medium text-zinc-300 mb-3">Holdings</div>
            {portfolio.holdings.length === 0 ? (
              <p className="text-xs text-zinc-500">No holdings yet — make your first trade.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-500">
                    <th className="text-left font-normal pb-1">Asset</th>
                    <th className="text-right font-normal pb-1">Quantity</th>
                    <th className="text-right font-normal pb-1">Price</th>
                    <th className="text-right font-normal pb-1">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((h) => (
                    <tr key={h.symbol} className="border-t border-zinc-900">
                      <td className="py-1.5 text-zinc-100 font-medium">{h.symbol}</td>
                      <td className="py-1.5 text-right text-zinc-300">{h.quantity}</td>
                      <td className="py-1.5 text-right text-zinc-500">{h.price ? formatUsd(h.price) : "···"}</td>
                      <td className="py-1.5 text-right text-zinc-200">{formatUsd(h.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="border border-zinc-800 rounded-lg p-4">
            <div className="text-sm font-medium text-zinc-300 mb-3">Recent Trades</div>
            {portfolio.trades.length === 0 ? (
              <p className="text-xs text-zinc-500">No trades yet.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                  <tbody>
                    {portfolio.trades.map((t) => (
                      <tr key={t.id} className="border-t border-zinc-900">
                        <td className={`py-1.5 ${t.side === "buy" ? "text-emerald-500" : "text-red-500"}`}>
                          {t.side === "buy" ? "Bought" : "Sold"} {t.quantity} {t.symbol}
                        </td>
                        <td className="py-1.5 text-right text-zinc-400">{formatUsd(t.total)}</td>
                        <td className="py-1.5 text-right text-zinc-600">
                          {new Date(t.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
