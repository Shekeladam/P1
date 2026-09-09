import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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

export const metadata: Metadata = {
  title: "NovaX — Live Crypto Market Dashboard",
  description:
    "A view-only crypto market dashboard with real live prices and charts from Binance's public API. No trading, no accounts, no real funds involved.",
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
        <footer className="text-center text-xs text-zinc-600 py-6 border-t border-zinc-900 mt-auto">
          NovaX displays real live market data from Binance&apos;s public API for viewing only —
          there is no buying, selling, account, or real money involved anywhere in this project.
        </footer>
      </body>
    </html>
  );
}
