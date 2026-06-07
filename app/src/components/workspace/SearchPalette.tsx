"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Search,
  X,
  LineChart,
  FileText,
  PencilLine,
  Users,
  Wallet,
} from "lucide-react";
import { searchStocks, type StockEntry } from "@/lib/stock-list";
import type { WidgetKind } from "@/lib/workspace-store";

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
  onPick: (symbol: string, name: string, widget?: WidgetKind) => void;
}

const WIDGET_CHOICES: { kind: WidgetKind; label: string; icon: typeof LineChart }[] = [
  { kind: "quote_card", label: "行情", icon: Activity },
  { kind: "valuation", label: "估值", icon: Wallet },
  { kind: "kline", label: "K 线", icon: LineChart },
  { kind: "fundamental", label: "财报", icon: FileText },
  { kind: "holders", label: "股东", icon: Users },
  { kind: "research", label: "研判", icon: PencilLine },
];

export default function SearchPalette({ open, onClose, onPick }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredStock, setHoveredStock] = useState<StockEntry | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchStocks(query, 12);

  // 打开时聚焦输入框 + 重置状态
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
      setQuery("");
      setActiveIndex(0);
      setHoveredStock(null);
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  // 键盘导航
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = hoveredStock ?? results[activeIndex];
        if (target) {
          onPick(target.symbol, target.name);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, activeIndex, hoveredStock, onPick, onClose]);

  // 锁滚动
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-[15vh] -translate-x-1/2 z-[71] w-[min(640px,92vw)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-[var(--radius-lg)] shadow-[var(--shadow-deep)] overflow-hidden"
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-divider)]">
          <Search className="w-4 h-4 text-[var(--color-text-subtle)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
              setHoveredStock(null);
            }}
            placeholder="输入股票代码、名称或拼音（如 600519 / 茅台 / GZMT）"
            className="flex-1 bg-transparent text-[var(--font-body)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-subtle)]">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
          {results.length === 0 && query.trim() && (
            <div className="px-5 py-12 text-center text-[var(--color-text-muted)] text-[var(--font-body-sm)]">
              <p>没找到匹配的股票</p>
              <p className="text-[var(--font-micro)] text-[var(--color-text-subtle)] mt-1">
                目前 MVP 名单仅含 50+ 大盘股，未来接 Tushare 全市场
              </p>
            </div>
          )}

          {results.length === 0 && !query.trim() && (
            <div className="px-5 py-10 text-[var(--font-body-sm)] text-[var(--color-text-muted)]">
              <p className="mb-3 text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono">
                热门搜索
              </p>
              <div className="flex flex-wrap gap-2">
                {["贵州茅台", "宁德时代", "比亚迪", "中芯国际", "中国平安"].map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setQuery(n)}
                      className="px-3 py-1.5 rounded-[var(--radius-pill)] text-[var(--font-body-sm)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text)] transition-colors"
                    >
                      {n}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {results.map((stock, idx) => {
            const active = idx === activeIndex || hoveredStock?.symbol === stock.symbol;
            return (
              <div
                key={stock.symbol}
                onMouseEnter={() => {
                  setActiveIndex(idx);
                  setHoveredStock(stock);
                }}
                className={`px-5 py-3 border-b border-[var(--color-divider)] last:border-b-0 cursor-pointer transition-colors ${
                  active ? "bg-[var(--color-accent-soft)]" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="num font-mono text-[var(--font-body-sm)] text-[var(--color-text-subtle)] w-16 shrink-0">
                    {stock.symbol}
                  </span>
                  <span className="text-[var(--font-body)] font-medium text-[var(--color-text)] flex-1 truncate">
                    {stock.name}
                  </span>
                  {stock.industry && (
                    <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono">
                      {stock.industry}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 pl-19" style={{ paddingLeft: "5rem" }}>
                  <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] mr-1">
                    打开：
                  </span>
                  {WIDGET_CHOICES.map((w) => (
                    <button
                      key={w.kind}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPick(stock.symbol, stock.name, w.kind);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[var(--font-micro)] bg-[var(--color-surface-2)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-text-muted)] transition-colors"
                    >
                      <w.icon className="w-3 h-3" />
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-5 py-2.5 border-t border-[var(--color-divider)] text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono">
          <span>↑↓ 导航 · Enter 默认 K 线 · ESC 关闭</span>
          <span>{results.length} 项</span>
        </div>
      </div>
    </>
  );
}
