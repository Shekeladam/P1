import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { DemoBanner } from "@/components/DemoBanner";
import { TopBar } from "@/components/TopBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Live crypto prices and charts, simulated paper trading with real accounts, a global leaderboard, and a fiat currency converter — all free, no real money involved.";

export const metadata: Metadata = {
  title: "NovaX — Live Crypto Market Dashboard",
  description: SITE_DESCRIPTION,
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "NovaX — Live Crypto Market Dashboard",
    description: SITE_DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "NovaX — Live Crypto Market Dashboard",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <DemoBanner />
        <TopBar />
        {children}
        <footer className="text-center text-xs text-zinc-600 py-6 border-t border-zinc-900 mt-auto flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <Link href="/about" className="hover:text-zinc-400">
              About
            </Link>
            <Link href="/privacy" className="hover:text-zinc-400">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-400">
              Terms
            </Link>
          </div>
          <p>
            NovaX displays real live market data from Binance&apos;s public API. Trading on NovaX is simulated
            with play money only — no real funds are ever bought, sold, or held.
          </p>
        </footer>
      </body>
    </html>
  );
}
