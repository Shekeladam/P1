// Digest content sourced entirely from free, no-key public sources:
// CoinGecko (market dominance + trending coins), alternative.me (Fear & Greed
// Index), public RSS feeds (news), QuickChart (chart images), and our own
// Binance/Coinbase ticker feed (market snapshot + altcoin momentum).

import Parser from "rss-parser";
import { fetchAllTickers, type Ticker } from "./binance";

const rssParser = new Parser();
const NEWS_FEEDS = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", source: "CoinTelegraph" },
];

export type DominanceEntry = { symbol: string; pct: number };
export type NewsEntry = { title: string; url: string; source: string; snippet: string };
export type FearGreed = { value: number; classification: string };
export type TrendingCoin = { name: string; symbol: string; changePct: number | null };
export type AltcoinMomentum = { pct: number; leading: "Bitcoin" | "Altcoins" };

export type DigestData = {
  dominance: DominanceEntry[];
  totalMarketCapUsd: number;
  marketCapChange24h: number;
  news: NewsEntry[];
  chartImageUrl: string;
  moversChartImageUrl: string | null;
  fearGreed: FearGreed | null;
  trending: TrendingCoin[];
  snapshot: Ticker[];
  altcoinMomentum: AltcoinMomentum | null;
};

export async function fetchDominance(): Promise<{
  dominance: DominanceEntry[];
  totalMarketCapUsd: number;
  marketCapChange24h: number;
}> {
  const res = await fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store" });
  if (!res.ok) throw new Error("CoinGecko global API error " + res.status);
  const json = await res.json();
  const pctMap = json.data.market_cap_percentage as Record<string, number>;
  const dominance = Object.entries(pctMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([symbol, pct]) => ({ symbol: symbol.toUpperCase(), pct }));
  return {
    dominance,
    totalMarketCapUsd: json.data.total_market_cap.usd,
    marketCapChange24h: json.data.market_cap_change_percentage_24h_usd,
  };
}

export async function fetchFearGreed(): Promise<FearGreed> {
  const res = await fetch("https://api.alternative.me/fng/?limit=1", { cache: "no-store" });
  if (!res.ok) throw new Error("Fear & Greed API error " + res.status);
  const json = await res.json();
  const entry = json.data?.[0];
  if (!entry) throw new Error("Fear & Greed API returned no data");
  return { value: Number(entry.value), classification: entry.value_classification };
}

export async function fetchTrendingCoins(limit = 5): Promise<TrendingCoin[]> {
  const res = await fetch("https://api.coingecko.com/api/v3/search/trending", { cache: "no-store" });
  if (!res.ok) throw new Error("CoinGecko trending API error " + res.status);
  const json = await res.json();
  type TrendingApiCoin = {
    item: { name: string; symbol: string; data?: { price_change_percentage_24h?: { usd?: number } } };
  };
  return ((json.coins ?? []) as TrendingApiCoin[]).slice(0, limit).map(({ item }) => ({
    name: item.name,
    symbol: (item.symbol ?? "").toUpperCase(),
    changePct: item.data?.price_change_percentage_24h?.usd ?? null,
  }));
}

export function computeAltcoinMomentum(snapshot: Ticker[]): AltcoinMomentum | null {
  const btc = snapshot.find((t) => t.symbol === "BTC");
  const others = snapshot.filter((t) => t.symbol !== "BTC");
  if (!btc || others.length === 0) return null;
  const outperforming = others.filter((t) => t.priceChangePercent > btc.priceChangePercent).length;
  const pct = Math.round((outperforming / others.length) * 100);
  return { pct, leading: pct >= 50 ? "Altcoins" : "Bitcoin" };
}

type NewsItem = NewsEntry & { publishedAt: number };

export async function fetchNews(limit = 5): Promise<NewsEntry[]> {
  const perFeed = await Promise.allSettled(
    NEWS_FEEDS.map(async (feed): Promise<NewsItem[]> => {
      const parsed = await rssParser.parseURL(feed.url);
      return (parsed.items ?? []).map((item) => ({
        title: item.title ?? "",
        url: item.link ?? "",
        source: feed.source,
        publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : 0,
        snippet: (item.contentSnippet ?? "").replace(/\s+/g, " ").trim().slice(0, 140),
      }));
    })
  );

  const items: NewsItem[] = [];
  for (const result of perFeed) {
    if (result.status === "fulfilled") items.push(...result.value);
  }

  return items
    .filter((item) => item.title && item.url)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, limit)
    .map(({ title, url, source, snippet }) => ({ title, url, source, snippet }));
}

