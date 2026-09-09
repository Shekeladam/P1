"use client";

import { useState } from "react";
import { PRESET_RANGES, type RangeSelection } from "@/lib/timeRanges";

type TimeRangeSelectorProps = {
  value: RangeSelection;
  onChange: (range: RangeSelection) => void;
};

function toDateInputValue(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(value.kind === "custom");
  const [startInput, setStartInput] = useState(() =>
    toDateInputValue(value.kind === "custom" ? value.startMs : Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endInput, setEndInput] = useState(() =>
    toDateInputValue(value.kind === "custom" ? value.endMs : Date.now())
  );
  const [customError, setCustomError] = useState("");

  function applyCustomRange() {
    const startMs = new Date(startInput).getTime();
    const endMs = new Date(endInput + "T23:59:59").getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      setCustomError("Enter valid dates.");
      return;
    }
    if (startMs >= endMs) {
      setCustomError("Start date must be before end date.");
      return;
    }
    setCustomError("");
    onChange({ kind: "custom", startMs, endMs });
  }

  const isCustomActive = value.kind === "custom";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_RANGES.map((r) => {
          const active = value.kind === "preset" && value.key === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setShowCustom(false);
                onChange({ kind: "preset", key: r.key });
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer border transition-colors ${
                active
                  ? "bg-amber-500 border-amber-500 text-black"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {r.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowCustom((s) => !s)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer border transition-colors ${
            isCustomActive
              ? "bg-amber-500 border-amber-500 text-black"
              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="date"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-zinc-100 outline-none focus:border-zinc-600"
          />
          <span className="text-zinc-500">to</span>
          <input
            type="date"
            value={endInput}
            onChange={(e) => setEndInput(e.target.value)}
            className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-zinc-100 outline-none focus:border-zinc-600"
          />
          <button
            type="button"
            onClick={applyCustomRange}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            Apply
          </button>
          {customError && <span className="text-red-500">{customError}</span>}
        </div>
      )}
    </div>
  );
}
