// Live market data, fetched server-side so the browser never talks to an
// exchange directly. Binance is tried first; if it fails (e.g. Binance
// blocks requests from cloud/datacenter IPs like Vercel's more aggressively
// than regular browsers), each call transparently falls back to Coinbase's
// public Exchange API. Both are free, public, no-key endpoints. Nothing
// here places orders — there is no authenticated exchange account involved.

const BINANCE_BASE_URL = "https://api.binance.com/api/v3";
const COINBASE_BASE_URL = "https://api.exchange.coinbase.com";

export const SYMBOL_MAP: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  XRP: "XRPUSDT",
  ADA: "ADAUSDT",
  DOGE: "DOGEUSDT",
  AVAX: "AVAXUSDT",
  LINK: "LINKUSDT",
  LTC: "LTCUSDT",
  DOT: "DOTUSDT",
  BCH: "BCHUSDT",
  UNI: "UNIUSDT",
  ATOM: "ATOMUSDT",
  ETC: "ETCUSDT",
  FIL: "FILUSDT",
  NEAR: "NEARUSDT",
  SUI: "SUIUSDT",
};

const COINBASE_SYMBOL_MAP: Record<string, string> = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  SOL: "SOL-USD",
  XRP: "XRP-USD",
  ADA: "ADA-USD",
  DOGE: "DOGE-USD",
  AVAX: "AVAX-USD",
  LINK: "LINK-USD",
  LTC: "LTC-USD",
  DOT: "DOT-USD",
  BCH: "BCH-USD",
  UNI: "UNI-USD",
  ATOM: "ATOM-USD",
  ETC: "ETC-USD",
  FIL: "FIL-USD",
  NEAR: "NEAR-USD",
  SUI: "SUI-USD",
};

export type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type OrderBookRow = {
  price: number;
  size: number;
  total: number;
};

export type Trade = {
  id: string;
  time: number;
  side: "buy" | "sell";
  price: number;
  size: number;
};

export type Ticker = {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
};

