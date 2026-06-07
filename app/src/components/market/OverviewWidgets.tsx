"use client";

/**
 * FIN AI · 概述页 widget 三件套
 *
 * - QuoteCardWidget       行情卡（现价 + 涨跌 + 量比 + 换手率 + 振幅）
 * - ValuationCardWidget   估值卡（PE / PB / PS / 市值 / 股息率）
 * - HoldersWidget         股东结构（前 10 流通股东）
 *
 * 这三个共用 useEffect+fetch 的模式，错误态展示一致
 */

import { useEffect, useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Loader2,
  Users,
  Wallet,
} from "lucide-react";
import { findStock } from "@/lib/stock-list";
import OpenBBCardHeader from "@/components/workspace/OpenBBCardHeader";

// ============================================================
// 共用：loading / error skeleton
// ============================================================
import type { LucideIcon } from "lucide-react";
function CardShell({
  icon,
  label,
  symbolName,
  timestamp,
  children,
}: {
  icon: LucideIcon;
  label: string;
  symbolName?: string;
  timestamp?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <OpenBBCardHeader
        icon={icon}
        label={label}
        symbolName={symbolName}
        timestamp={timestamp}
      />
      <div className="flex-1 p-3 overflow-auto scrollbar-thin">{children}</div>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  // 把又长又啰嗦的错误压成一句话
  const isRateLimit = message.includes("频率超限");
  const concise = isRateLimit
    ? "Tushare 接口限频 · 稍候再试"
    : message.length > 40
      ? message.slice(0, 36) + "…"
      : message;
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-1.5 py-3">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-subtle)]">
        ⏱
      </span>
      <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] font-medium">
        暂不可用
      </p>
      <p
        className="text-[10px] text-[var(--color-text-subtle)] font-mono leading-tight max-w-[180px]"
        title={message}
      >
        {concise}
      </p>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="grid place-items-center py-6 text-[var(--color-text-subtle)]">
      <Loader2 className="w-4 h-4 animate-spin" />
    </div>
  );
}

// ============================================================
// QuoteCardWidget
// ============================================================
interface QuoteCardData {
  symbol: string;
  tradeDate: string;
  priceCents: number;
  changeCents: number;
  changePercent: number;
  amplitudePercent: number;
  turnoverRate: number | null;
  volumeRatio: number | null;
  volume: number;
  amount: number;
  source: string;
}

export function QuoteCardWidget({ symbol }: { symbol: string }) {
  const stockName = findStock(symbol)?.name ?? symbol;
  const [data, setData] = useState<QuoteCardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      setData(null);
      try {
        const res = await fetch(`/api/market/quote-card?symbol=${symbol}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
        if (!cancelled) setData(json as QuoteCardData);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "拉取失败");
      }
    };
    queueMicrotask(load);
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <CardShell
      icon={Activity}
      label="实时行情"
      symbolName={stockName}
      timestamp={data?.tradeDate}
    >
      {!data && !error && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}
      {data && (
        <div className="space-y-2.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="num font-mono text-[28px] leading-none font-semibold tabular-nums"
              style={{
                color:
                  data.changeCents >= 0
                    ? "var(--color-up)"
                    : "var(--color-down)",
              }}
            >
              ¥{(data.priceCents / 100).toFixed(2)}
            </span>
            <span
              className="num font-mono text-[var(--font-body-sm)] font-medium tabular-nums flex items-center gap-0.5"
              style={{
                color:
                  data.changeCents >= 0
                    ? "var(--color-up)"
                    : "var(--color-down)",
              }}
            >
              {data.changeCents >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {data.changeCents >= 0 ? "+" : ""}
              {(data.changeCents / 100).toFixed(2)}
              {" "}
              ({data.changeCents >= 0 ? "+" : ""}
              {data.changePercent.toFixed(2)}%)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-2 border-t border-[var(--color-divider)]">
            <Metric label="振幅" value={`${data.amplitudePercent.toFixed(2)}%`} />
            <Metric
              label="换手率"
              value={
                data.turnoverRate != null
                  ? `${data.turnoverRate.toFixed(2)}%`
                  : "—"
              }
            />
            <Metric
              label="量比"
              value={data.volumeRatio != null ? data.volumeRatio.toFixed(2) : "—"}
            />
            <Metric label="成交额" value={`${(data.amount / 1e5).toFixed(1)} 亿`} />
          </div>
        </div>
      )}
    </CardShell>
  );
}

// ============================================================
// ValuationCardWidget
// ============================================================
interface ValuationData {
  symbol: string;
  tradeDate: string;
  pe: number | null;
  peTtm: number | null;
  pb: number | null;
  ps: number | null;
  psTtm: number | null;
  dvRatio: number | null;
  dvTtm: number | null;
  totalMv: number | null;
  circMv: number | null;
  totalShare: number | null;
  floatShare: number | null;
  source: string;
}

export function ValuationCardWidget({ symbol }: { symbol: string }) {
  const stockName = findStock(symbol)?.name ?? symbol;
  const [data, setData] = useState<ValuationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      setData(null);
      try {
        const res = await fetch(`/api/market/valuation?symbol=${symbol}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
        if (!cancelled) setData(json as ValuationData);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "拉取失败");
      }
    };
    queueMicrotask(load);
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <CardShell
      icon={Wallet}
      label="估值与市值"
      symbolName={stockName}
      timestamp={data?.tradeDate}
    >
      {!data && !error && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}
      {data && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          <Metric label="市盈率 PE" value={fmtNum(data.pe)} />
          <Metric label="市盈率 TTM" value={fmtNum(data.peTtm)} />
          <Metric label="市净率 PB" value={fmtNum(data.pb)} />
          <Metric label="市销率 PS" value={fmtNum(data.ps)} />
          <Metric label="股息率" value={fmtPct(data.dvRatio)} />
          <Metric label="股息率 TTM" value={fmtPct(data.dvTtm)} />
          <Metric label="总市值" value={fmtCny(data.totalMv)} />
          <Metric label="流通市值" value={fmtCny(data.circMv)} />
        </div>
      )}
    </CardShell>
  );
}