export function buildDominanceChartUrl(dominance: DominanceEntry[]): string {
  const others = Math.max(0, 100 - dominance.reduce((sum, d) => sum + d.pct, 0));
  const labels = [...dominance.map((d) => d.symbol), "Others"];
  const data = [...dominance.map((d) => Math.round(d.pct * 10) / 10), Math.round(others * 10) / 10];
  const config = {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ["#F0B429", "#34D399", "#60A5FA", "#F472B6", "#A78BFA", "#FB923C", "#8B95A5"],
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "right", labels: { font: { size: 14 } } },
        title: { display: true, text: "Market Cap Dominance", font: { size: 18 } },
      },
    },
  };
  const encoded = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?c=${encoded}&w=560&h=340&backgroundColor=white`;
}

export function buildMoversChartUrl(snapshot: Ticker[]): string | null {
  if (snapshot.length === 0) return null;
  const sorted = [...snapshot].sort((a, b) => b.priceChangePercent - a.priceChangePercent).slice(0, 8);
  const labels = sorted.map((t) => t.symbol);
  const data = sorted.map((t) => Math.round(t.priceChangePercent * 100) / 100);
  const colors = data.map((v) => (v >= 0 ? "#34D399" : "#F26D6D"));
  const config = {
    type: "bar",
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: "24H Price Change (%)", font: { size: 18 } },
      },
    },
  };
  const encoded = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?c=${encoded}&w=560&h=320&backgroundColor=white`;
}

export async function buildDigest(): Promise<DigestData> {
  const [
    { dominance, totalMarketCapUsd, marketCapChange24h },
    news,
    fearGreed,
    trending,
    snapshot,
  ] = await Promise.all([
    fetchDominance(),
    fetchNews(),
    fetchFearGreed().catch(() => null),
    fetchTrendingCoins().catch(() => []),
    fetchAllTickers().catch(() => []),
  ]);

  return {
    dominance,
    totalMarketCapUsd,
    marketCapChange24h,
    news,
    chartImageUrl: buildDominanceChartUrl(dominance),
    moversChartImageUrl: buildMoversChartUrl(snapshot),
    fearGreed,
    trending,
    snapshot,
    altcoinMomentum: computeAltcoinMomentum(snapshot),
  };
}

