"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { Coin } from "@/lib/coins";
import type { Candle, Ticker } from "@/lib/binance";
import { formatPrice } from "@/lib/format";

type PriceChartProps = {
  coin: Coin;
  candles: Candle[];
  ticker?: Ticker;
  rangeKey?: string;
  rangeLabel?: string;
};

export function PriceChart({ coin, candles, ticker, rangeKey, rangeLabel }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const hasFitContentRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      width: container.clientWidth,
      height: 360,
      timeScale: { timeVisible: true, borderColor: "#27272a" },
      rightPriceScale: { borderColor: "#27272a" },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;
    hasFitContentRef.current = false;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      color: "#3f3f46",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      visible: false,
    });
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [coin.symbol]);

  useEffect(() => {
    hasFitContentRef.current = false;
  }, [rangeKey]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries || candles.length === 0) return;

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as never,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time as never,
        value: c.volume,
        color: c.close >= c.open ? "#10b98166" : "#ef444466",
      }))
    );
    if (!hasFitContentRef.current) {
      chartRef.current?.timeScale().fitContent();
      hasFitContentRef.current = true;
    }
  }, [candles]);

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-sm font-medium text-zinc-300">{coin.symbol}/USDT</span>
        {ticker && (
          <span className="text-sm font-semibold text-zinc-100">
            ${formatPrice(ticker.lastPrice)}
          </span>
        )}
        <span className="text-xs text-zinc-500">{rangeLabel ?? "1H candles"} · live from Binance</span>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
