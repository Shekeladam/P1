"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Markets" },
  { href: "/#portfolio", label: "Sample" },
  { href: "/trade", label: "Trade" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/currency", label: "Currency" },
  { href: "/subscribe", label: "Digest" },
  { href: "/settings", label: "Settings" },
];

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative border-b border-zinc-800">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-emerald-500 flex items-center justify-center font-bold text-black text-sm">
            N
          </div>
          <span className="font-semibold tracking-tight text-zinc-100">NovaX</span>
          <span className="hidden sm:inline text-xs text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5 ml-1">
            live · view-only
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} className="hover:text-zinc-100" href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://www.binance.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline text-xs text-zinc-500 hover:text-zinc-300"
          >
            Data via Binance
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="md:hidden text-zinc-400 hover:text-zinc-100 cursor-pointer p-1"
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden flex flex-col border-t border-zinc-800 px-4 sm:px-6 py-2 text-sm text-zinc-400 bg-zinc-950">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              className="py-2.5 border-b border-zinc-900 last:border-b-0 hover:text-zinc-100"
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
