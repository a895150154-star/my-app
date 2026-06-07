"use client";

import { useState } from "react";
import KnowledgeCard from "@/components/KnowledgeCard";
import { mockKnowledgeItems } from "@/lib/mock-data";
import { KnowledgeItem } from "@/types";

type FilterCategory = "all" | KnowledgeItem["category"];

const filters: { value: FilterCategory; label: string; count?: number }[] = [
  { value: "all", label: "All" },
  { value: "research", label: "Research" },
  { value: "sentiment", label: "Sentiment" },
  { value: "strategy", label: "Strategy" },
  { value: "alert", label: "Alert" },
];

export default function KnowledgePage() {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [search, setSearch] = useState("");

  const filtered = mockKnowledgeItems.filter((item) => {
    const matchCategory = filter === "all" || item.category === filter;
    const matchSearch =
      !search ||
      item.title.includes(search) ||
      item.content.includes(search) ||
      item.tags.some((t) => t.includes(search));
    return matchCategory && matchSearch;
  });

  const counts = {
    all: mockKnowledgeItems.length,
    research: mockKnowledgeItems.filter((i) => i.category === "research").length,
    sentiment: mockKnowledgeItems.filter((i) => i.category === "sentiment").length,
    strategy: mockKnowledgeItems.filter((i) => i.category === "strategy").length,
    alert: mockKnowledgeItems.filter((i) => i.category === "alert").length,
  };

  return (
    <div>
      <header className="px-10 py-10 border-b border-[var(--border)] bg-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-glow opacity-50" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold mb-2">
            ANALYST INTELLIGENCE
          </p>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">知识库</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            分析师研判 · 舆情追踪 · 操作策略 · 风险预警 · 共 {mockKnowledgeItems.length} 条
          </p>
        </div>
      </header>

      <section className="px-10 py-8 sticky top-0 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] z-10">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题、内容或标签..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[var(--foreground-dim)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  filter === f.value
                    ? "bg-[var(--accent)] text-[var(--background)]"
                    : "text-[var(--foreground-muted)] hover:text-white"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] font-mono ${
                    filter === f.value ? "opacity-70" : "text-[var(--foreground-dim)]"
                  }`}
                >
                  {counts[f.value]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-10 py-10">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <KnowledgeCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[var(--foreground-dim)]" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">未找到符合条件的内容</p>
          </div>
        )}
      </section>
    </div>
  );
}
