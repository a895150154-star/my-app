"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

export interface KlinePoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changePercent: number;
}

interface KlineChartProps {
  points: KlinePoint[];
  height?: number;
  className?: string;
}

/**
 * FIN AI · K 线图组件
 * 基于 TradingView lightweight-charts，主题对齐 DESIGN.md
 *
 * 颜色规则：A 股习惯（红涨绿跌），对齐 mock-data.ts
 */
export default function KlineChart({
  points,
  height = 320,
  className = "",
}: KlineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 初始化图表（只跑一次）
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#A8B2C8",
        fontFamily: "Inter, 'Noto Sans SC', sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: {
        borderColor: "#2A334D",
      },
      timeScale: {
        borderColor: "#2A334D",
        timeVisible: false,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(46,127,255,0.4)", style: 3 },
        horzLine: { color: "rgba(46,127,255,0.4)", style: 3 },
      },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      // A 股习惯：红涨绿跌
      upColor: "#E84B5F",
      downColor: "#1FCB7E",
      borderUpColor: "#E84B5F",
      borderDownColor: "#1FCB7E",
      wickUpColor: "#E84B5F",
      wickDownColor: "#1FCB7E",
    });
    seriesRef.current = series;

    // 响应式
    const ro = new ResizeObserver(() => {
      if (chartRef.current && el) {
        chartRef.current.applyOptions({ width: el.clientWidth });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // 数据更新（每次 points 变化）
  useEffect(() => {
    if (!seriesRef.current) return;
    const formatted = points.map((p) => ({
      time: p.time as Time,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    }));
    seriesRef.current.setData(formatted);
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  return <div ref={containerRef} className={className} />;
}
