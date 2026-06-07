import Link from "next/link";
import MarketCard from "@/components/MarketCard";
import KnowledgeCard from "@/components/KnowledgeCard";
import { mockMarketData, mockKnowledgeItems } from "@/lib/mock-data";

export default function Home() {
  const totalChange = mockMarketData.reduce((acc, d) => acc + d.changePercent, 0);
  const avgChange = totalChange / mockMarketData.length;
  const upCount = mockMarketData.filter((d) => d.changeCents > 0).length;
  const downCount = mockMarketData.filter((d) => d.changeCents < 0).length;
  const totalVolume = mockMarketData.reduce((acc, d) => acc + d.volume, 0);
  const totalVolumeWan = (totalVolume / 10000).toFixed(1);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative px-10 py-16">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--accent-glow)] border border-[var(--accent)]/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold">
                Live · Agent Loop Active
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[var(--foreground-dim)]">
              · 2026-05-23
            </span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-white mb-4 leading-[1.05] max-w-3xl">
            分析师能力，
            <span className="gradient-hero">AI 化交付。</span>
          </h1>
          <p className="text-base text-[var(--foreground-muted)] max-w-2xl leading-relaxed mb-8">
            基于 Agent Loop 架构的金融研究智能体。多步推理 · 多源数据 · 自主验证。
            让每一位散户都能随时获取首席分析师级别的研判能力。
          </p>

          <div className="flex items-center gap-3 mb-12">
            <Link
              href="/chat"
              className="group inline-flex items-center gap-2 px-5 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--background)] text-sm font-semibold rounded-lg transition-all"
            >
              发起 AI 研究
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
              </svg>
            </Link>
            <Link
              href="/market"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-white text-sm font-medium rounded-lg transition-all"
            >
              查看实时行情
            </Link>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
            <StatBlock
              label="Market Sentiment"
              value={avgChange >= 0 ? "偏多" : "偏空"}
              detail={`AVG ${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
              accent={avgChange >= 0 ? "success" : "danger"}
            />
            <StatBlock
              label="Active Contracts"
              value={mockMarketData.length.toString()}
              detail={`${upCount} UP · ${downCount} DOWN`}
            />
            <StatBlock
              label="Total Volume"
              value={`${totalVolumeWan}万`}
              detail="今日累计成交"
            />
            <StatBlock
              label="Agent Latency"
              value="24ms"
              detail="5-STEP LOOP"
              accent="accent"
            />
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section className="px-10 py-12 border-b border-[var(--border)]">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold mb-2">
              · 01 ·  REAL-TIME MARKETS
            </p>
            <h2 className="text-2xl font-bold text-white">实时行情速览</h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              东北亚镁质交易所 · 主流镁质材料合约
            </p>
          </div>
          <Link
            href="/market"
            className="text-xs text-[var(--accent)] hover:text-white transition-colors uppercase tracking-widest"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockMarketData.slice(0, 6).map((data) => (
            <MarketCard key={data.symbol} data={data} />
          ))}
        </div>
      </section>

      {/* Knowledge Section */}
      <section className="px-10 py-12 border-b border-[var(--border)]">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold mb-2">
              · 02 ·  ANALYST INTELLIGENCE
            </p>
            <h2 className="text-2xl font-bold text-white">分析师研判</h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              研报 · 舆情 · 操作策略 · 风险预警
            </p>
          </div>
          <Link
            href="/knowledge"
            className="text-xs text-[var(--accent)] hover:text-white transition-colors uppercase tracking-widest"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockKnowledgeItems.slice(0, 4).map((item) => (
            <KnowledgeCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Architecture Section */}
      <section className="px-10 py-12">
        <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold mb-2">
          · 03 ·  AGENT LOOP ARCHITECTURE
        </p>
        <h2 className="text-2xl font-bold text-white mb-1">5 步闭环研究流程</h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-8">
          每一步都自校验质量，不合格则回溯重做，确保研究结论可追溯、可信赖
        </p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
          {[
            { n: "01", t: "拉取行情数据", d: "实时行情 · 历史数据" },
            { n: "02", t: "检索舆情研报", d: "向量化知识库" },
            { n: "03", t: "综合研判分析", d: "多步推理链" },
            { n: "04", t: "事实校验", d: "置信度评估" },
            { n: "05", t: "生成结论", d: "结构化输出" },
          ].map((step) => (
            <div key={step.n} className="bg-[var(--surface)] p-5">
              <p className="text-[10px] font-mono text-[var(--accent)] mb-3">STEP {step.n}</p>
              <p className="text-sm font-semibold text-white mb-1">{step.t}</p>
              <p className="text-[10px] text-[var(--foreground-dim)] uppercase tracking-wider">
                {step.d}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatBlock({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "success" | "danger" | "accent";
}) {
  const accentColor =
    accent === "success"
      ? "text-[var(--success)]"
      : accent === "danger"
        ? "text-[var(--danger)]"
        : accent === "accent"
          ? "text-[var(--accent)]"
          : "text-white";

  return (
    <div className="bg-[var(--surface)] p-5">
      <p className="text-[10px] uppercase tracking-widest text-[var(--foreground-dim)] font-semibold mb-2">
        {label}
      </p>
      <p className={`text-3xl font-bold tracking-tight ${accentColor}`}>{value}</p>
      <p className="text-[10px] text-[var(--foreground-muted)] mt-2 uppercase tracking-wider font-mono">
        {detail}
      </p>
    </div>
  );
}
