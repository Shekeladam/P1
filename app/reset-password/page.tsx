"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/trade"), 1500);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm border border-zinc-800 rounded-lg p-6">
        <h1 className="text-lg font-semibold text-zinc-100 mb-1">Set a New Password</h1>

        {!token ? (
          <p className="text-sm text-red-500 mt-4">
            This link is missing its reset token. Please use the link from your email.
          </p>
        ) : done ? (
          <p className="text-sm text-emerald-500 mt-4">Password updated — taking you to your portfolio…</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (6+ characters)"
              className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving…" : "Set New Password"}
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="flex-1 px-4 py-16 text-center text-sm text-zinc-500">Loading…</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