// ============================================================
// HoldersWidget
// ============================================================
interface HoldersData {
  symbol: string;
  endDate: string;
  holders: {
    holderName: string;
    holdAmount: number | null;
    holdRatio: number | null;
    holdChange: number | null;
  }[];
  source: string;
}

export function HoldersWidget({ symbol }: { symbol: string }) {
  const stockName = findStock(symbol)?.name ?? symbol;
  const [data, setData] = useState<HoldersData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      setData(null);
      try {
        const res = await fetch(`/api/market/holders?symbol=${symbol}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
        if (!cancelled) setData(json as HoldersData);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "拉取失败");
      }
    };
    queueMicrotask(load);
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <CardShell
      icon={Users}
      label="前 10 大流通股东"
      symbolName={stockName}
      timestamp={data?.endDate}
    >
      {!data && !error && <LoadingBlock />}
      {error && <ErrorBlock message={error} />}
      {data && (
        <div className="space-y-1">
          {data.holders.length === 0 && (
            <div className="text-[var(--font-body-sm)] text-[var(--color-text-muted)]">
              暂无数据
            </div>
          )}
          {data.holders.map((h, i) => {
            const change = h.holdChange ?? 0;
            const changeLabel =
              change > 0
                ? `↑${fmtShareChange(Math.abs(change))}`
                : change < 0
                  ? `↓${fmtShareChange(Math.abs(change))}`
                  : "";
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[var(--font-body-sm)] py-0.5"
                title={`${h.holderName}${changeLabel ? ` · ${change > 0 ? "增持" : "减持"} ${fmtShareChange(Math.abs(change))}` : ""}`}
              >
                <span className="text-[10px] text-[var(--color-text-subtle)] font-mono w-4 shrink-0 tabular-nums">
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 truncate text-[var(--font-body-sm)]">
                  {h.holderName}
                </span>
                <span className="num font-mono text-[var(--color-text)] shrink-0 tabular-nums text-[var(--font-body-sm)]">
                  {h.holdRatio != null ? `${h.holdRatio.toFixed(2)}%` : "—"}
                </span>
                {change !== 0 && (
                  <span
                    className="num font-mono text-[10px] shrink-0 tabular-nums w-3 text-center"
                    style={{
                      color:
                        change > 0 ? "var(--color-up)" : "var(--color-down)",
                    }}
                    title={`${change > 0 ? "增持" : "减持"} ${fmtShareChange(Math.abs(change))}`}
                  >
                    {change > 0 ? "▲" : "▼"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}

// ============================================================
// formatter helpers
// ============================================================
function Metric({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono">
        {label}
      </span>
      <span
        className={`text-[var(--font-body-sm)] font-medium leading-none tabular-nums num text-[var(--color-text)] ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function fmtNum(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n < 0) return "亏损";
  return n.toFixed(2);
}

function fmtPct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function fmtCny(yuan: number | null): string {
  if (yuan == null || Number.isNaN(yuan)) return "—";
  const abs = Math.abs(yuan);
  if (abs >= 1e12) return `${(yuan / 1e12).toFixed(2)} 万亿`;
  if (abs >= 1e8) return `${(yuan / 1e8).toFixed(1)} 亿`;
  if (abs >= 1e4) return `${(yuan / 1e4).toFixed(1)} 万`;
  return yuan.toFixed(0);
}

function fmtShareChange(shares: number): string {
  const abs = Math.abs(shares);
  if (abs >= 1e8) return `${(shares / 1e8).toFixed(2)} 亿股`;
  if (abs >= 1e4) return `${(shares / 1e4).toFixed(1)} 万股`;
  return `${shares} 股`;
}
