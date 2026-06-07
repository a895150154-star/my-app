"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useNavbarScroll } from "@/lib/scroll-reveal";

export default function NavBar() {
  useNavbarScroll();
  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50 px-6 lg:px-10 py-4 backdrop-blur-md border-b border-[var(--color-divider)] bg-[rgba(10,14,26,0.72)] transition-all duration-[var(--duration-base)]">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-accent)] to-[#6b5aff] text-white font-semibold text-sm">
            FA
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[var(--font-body-sm)] font-semibold text-[var(--color-text)] tracking-tight">
              FIN AI
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)] font-mono">
              A-Share Research
            </span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <a
            href="#why"
            className="navbar-link px-3 py-2 text-[var(--font-body-sm)] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[var(--radius-sm)] transition-colors"
          >
            为什么需要
          </a>
          <a
            href="#workspace"
            className="navbar-link px-3 py-2 text-[var(--font-body-sm)] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[var(--radius-sm)] transition-colors"
          >
            工作台
          </a>
          <a
            href="#agent"
            className="navbar-link px-3 py-2 text-[var(--font-body-sm)] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[var(--radius-sm)] transition-colors"
          >
            Agent 推理
          </a>
          <a
            href="#trust"
            className="navbar-link px-3 py-2 text-[var(--font-body-sm)] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-[var(--radius-sm)] transition-colors"
          >
            合规与信任
          </a>
        </div>

        <Link
          href="/demo"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-[var(--font-body-sm)] font-medium transition-all hover:-translate-y-px hover:shadow-[var(--shadow-elevated)]"
        >
          看 Demo
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <style jsx>{`
        :global(.navbar.scrolled) {
          background: rgba(10, 14, 26, 0.92) !important;
          box-shadow: var(--shadow-ambient);
        }
      `}</style>
    </nav>
  );
}
