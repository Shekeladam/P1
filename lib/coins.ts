export type Coin = {
  symbol: string;
  name: string;
};

export const COINS: Coin[] = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "BCH", name: "Bitcoin Cash" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "ATOM", name: "Cosmos" },
  { symbol: "ETC", name: "Ethereum Classic" },
  { symbol: "FIL", name: "Filecoin" },
  { symbol: "NEAR", name: "NEAR Protocol" },
  { symbol: "SUI", name: "Sui" },
];

// Illustrative holdings for the sample portfolio view — quantities only,
// no purchase ever happens, priced against the real live tickers.
export type MockPortfolioHolding = {
  symbol: string;
  amount: number;
};

export const MOCK_HOLDINGS: MockPortfolioHolding[] = [
  { symbol: "BTC", amount: 0.42 },
  { symbol: "ETH", amount: 3.1 },
  { symbol: "SOL", amount: 25 },
  { symbol: "LINK", amount: 140 },
];

export const MOCK_CASH_BALANCE = 8250.5;
