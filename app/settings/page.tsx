"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Portfolio = {
  email: string;
  displayName: string | null;
  hasPassword: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  const [nameDraft, setNameDraft] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/portfolio");
      if (res.status === 401) {
        setSignedIn(false);
        return;
      }
      if (res.ok) {
        const data: Portfolio = await res.json();
        setPortfolio(data);
        setNameDraft(data.displayName ?? "");
        setSignedIn(true);
      }
    }
    load();
  }, []);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameSaved(false);
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
      setPortfolio((p) => (p ? { ...p, displayName: nameDraft } : p));
      setNameSaved(true);
    } catch {
      setNameError("Network error — try again.");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSaved(false);
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Couldn't update your password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSaved(true);
      setPortfolio((p) => (p ? { ...p, hasPassword: true } : p));
    } catch {
      setPasswordError("Network error — try again.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError("");
    if (deleteConfirm !== "DELETE") {
      setDeleteError('Type "DELETE" to confirm.');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error ?? "Couldn't delete your account.");
        return;
      }
      router.push("/");
    } catch {
      setDeleteError("Network error — try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (signedIn === null) {
    return <main className="flex-1 px-4 py-16 text-center text-sm text-zinc-500">Loading…</main>;
  }

  if (!signedIn || !portfolio) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16 text-center">
        <div className="w-full max-w-sm border border-zinc-800 rounded-lg p-6 flex flex-col gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">Account Settings</h1>
          <p className="text-sm text-zinc-400">Sign in to manage your account.</p>
          <Link
            href="/trade"
            className="rounded-md bg-amber-500 text-black font-medium py-2 text-sm hover:bg-amber-400"
          >
            Go to Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 sm:px-6 py-8 max-w-[560px] w-full mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 mb-1">Account Settings</h1>
        <p className="text-sm text-zinc-500">Signed in as {portfolio.email}</p>
      </div>

      <form onSubmit={handleSaveName} className="border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-100">Display Name</h2>
        <input
          type="text"
          minLength={2}
          maxLength={24}
          value={nameDraft}
          onChange={(e) => {
            setNameDraft(e.target.value);
            setNameSaved(false);
          }}
          placeholder="Display name"
          className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        />
        {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        {nameSaved && !nameError && <p className="text-xs text-emerald-500">Saved.</p>}
        <button
          type="submit"
          disabled={nameSaving}
          className="self-start rounded-md bg-zinc-100 text-black font-medium px-4 py-1.5 text-sm hover:bg-white disabled:opacity-50 cursor-pointer"
        >
          {nameSaving ? "Saving…" : "Save"}
        </button>
      </form>

      <form onSubmit={handleSavePassword} className="border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-100">
          {portfolio.hasPassword ? "Change Password" : "Set a Password"}
        </h2>
        {!portfolio.hasPassword && (
          <p className="text-xs text-zinc-500">
            You signed in with an external provider and don&apos;t have a password yet. Set one here to also
            be able to sign in with your email.
          </p>
        )}
        {portfolio.hasPassword && (
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
          />
        )}
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min. 6 characters)"
          className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
        />
        {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
        {passwordSaved && !passwordError && <p className="text-xs text-emerald-500">Password updated.</p>}
        <button
          type="submit"
          disabled={passwordSaving}
          className="self-start rounded-md bg-zinc-100 text-black font-medium px-4 py-1.5 text-sm hover:bg-white disabled:opacity-50 cursor-pointer"
        >
          {passwordSaving ? "Saving…" : portfolio.hasPassword ? "Update Password" : "Set Password"}
        </button>
      </form>

      <form
        onSubmit={handleDeleteAccount}
        className="border border-red-500/30 bg-red-500/5 rounded-lg p-5 flex flex-col gap-3"
      >
        <h2 className="text-sm font-semibold text-red-400">Delete Account</h2>
        <p className="text-xs text-zinc-500">
          This permanently deletes your account, portfolio, and trade history. This can&apos;t be undone.
        </p>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder='Type "DELETE" to confirm'
          className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-500/50"
        />
        {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
        <button
          type="submit"
          disabled={deleting}
          className="self-start rounded-md bg-red-600 text-white font-medium px-4 py-1.5 text-sm hover:bg-red-500 disabled:opacity-50 cursor-pointer"
        >
          {deleting ? "Deleting…" : "Delete My Account"}
        </button>
      </form>
    </main>
  );
}
