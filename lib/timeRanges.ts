// Shared between the client (button labels) and the server (candle
// interval/limit selection) so both sides agree on what each preset means.

export type PresetRangeKey = "1h" | "12h" | "1d" | "1mo" | "1y" | "all";

export const PRESET_RANGES: { key: PresetRangeKey; label: string }[] = [
  { key: "1h", label: "1H" },
  { key: "12h", label: "12H" },
  { key: "1d", label: "1D" },
  { key: "1mo", label: "1M" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
];

export type RangeSelection =
  | { kind: "preset"; key: PresetRangeKey }
  | { kind: "custom"; startMs: number; endMs: number };

export const DEFAULT_RANGE: RangeSelection = { kind: "preset", key: "1d" };

export function rangeKeyOf(range: RangeSelection): string {
  return range.kind === "preset" ? range.key : `custom:${range.startMs}-${range.endMs}`;
}

export function labelForRange(range: RangeSelection): string {
  if (range.kind === "preset") {
    return PRESET_RANGES.find((r) => r.key === range.key)?.label ?? range.key;
  }
  const fmt = (ms: number) => new Date(ms).toLocaleDateString();
  return `${fmt(range.startMs)} – ${fmt(range.endMs)}`;
}

type CandleParams = { interval: string; limit: number };

const PRESET_TO_PARAMS: Record<PresetRangeKey, CandleParams> = {
  "1h": { interval: "1m", limit: 60 },
  "12h": { interval: "5m", limit: 144 },
  "1d": { interval: "15m", limit: 96 },
  "1mo": { interval: "4h", limit: 180 },
  "1y": { interval: "1d", limit: 365 },
  all: { interval: "1w", limit: 500 },
};

export function candleParamsForPreset(key: PresetRangeKey): CandleParams {
  return PRESET_TO_PARAMS[key] ?? PRESET_TO_PARAMS["1d"];
}

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export function candleParamsForCustomRange(
  startMs: number,
  endMs: number
): CandleParams & { startTime: number; endTime: number } {
  const spanMs = Math.max(0, endMs - startMs);
  let interval: string;
  if (spanMs <= DAY_MS) interval = "15m";
  else if (spanMs <= 7 * DAY_MS) interval = "1h";
  else if (spanMs <= 90 * DAY_MS) interval = "4h";
  else if (spanMs <= 365 * DAY_MS) interval = "1d";
  else interval = "1w";
  return { interval, limit: 1000, startTime: startMs, endTime: endMs };
}
