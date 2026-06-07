"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "概览", sublabel: "Overview", icon: OverviewIcon },
  { href: "/chat", label: "AI 研究助手", sublabel: "Research", icon: ChatIcon },
  { href: "/market", label: "行情数据", sublabel: "Markets", icon: MarketIcon },
  { href: "/knowledge", label: "知识库", sublabel: "Knowledge", icon: KnowledgeIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
      <Link href="/" className="block px-6 py-6 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)]/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center font-bold text-[var(--background)] text-sm">
            F
          </div>
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight leading-tight">
              FIN AI
            </h1>
            <p className="text-[10px] text-[var(--foreground-dim)] uppercase tracking-widest">
              Research Intelligence
            </p>
          </div>
        </div>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-[var(--accent-glow)] text-[var(--accent)]"
                  : "text-[var(--foreground-muted)] hover:bg-[var(--surface-elevated)] hover:text-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-[var(--accent)]" : "text-[var(--foreground-dim)] group-hover:text-white"
                }`}
              />
              <div className="flex-1">
                <div className="text-sm font-medium leading-tight">{item.label}</div>
                <div className="text-[10px] text-[var(--foreground-dim)] uppercase tracking-wider mt-0.5">
                  {item.sublabel}
                </div>
              </div>
              {isActive && <div className="w-1 h-1 rounded-full bg-[var(--accent)]" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[var(--border)] space-y-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-[10px] text-[var(--foreground-dim)] hover:text-[var(--accent)] uppercase tracking-widest transition-colors"
        >
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
          </svg>
          返回介绍页
        </Link>
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="text-[10px] text-[var(--foreground-dim)] uppercase tracking-widest">
              System Status
            </span>
          </div>
          <p className="text-xs text-white font-medium">Agent Loop Ready</p>
          <p className="text-[10px] text-[var(--foreground-dim)] mt-0.5">
            延迟 24ms · 5 步循环
          </p>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-[var(--foreground-dim)]">v1.0.0</span>
          <span className="text-[10px] text-[var(--foreground-dim)]">© 东北亚镁交所</span>
        </div>
      </div>
    </aside>
  );
}

function OverviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path d="M3 3h6v8H3V3zm0 10h6v4H3v-4zm8-10h6v4h-6V3zm0 6h6v8h-6V9z" fill="currentColor" />
    </svg>
  );
}
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2a8 8 0 00-8 8c0 1.5.4 2.9 1.1 4.1L2 18l3.9-1.1A8 8 0 1010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"
        fill="currentColor"
      />
    </svg>
  );
}
function MarketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path d="M2 16h2V8H2v8zm4 0h2V4H6v12zm4 0h2v-6h-2v6zm4 0h2V11h-2v5zm4 0h2V2h-2v14z" fill="currentColor" />
    </svg>
  );
}
function KnowledgeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path
        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm2 4h8v2H6V7zm0 4h8v2H6v-2z"
        fill="currentColor"
      />
    </svg>
  );
}
