"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  children: ReactNode;
}

/**
 * FIN AI · 右侧 Drawer 抽屉
 * 用于左栏图书馆各类的弹出展示（不打断 workspace 主流）
 */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  width = 480,
  children,
}: DrawerProps) {
  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 锁定 body 滚动
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <>
      {/* 遮罩 */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-[var(--duration-base)] ${
          open
            ? "bg-black/40 backdrop-blur-sm opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* 抽屉本体 */}
      <aside
        className={`fixed top-0 right-0 h-screen z-[61] bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-[var(--shadow-deep)] transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)] flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: `min(${width}px, 90vw)` }}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-divider)] shrink-0">
          <div className="leading-tight">
            <h2 className="text-[var(--font-h4)] font-medium">{title}</h2>
            {subtitle && (
              <p className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono uppercase tracking-wider mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
      </aside>
    </>
  );
}
