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

  MATIC: "MATICUSDT",
  ARB: "ARBUSDT",
  OP: "OPUSDT",
  SEI: "SEIUSDT",
  INJ: "INJUSDT",
  RNDR: "RNDRUSDT",
  TIA: "TIAUSDT",
  FTM: "FTMUSDT",
  ALGO: "ALGOUSDT",
  VET: "VETUSDT",
  ICP: "ICPUSDT",
  HBAR: "HBARUSDT",
  THETA: "THETAUSDT",
  XLM: "XLMUSDT",
  XTZ: "XTZUSDT",
  EOS: "EOSUSDT",
  EGLD: "EGLDUSDT",
  SAND: "SANDUSDT",
  MANA: "MANAUSDT",
  AXS: "AXSUSDT",
  GALA: "GALAUSDT",
  CHZ: "CHZUSDT",
  ENJ: "ENJUSDT",
  GRT: "GRTUSDT",
  IMX: "IMXUSDT",
  RUNE: "RUNEUSDT",
  KAVA: "KAVAUSDT",
  ZEC: "ZECUSDT",
  DASH: "DASHUSDT",
  CAKE: "CAKEUSDT",
  SUSHI: "SUSHIUSDT",
  COMP: "COMPUSDT",
  MKR: "MKRUSDT",
  SNX: "SNXUSDT",
  CRV: "CRVUSDT",
  YFI: "YFIUSDT",
  BAT: "BATUSDT",
  ZRX: "ZRXUSDT",
  QTUM: "QTUMUSDT",
  ONT: "ONTUSDT",
  IOST: "IOSTUSDT",
  ICX: "ICXUSDT",
  WAVES: "WAVESUSDT",
  KSM: "KSMUSDT",
  FLOW: "FLOWUSDT",
  CELO: "CELOUSDT",
  ROSE: "ROSEUSDT",
  ONE: "ONEUSDT",
  ANKR: "ANKRUSDT",
  STORJ: "STORJUSDT",
  FET: "FETUSDT",
  LDO: "LDOUSDT",
  ENS: "ENSUSDT",
  MASK: "MASKUSDT",
  DYDX: "DYDXUSDT",
  GMX: "GMXUSDT",
  PYTH: "PYTHUSDT",
  JTO: "JTOUSDT",
  JUP: "JUPUSDT",
  WIF: "WIFUSDT",
  BONK: "BONKUSDT",
  FLOKI: "FLOKIUSDT",
  TRX: "TRXUSDT",
  NEO: "NEOUSDT",
  LUNC: "LUNCUSDT",
  APE: "APEUSDT",
  GMT: "GMTUSDT",
  STX: "STXUSDT",
  ORDI: "ORDIUSDT",
  WLD: "WLDUSDT",
  TON: "TONUSDT",
  AR: "ARUSDT",
  RVN: "RVNUSDT",
  ZIL: "ZILUSDT",
  HOT: "HOTUSDT",
  WIN: "WINUSDT",
  CVC: "CVCUSDT",
  KNC: "KNCUSDT",
  BAND: "BANDUSDT",
  LRC: "LRCUSDT",
  BAL: "BALUSDT",
  NMR: "NMRUSDT",
  RLC: "RLCUSDT",
  ANT: "ANTUSDT",
  KDA: "KDAUSDT",
  SXP: "SXPUSDT",
  C98: "C98USDT",
  DYM: "DYMUSDT",
  STRK: "STRKUSDT",
  ALT: "ALTUSDT",
  PIXEL: "PIXELUSDT",
  PORTAL: "PORTALUSDT",
  AEVO: "AEVOUSDT",
  ETHFI: "ETHFIUSDT",
  ENA: "ENAUSDT",
  W: "WUSDT",
  SAGA: "SAGAUSDT",
  OMNI: "OMNIUSDT",
  NOT: "NOTUSDT",
  RAY: "RAYUSDT",
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

  // Best-effort fallback coverage — not every "more" coin has a Coinbase
  // pair, and that's fine: coinbaseTicker/etc. throw cleanly on a missing
  // entry, so those symbols just rely on Binance (see fetchAllTickers,
  // which tolerates individual failures instead of one bad symbol
  // breaking the whole list).
  MATIC: "MATIC-USD",
  ARB: "ARB-USD",
  OP: "OP-USD",
  SEI: "SEI-USD",
  INJ: "INJ-USD",
  TIA: "TIA-USD",
  FTM: "FTM-USD",
  ALGO: "ALGO-USD",
  VET: "VET-USD",
  ICP: "ICP-USD",
  HBAR: "HBAR-USD",
  XLM: "XLM-USD",
  XTZ: "XTZ-USD",
  EOS: "EOS-USD",
  SAND: "SAND-USD",
  MANA: "MANA-USD",
  AXS: "AXS-USD",
  GALA: "GALA-USD",
  CHZ: "CHZ-USD",
  ENJ: "ENJ-USD",
  GRT: "GRT-USD",
  IMX: "IMX-USD",
  RUNE: "RUNE-USD",
  KAVA: "KAVA-USD",
  ZEC: "ZEC-USD",
  CRV: "CRV-USD",
  YFI: "YFI-USD",
  BAT: "BAT-USD",
  ZRX: "ZRX-USD",
  KSM: "KSM-USD",
  FLOW: "FLOW-USD",
  CELO: "CELO-USD",
  ROSE: "ROSE-USD",
  ANKR: "ANKR-USD",
  STORJ: "STORJ-USD",
  FET: "FET-USD",
  LDO: "LDO-USD",
  ENS: "ENS-USD",
  MASK: "MASK-USD",
  DYDX: "DYDX-USD",
  PYTH: "PYTH-USD",
  JTO: "JTO-USD",
  JUP: "JUP-USD",
  WIF: "WIF-USD",
  BONK: "BONK-USD",
  FLOKI: "FLOKI-USD",
  TRX: "TRX-USD",
  APE: "APE-USD",
  GMT: "GMT-USD",
  STX: "STX-USD",
  WLD: "WLD-USD",
  AR: "AR-USD",
  ZIL: "ZIL-USD",
  KNC: "KNC-USD",
  BAND: "BAND-USD",
  LRC: "LRC-USD",
  BAL: "BAL-USD",
  DYM: "DYM-USD",
  STRK: "STRK-USD",
  ETHFI: "ETHFI-USD",
  ENA: "ENA-USD",
  W: "W-USD",
  RAY: "RAY-USD",
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
  if (!pair) throw new Error(`No Coinbase pair for ${symbol}`);
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
  if (!pair) throw new Error(`No Coinbase pair for ${symbol}`);
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
  if (!pair) throw new Error(`No Coinbase pair for ${symbol}`);
  const data = await getJson<{ bids: [string, string, number][]; asks: [string, string, number][] }>(
    `${COINBASE_BASE_URL}/products/${pair}/book?level=2`
  );
  return toBook(data.bids, data.asks);
}