function formatUsdCompact(value: number): string {
  if (value >= 1e12) return "$" + (value / 1e12).toFixed(2) + "T";
  if (value >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
  return "$" + value.toLocaleString("en-US");
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(4);
}

function fearGreedColor(classification: string): string {
  const c = classification.toLowerCase();
  if (c.includes("extreme fear")) return "#F26D6D";
  if (c.includes("fear")) return "#FB923C";
  if (c.includes("extreme greed")) return "#10B981";
  if (c.includes("greed")) return "#34D399";
  return "#F0B429";
}

function changeColorFor(pct: number): string {
  return pct >= 0 ? "#34D399" : "#F26D6D";
}

function sectionTitle(text: string): string {
  return `<h2 style="font-size:14px;letter-spacing:0.04em;text-transform:uppercase;color:#8b95a5;margin:28px 0 10px;">${text}</h2>`;
}

export function renderDigestEmailHtml(digest: DigestData, unsubscribeUrl: string): string {
  const changeColor = changeColorFor(digest.marketCapChange24h);
  const changeSign = digest.marketCapChange24h >= 0 ? "+" : "";

  const dominanceRows = digest.dominance
    .map(
      (d) => `
        <tr>
          <td style="padding:6px 0;color:#171b21;font-weight:600;">${d.symbol}</td>
          <td style="padding:6px 0;text-align:right;color:#5b6472;">${d.pct.toFixed(1)}%</td>
        </tr>`
    )
    .join("");

  const fearGreedSection = digest.fearGreed
    ? (() => {
        const fg = digest.fearGreed!;
        const color = fearGreedColor(fg.classification);
        const zones = ["#F26D6D", "#FB923C", "#F0B429", "#34D399", "#10B981"];
        const activeZone = Math.min(4, Math.floor(fg.value / 20));
        const zoneCells = zones
          .map(
            (z, i) =>
              `<td style="height:10px;background:${z};opacity:${i === activeZone ? "1" : "0.25"};${
                i === 0 ? "border-radius:5px 0 0 5px;" : ""
              }${i === zones.length - 1 ? "border-radius:0 5px 5px 0;" : ""}"></td>`
          )
          .join("");
        return `
        ${sectionTitle("Fear &amp; Greed Index")}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
          <tr>${zoneCells}</tr>
        </table>
        <p style="margin:0;font-size:14px;color:#171b21;">
          <span style="font-weight:800;font-size:20px;color:${color};">${fg.value}</span>
          <span style="color:${color};font-weight:600;">&nbsp;${fg.classification}</span>
        </p>`;
      })()
    : "";

  const trendingRows = digest.trending
    .map((t) => {
      const changeStr =
        t.changePct == null ? "" : `<span style="color:${changeColorFor(t.changePct)};font-weight:600;">${t.changePct >= 0 ? "+" : ""}${t.changePct.toFixed(1)}%</span>`;
      return `
        <tr>
          <td style="padding:6px 0;color:#171b21;font-weight:600;">${t.name} <span style="color:#8b95a5;font-weight:400;">${t.symbol}</span></td>
          <td style="padding:6px 0;text-align:right;">${changeStr}</td>
        </tr>`;
    })
    .join("");

  const trendingSection =
    digest.trending.length > 0
      ? `
        ${sectionTitle("🔥 Trending Coins")}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${trendingRows}
        </table>`
      : "";

  const snapshotRows = digest.snapshot
    .slice(0, 10)
    .map(
      (t) => `
        <tr>
          <td style="padding:6px 0;color:#171b21;font-weight:600;border-top:1px solid #f0f1f3;">${t.symbol}</td>
          <td style="padding:6px 0;text-align:right;color:#171b21;border-top:1px solid #f0f1f3;">$${formatPrice(t.lastPrice)}</td>
          <td style="padding:6px 0;text-align:right;border-top:1px solid #f0f1f3;color:${changeColorFor(t.priceChangePercent)};font-weight:600;">${t.priceChangePercent >= 0 ? "+" : ""}${t.priceChangePercent.toFixed(2)}%</td>
        </tr>`
    )
    .join("");

  const snapshotSection =
    digest.snapshot.length > 0
      ? `
        ${sectionTitle("Market Snapshot")}
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 0 6px;color:#8b95a5;font-size:12px;">Asset</td>
            <td style="padding:0 0 6px;text-align:right;color:#8b95a5;font-size:12px;">Price</td>
            <td style="padding:0 0 6px;text-align:right;color:#8b95a5;font-size:12px;">24H</td>
          </tr>
          ${snapshotRows}
        </table>
        ${digest.moversChartImageUrl ? `<img src="${digest.moversChartImageUrl}" alt="24h price change by asset" width="100%" style="display:block;border-radius:8px;margin-top:14px;" />` : ""}`
      : "";

  const altcoinSection = digest.altcoinMomentum
    ? (() => {
        const m = digest.altcoinMomentum!;
        const altPct = m.pct;
        const btcPct = 100 - altPct;
        return `
        ${sectionTitle("Altcoin Momentum (24h)")}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
          <tr>
            <td style="height:10px;background:#F0B429;border-radius:5px 0 0 5px;width:${btcPct}%;"></td>
            <td style="height:10px;background:#60A5FA;border-radius:0 5px 5px 0;width:${altPct}%;"></td>
          </tr>
        </table>
        <p style="margin:0;font-size:13px;color:#5b6472;">
          <span style="color:#171b21;font-weight:700;">${altPct}%</span> of tracked altcoins are outperforming Bitcoin today &mdash;
          <strong style="color:#171b21;">${m.leading}</strong> leading.
        </p>`;
      })()
    : "";

  const newsCards = digest.news
    .map(
      (n) => `
        <tr>
          <td style="padding:16px 0;border-top:1px solid #e5e7eb;">
            <a href="${n.url}" style="color:#171b21;font-weight:700;text-decoration:none;font-size:15px;">${n.title}</a>
            <div style="color:#8b95a5;font-size:12px;margin:2px 0 8px;">${n.source}</div>
            ${n.snippet ? `<p style="margin:0 0 10px;color:#5b6472;font-size:13px;line-height:1.5;">${n.snippet}${n.snippet.length >= 140 ? "…" : ""}</p>` : ""}
            <a href="${n.url}" style="display:inline-block;background:#171b21;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;padding:8px 14px;border-radius:6px;">Read More →</a>
          </td>
        </tr>`
    )
    .join("");

  const newsSection =
    digest.news.length > 0
      ? `
        ${sectionTitle("Top Headlines")}
        <table width="100%" cellpadding="0" cellspacing="0">
          ${newsCards}
        </table>`
      : "";

  return `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f2f3f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="background:#0b0e13;padding:20px 24px;">
        <span style="color:#f0b429;font-weight:800;font-size:20px;">NovaX</span>
        <span style="color:#8b95a5;font-size:13px;margin-left:8px;">Crypto Digest</span>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="color:#171b21;font-size:14px;margin:0 0 16px;">
          Total crypto market cap: <strong>${formatUsdCompact(digest.totalMarketCapUsd)}</strong>
          <span style="color:${changeColor};font-weight:600;">(${changeSign}${digest.marketCapChange24h.toFixed(2)}% / 24h)</span>
        </p>

        ${fearGreedSection}
        ${altcoinSection}
        ${trendingSection}

        ${sectionTitle("Market Cap Dominance")}
        <img src="${digest.chartImageUrl}" alt="Market cap dominance chart" width="100%" style="display:block;border-radius:8px;margin-bottom:12px;" />
        <table width="100%" cellpadding="0" cellspacing="0">
          ${dominanceRows}
        </table>

        ${snapshotSection}
        ${newsSection}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background:#f7f8fa;color:#8b95a5;font-size:11px;">
        Market data via CoinGecko, alternative.me &amp; live exchange feeds. News via CoinDesk &amp; CoinTelegraph. Not financial advice.
        <a href="${unsubscribeUrl}" style="color:#8b95a5;">Unsubscribe</a>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