export type CandleRange = { startTime: number; endTime: number };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API error ${res.status} for ${url}`);
  }
  return res.json();
}

function toBook(
  rawBids: [string, string, ...unknown[]][],
  rawAsks: [string, string, ...unknown[]][]
): { bids: OrderBookRow[]; asks: OrderBookRow[] } {
  let bidTotal = 0;
  const bids: OrderBookRow[] = rawBids.slice(0, 12).map(([price, size]) => {
    bidTotal += Number(size);
    return { price: Number(price), size: Number(size), total: bidTotal };
  });

  let askTotal = 0;
  const asks: OrderBookRow[] = rawAsks.slice(0, 12).map(([price, size]) => {
    askTotal += Number(size);
    return { price: Number(price), size: Number(size), total: askTotal };
  });

  return { bids, asks };
}

// --- Binance ---

async function binanceTicker(symbol: string): Promise<Ticker> {
  const pair = SYMBOL_MAP[symbol];
  const data = await getJson<{ lastPrice: string; priceChange: string; priceChangePercent: string }>(
    `${BINANCE_BASE_URL}/ticker/24hr?symbol=${pair}`
  );
  return {
    symbol,
    lastPrice: Number(data.lastPrice),
    priceChange: Number(data.priceChange),
    priceChangePercent: Number(data.priceChangePercent),
  };
}

async function binanceCandles(
  symbol: string,
  interval: string,
  limit: number,
  range?: CandleRange
): Promise<Candle[]> {
  const pair = SYMBOL_MAP[symbol];
  let url = `${BINANCE_BASE_URL}/klines?symbol=${pair}&interval=${interval}&limit=${limit}`;
  if (range) url += `&startTime=${range.startTime}&endTime=${range.endTime}`;
  const data = await getJson<[number, string, string, string, string, string, ...unknown[]][]>(url);
  return data.map(([openTime, open, high, low, close, volume]) => ({
    time: Math.floor(openTime / 1000),
    open: Number(open),
    high: Number(high),
    low: Number(low),
    close: Number(close),
    volume: Number(volume),
  }));
}

async function binanceOrderBook(symbol: string, limit: number): Promise<{ bids: OrderBookRow[]; asks: OrderBookRow[] }> {
  const pair = SYMBOL_MAP[symbol];
  const data = await getJson<{ bids: [string, string][]; asks: [string, string][] }>(
    `${BINANCE_BASE_URL}/depth?symbol=${pair}&limit=${limit}`
  );
  return toBook(data.bids, data.asks);
}

async function binanceTrades(symbol: string, limit: number): Promise<Trade[]> {
  const pair = SYMBOL_MAP[symbol];
  const data = await getJson<{ id: number; price: string; qty: string; time: number; isBuyerMaker: boolean }[]>(
    `${BINANCE_BASE_URL}/trades?symbol=${pair}&limit=${limit}`
  );
  return data
    .slice()
    .reverse()
    .map((t) => ({
      id: "b" + t.id,
      time: Math.floor(t.time / 1000),
      side: t.isBuyerMaker ? "sell" : "buy",
      price: Number(t.price),
      size: Number(t.qty),
    }));
}

// --- Coinbase (fallback) ---

async function coinbaseTicker(symbol: string): Promise<Ticker> {
  const pair = COINBASE_SYMBOL_MAP[symbol];
  const data = await getJson<{ open: string; last: string }>(`${COINBASE_BASE_URL}/products/${pair}/stats`);
  const last = Number(data.last);
  const open = Number(data.open);
  const priceChange = last - open;
  const priceChangePercent = open ? (priceChange / open) * 100 : 0;
  return { symbol, lastPrice: last, priceChange, priceChangePercent };
}

// Coinbase only supports these fixed granularities (seconds). Used as a
// fallback only, so intervals with no exact match (e.g. 4h, 1w) round to
// the nearest supported one rather than failing outright.
const COINBASE_GRANULARITY: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 21600,
  "1d": 86400,
  "1w": 86400,
};

async function coinbaseCandles(symbol: string, interval: string, limit: number, range?: CandleRange): Promise<Candle[]> {
  const pair = COINBASE_SYMBOL_MAP[symbol];
  const granularity = COINBASE_GRANULARITY[interval] ?? 3600;
  let url = `${COINBASE_BASE_URL}/products/${pair}/candles?granularity=${granularity}`;
  if (range) {
    url += `&start=${new Date(range.startTime).toISOString()}&end=${new Date(range.endTime).toISOString()}`;
  }
  const data = await getJson<[number, number, number, number, number, number][]>(url);
  return data
    .slice()
    .sort((a, b) => a[0] - b[0])
    .slice(-limit)
    .map(([time, low, high, open, close, volume]) => ({
      time,
      low,
      high,
      open,
      close,
      volume,
    }));
}

async function coinbaseOrderBook(symbol: string): Promise<{ bids: OrderBookRow[]; asks: OrderBookRow[] }> {
  const pair = COINBASE_SYMBOL_MAP[symbol];
  const data = await getJson<{ bids: [string, string, number][]; asks: [string, string, number][] }>(
    `${COINBASE_BASE_URL}/products/${pair}/book?level=2`
  );
  return toBook(data.bids, data.asks);
}

async function coinbaseTrades(symbol: string, limit: number): Promise<Trade[]> {
  const pair = COINBASE_SYMBOL_MAP[symbol];
  const data = await getJson<{ trade_id: number; price: string; size: string; time: string; side: "buy" | "sell" }[]>(
    `${COINBASE_BASE_URL}/products/${pair}/trades`
  );
  return data
    .slice()
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, limit)
    .map((t) => ({
      id: "c" + t.trade_id,
      time: Math.floor(new Date(t.time).getTime() / 1000),
      side: t.side,
      price: Number(t.price),
      size: Number(t.size),
    }));
}

// --- Public API: try Binance, fall back to Coinbase ---

async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch {
    return fallback();
  }
}

export async function fetchTicker(symbol: string): Promise<Ticker> {
  return withFallback(() => binanceTicker(symbol), () => coinbaseTicker(symbol));
}

export async function fetchAllTickers(): Promise<Ticker[]> {
  return Promise.all(Object.keys(SYMBOL_MAP).map(fetchTicker));
}

export async function fetchCandles(
  symbol: string,
  interval = "1h",
  limit = 180,
  range?: CandleRange
): Promise<Candle[]> {
  return withFallback(
    () => binanceCandles(symbol, interval, limit, range),
    () => coinbaseCandles(symbol, interval, limit, range)
  );
}

export async function fetchOrderBook(symbol: string, limit = 12): Promise<{ bids: OrderBookRow[]; asks: OrderBookRow[] }> {
  return withFallback(
    () => binanceOrderBook(symbol, limit),
    () => coinbaseOrderBook(symbol)
  );
}

export async function fetchTrades(symbol: string, limit = 20): Promise<Trade[]> {
  return withFallback(
    () => binanceTrades(symbol, limit),
    () => coinbaseTrades(symbol, limit)
  );
}