async function coinbaseTrades(symbol: string, limit: number): Promise<Trade[]> {
  const pair = COINBASE_SYMBOL_MAP[symbol];
  if (!pair) throw new Error(`No Coinbase pair for ${symbol}`);
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

// Now that there are 100+ tracked coins, fetching each ticker individually
// would mean 100+ requests per refresh. Binance's bulk endpoint (no symbol
// param) returns every pair in one call instead, so that's tried first;
// only symbols missing from that response (or, if the bulk call itself
// fails, every symbol) fall back to the per-symbol Binance→Coinbase path.
// One flaky/delisted symbol never takes down the whole list — it's just
// omitted.
export async function fetchAllTickers(): Promise<Ticker[]> {
  const symbols = Object.keys(SYMBOL_MAP);

  try {
    const all = await getJson<
      { symbol: string; lastPrice: string; priceChange: string; priceChangePercent: string }[]
    >(`${BINANCE_BASE_URL}/ticker/24hr`);
    const byPair = new Map(all.map((t) => [t.symbol, t]));

    const tickers: Ticker[] = [];
    const missing: string[] = [];
    for (const symbol of symbols) {
      const data = byPair.get(SYMBOL_MAP[symbol]);
      if (data) {
        tickers.push({
          symbol,
          lastPrice: Number(data.lastPrice),
          priceChange: Number(data.priceChange),
          priceChangePercent: Number(data.priceChangePercent),
        });
      } else {
        missing.push(symbol);
      }
    }

    if (missing.length > 0) {
      const fallback = await Promise.allSettled(missing.map(fetchTicker));
      for (const r of fallback) if (r.status === "fulfilled") tickers.push(r.value);
    }
    return tickers;
  } catch {
    const results = await Promise.allSettled(symbols.map(fetchTicker));
    return results
      .filter((r): r is PromiseFulfilledResult<Ticker> => r.status === "fulfilled")
      .map((r) => r.value);
  }
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
