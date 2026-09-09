"use client";

import { useState } from "react";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "exists" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus(data.status === "exists" ? "exists" : "added");
    } catch {
      setErrorMsg("Network error — try again.");
      setStatus("error");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm border border-zinc-800 rounded-lg p-6">
        <h1 className="text-lg font-semibold text-zinc-100 mb-1">Crypto Digest</h1>
        <p className="text-sm text-zinc-400 mb-5">
          Market dominance, top headlines, and a chart — every 3 days, straight to your inbox.
        </p>

        {status === "added" || status === "exists" ? (
          <p className="text-sm text-emerald-500">
            {status === "added" ? "You're subscribed. Look out for the next digest." : "You're already subscribed."}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
              disabled={status === "loading"}
              className="w-full rounded-md py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50 cursor-pointer"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
            {status === "error" && <p className="text-xs text-red-500">{errorMsg}</p>}
          </form>
        )}

        <p className="text-xs text-zinc-600 mt-4">
          Unsubscribe link included in every email. No spam, no other use of your address.
        </p>
      </div>
    </main>
  );
}
