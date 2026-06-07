"use client";

import { useEffect, useState } from "react";
import { Eye, Sparkles } from "lucide-react";
import SourceBadge from "@/components/ui/SourceBadge";
import {
  formatChangePercent,
  formatPrice,
  mockMarketData,
} from "@/lib/mock-data";

interface LiveQuote {
  symbol: string;
  priceCents: number;
  changePercent: number;
}

/**
 * Landing Hero 行情预览 · 真数据版
 * 默认显示 mock 列表前 4 只，开机后异步用 Tushare 接口覆盖为真数据
 */
export default function HeroPreviewLive() {
  const initial = mockMarketData.slice(0, 4);
  const [quotes, setQuotes] = useState<LiveQuote[]>(
    initial.map((m) => ({
      symbol: m.symbol,
      priceCents: m.priceCents,
      changePercent: m.changePercent,
    })),
  );
  const [tradeDate, setTradeDate] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const symbols = initial.map((m) => m.symbol);

    Promise.all(
      symbols.map((s) =>
        fetch(`/api/market/quote?symbol=${s}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const valid = results.filter(Boolean) as LiveQuote[] & {
        tradeDate: string;
      }[];
      if (valid.length === 0) return;

      setQuotes(
        valid.map((q) => ({
          symbol: q.symbol,
          priceCents: q.priceCents,
          changePercent: q.changePercent,
        })),
      );
      const first = valid[0] as { tradeDate?: string };
      if (first?.tradeDate) setTradeDate(first.tradeDate);
      setLive(true);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-[var(--color-surface)]/70 backdrop-blur border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-elevated)] max-w-3xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="text-[var(--font-body-sm)] font-medium">
            示例标的 · 股票场景
          </span>
          {live && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-pill)] bg-[rgba(31,203,126,0.12)] border border-[rgba(31,203,126,0.3)] text-[var(--color-success)] text-[10px] font-mono uppercase tracking-wider">
              <span className="w-1 h-1 rounded-full bg-[var(--color-success)] pulse-dot" />
              Live
            </span>
          )}
        </div>
        <SourceBadge source="Tushare · 上交所/深交所" timestamp={tradeDate ?? "—"} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quotes.map((q) => {
          const mock = initial.find((m) => m.symbol === q.symbol);
          const up = q.changePercent >= 0;
          return (
            <div
              key={q.symbol}
              className="px-3 py-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)]"
            >
              <div className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono mb-1">
                {q.symbol}
              </div>
              <div className="text-[var(--font-body-sm)] font-medium mb-2">
                {mock?.name ?? q.symbol}
              </div>
              <div className="num font-mono text-[var(--font-body-lg)] font-semibold mb-0.5">
                ¥{formatPrice(q.priceCents)}
              </div>
              <div
                className="num text-[var(--font-micro)] font-mono"
                style={{
                  color: up ? "var(--color-up)" : "var(--color-down)",
                }}
              >
                {formatChangePercent(q.changePercent)}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[var(--font-micro)] text-[var(--color-text-subtle)] flex items-center gap-1.5">
        <Eye className="w-3 h-3" />
        行情数据来自 Tushare 公开接口，仅为演示，不构成投资建议
      </p>
    </div>
  );
}
