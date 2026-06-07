"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  CircleDot,
  Database,
  Eye,
  FileText,
  LineChart,
  Loader2,
  Newspaper,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfidenceBadge from "@/components/ui/ConfidenceBadge";
import SourceBadge from "@/components/ui/SourceBadge";
import SectionLabel from "@/components/ui/SectionLabel";
import {
  formatChangePercent,
  formatPrice,
  mockCommodityData,
  mockMarketData,
} from "@/lib/mock-data";

type Scene = "equity" | "commodity";

interface SceneConfig {
  label: string;
  badge: string;
  subject: string;
  queries: string[];
  symbol: string;
  symbolName: string;
  symbolCode: string;
  priceCents: number;
  changePercent: number;
  source: string;
  volumeText: string;
  fundamental: { label: string; value: string; detail?: string; tone?: "up" | "down" }[];
  news: { date: string; tone: "positive" | "neutral" | "negative"; text: string }[];
  peerLabel: string;
  summary: string;
  reasoningPath: string[];
}

const SCENES: Record<Scene, SceneConfig> = {
  equity: {
    label: "A 股股票",
    badge: "上交所 / 深交所",
    subject: "贵州茅台 600519",
    queries: [
      "贵州茅台当下值得长期持有吗？",
      "宁德时代海外建厂会怎么影响股价？",
      "比亚迪今天放量上涨能追吗？",
      "降准对金融板块影响有多大？",
    ],
    symbol: "600519",
    symbolName: "贵州茅台",
    symbolCode: "600519",
    priceCents: 168500,
    changePercent: 0.75,
    source: "上交所",
    volumeText: "86.4 亿",
    fundamental: [
      { label: "营业收入", value: "514 亿", detail: "同比 +18.0%", tone: "up" },
      { label: "归母净利", value: "268 亿", detail: "同比 +16.2%", tone: "up" },
      { label: "毛利率", value: "92.4%", detail: "环比 +0.3pct" },
      { label: "PE-TTM", value: "28.6", detail: "近 5 年 30% 分位" },
    ],
    news: [
      { date: "05-21", tone: "positive", text: "中金重申买入评级，目标价上调至 1850 元" },
      { date: "05-18", tone: "neutral", text: "公司公告：拟回购公司股份用于员工持股计划" },
      { date: "05-12", tone: "negative", text: "白酒板块情绪走弱，多只龙头下跌" },
      { date: "04-28", tone: "positive", text: "Q1 财报发布，营收净利双双超预期" },
    ],
    peerLabel: "白酒板块 · 同业横向对比",
    summary: "中长期持有逻辑成立，短期受板块情绪影响存在波动。本结论仅供参考，请结合自身风险偏好判断，不构成投资建议。",
    reasoningPath: [
      "拉取近 12 个月行情与财报",
      "检索 8 份卖方研报，提取核心观点",
      "扫描近 30 天舆情与公告",
      "横向比较白酒板块 5 只龙头",
      "事实校验：与原文相似度 ≥ 0.78",
      "生成结构化结论 · 置信度 72%",
    ],
  },
  commodity: {
    label: "现货商品",
    badge: "东北亚镁质交易所",
    subject: "镁合金 MG2406",
    queries: [
      "镁合金 MG2406 现在还能拿吗？",
      "氧化镁停产消息属实吗？影响多大？",
      "氯化镁今天异动该追还是观望？",
      "下周环保督查对镁产业链冲击多大？",
    ],
    symbol: "MG2406",
    symbolName: "镁合金 2406",
    symbolCode: "MG2406",
    priceCents: 1685000,
    changePercent: 0.75,
    source: "东北亚镁质交易所",
    volumeText: "3.48 万手",
    fundamental: [
      { label: "现货均价", value: "¥16,850/吨", detail: "周环比 +1.2%", tone: "up" },
      { label: "持仓量", value: "12.4 万手", detail: "环比 +5.6%" },
      { label: "库存", value: "8.2 万吨", detail: "环比 -3.1%", tone: "up" },
      { label: "基差", value: "+45", detail: "现货贴水收窄" },
    ],
    news: [
      { date: "05-21", tone: "negative", text: "海城地区氧化镁企业停产整顿，影响产能 8 万吨/年" },
      { date: "05-20", tone: "positive", text: "首席分析师周报：偏多研判，关注环保督查进展" },
      { date: "05-18", tone: "neutral", text: "镁产业链上游原料供给收缩，下游需求平稳" },
      { date: "05-15", tone: "positive", text: "下游汽车板厂集中补库，镁合金现货成交活跃" },
    ],
    peerLabel: "镁产业链 · 同期合约对比",
    summary: "镁合金中短期价格有望维持 16500-17200 区间震荡，关注环保督查进展。本研判仅供参考，不构成交易建议。",
    reasoningPath: [
      "拉取近 6 个月现货与持仓数据",
      "检索 3 份首席分析师周报，提取观点",
      "扫描近 30 天产业链舆情与库存",
      "横向比较镁产业链同期合约",
      "事实校验：与原文相似度 ≥ 0.81",
      "生成结构化结论 · 置信度 74%",
    ],
  },
};

type StepStatus = "pending" | "running" | "done";

interface ReasoningStep {
  id: string;
  icon: typeof Database;
  title: string;
  detail: string;
  status: StepStatus;
}

const STEPS_TEMPLATE: Omit<ReasoningStep, "status">[] = [
  {
    id: "fetch",
    icon: Database,
    title: "拉取行情",
    detail: "近 12 个月 K 线 · 资金流向 · 板块联动",
  },
  {
    id: "search",
    icon: Newspaper,
    title: "检索舆情",
    detail: "8 份卖方研报 · 30 天公告 · 财联社时间线",
  },
  {
    id: "analyze",
    icon: Brain,
    title: "多步推理",
    detail: "拆解 4 个子任务 · 横向对比同业 5 只",
  },
  {
    id: "verify",
    icon: Eye,
    title: "事实校验",
    detail: "结论与原文相似度 0.78 · 通过阈值",
  },
  {
    id: "generate",
    icon: Sparkles,
    title: "生成结论",
    detail: "结构化输出 · 标注置信度与数据源",
  },
];

export default function DemoPage() {
  const [scene, setScene] = useState<Scene>("equity");
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  const config = SCENES[scene];

  const switchScene = (next: Scene) => {
    if (next === scene) return;
    setScene(next);
    setQuery("");
    setRunning(false);
    setCompleted(false);
    setActiveStep(-1);
  };

  const steps: ReasoningStep[] = STEPS_TEMPLATE.map((s, idx) => ({
    ...s,
    status: completed
      ? "done"
      : idx < activeStep
        ? "done"
        : idx === activeStep
          ? "running"
          : "pending",
  }));

  const startDemo = (q: string) => {
    setQuery(q);
    setRunning(true);
    setCompleted(false);
    setActiveStep(0);
  };

  // 步骤推进
  if (running && activeStep >= 0 && activeStep < STEPS_TEMPLATE.length) {
    setTimeout(() => {
      if (activeStep === STEPS_TEMPLATE.length - 1) {
        setCompleted(true);
        setRunning(false);
      } else {
        setActiveStep((s) => s + 1);
      }
    }, 900);
  }

  const reset = () => {
    setQuery("");
    setRunning(false);
    setCompleted(false);
    setActiveStep(-1);
  };

  return (
    <main className="relative min-h-screen text-[var(--color-text)] overflow-x-hidden">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[rgba(10,14,26,0.82)] border-b border-[var(--color-divider)]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--font-body-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] pulse-dot" />
            <span className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono">
              Live Demo · 数据仅为演示
            </span>
          </div>
        </div>
      </header>

      <div className="relative">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute inset-0 bg-grid-soft opacity-40 pointer-events-none" />

        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
          {/* Hero */}
          <div className="max-w-2xl mb-8">
            <SectionLabel>FIN AI · LIVE DEMO</SectionLabel>
            <h1 className="text-[28px] lg:text-[40px] leading-[1.15] tracking-[-0.02em] font-medium mb-4">
              一套 Agent Loop，
              <span className="text-gradient-brand">应对股票与现货两类标的。</span>
            </h1>
            <p className="text-[var(--color-text-muted)] leading-relaxed">
              选场景、问问题，看同一套流程怎么处理不同市场的研究任务。
              每条结论都附置信度与数据源，AI 不会替你做决策。
            </p>
          </div>

          {/* 场景切换 */}
          <div className="mb-8 inline-flex items-center gap-1 p-1 rounded-[var(--radius-pill)] bg-[var(--color-surface)] border border-[var(--color-border)]">
            {(Object.keys(SCENES) as Scene[]).map((key) => {
              const conf = SCENES[key];
              const active = scene === key;
              return (
                <button
                  key={key}
                  onClick={() => switchScene(key)}
                  disabled={running}
                  className={`px-4 py-1.5 rounded-[var(--radius-pill)] text-[var(--font-body-sm)] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    active
                      ? "bg-[var(--color-accent)] text-white shadow-[var(--shadow-ambient)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {conf.label}
                </button>
              );
            })}
            <span className="ml-2 mr-3 text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono uppercase tracking-wider">
              · 标的中性
            </span>
          </div>

          {/* 输入区 */}
          <Card className="mb-8" featured>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`向 FIN AI 提一个${config.label}相关问题...`}
                  className="w-full px-4 py-3 bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  disabled={running}
                />
              </div>
              <Button
                onClick={() => query && startDemo(query)}
                disabled={!query || running}
                trailing={<Send className="w-4 h-4" />}
              >
                {running ? "推理中..." : "开始研究"}
              </Button>
              {completed && (
                <Button variant="secondary" onClick={reset}>
                  重新开始
                </Button>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
              <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-3">
                示例问题
              </p>
              <div className="flex flex-wrap gap-2">
                {config.queries.map((q) => (
                  <button
                    key={q}
                    onClick={() => startDemo(q)}
                    disabled={running}
                    className="px-3 py-1.5 text-[var(--font-body-sm)] text-[var(--color-text-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] rounded-[var(--radius-pill)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* 主体 · 推理 + 工作台 */}
          {(running || completed) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 左：推理步骤 */}
              <div className="lg:col-span-4">
                <Card className="sticky top-24">
                  <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-4">
                    Agent 推理流程
                  </p>
                  <ol className="space-y-4">
                    {steps.map((step, idx) => (
                      <StepRow key={step.id} step={step} index={idx} />
                    ))}
                  </ol>

                  {completed && (
                    <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[var(--color-success)]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[var(--font-body-sm)] font-medium">
                          推理完成
                        </span>
                      </div>
                      <span className="text-[var(--font-micro)] font-mono text-[var(--color-text-subtle)]">
                        用时 4.5s
                      </span>
                    </div>
                  )}
                </Card>
              </div>

              {/* 右：动态工作台 */}
              <div className="lg:col-span-8 space-y-6">
                {/* 当前研究对象 */}
                <Card>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                        正在研究
                      </p>
                      <h2 className="text-[var(--font-h3)] font-medium leading-tight">
                        {query}
                      </h2>
                    </div>
                    {completed && <ConfidenceBadge level="mid" score={72} />}
                  </div>
                </Card>

                {/* Widget · 行情快照 */}
                {activeStep >= 0 && (
                  <Widget
                    icon={LineChart}
                    title={`行情快照 · ${config.symbolName} ${config.symbolCode}`}
                    source={config.source}
                    timestamp="14:30:00"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <Stat
                        label="最新价"
                        value={`¥${formatPrice(config.priceCents)}`}
                      />
                      <Stat
                        label="涨跌幅"
                        value={formatChangePercent(config.changePercent)}
                        tone={config.changePercent >= 0 ? "up" : "down"}
                      />
                      <Stat label="成交额" value={config.volumeText} />
                    </div>
                    <div className="mt-4 h-24 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono">
                      {scene === "equity" ? "K 线图" : "现货走势图"}（占位 · 真实产品接 ECharts / Lightweight Charts）
                    </div>
                  </Widget>
                )}

                {/* Widget · 基本面/现货面 */}
                {activeStep >= 1 && (
                  <Widget
                    icon={FileText}
                    title={scene === "equity" ? "财务面 · 2026Q1" : "现货面 · 库存与基差"}
                    source={scene === "equity" ? "巨潮资讯" : "东北亚镁质交易所"}
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {config.fundamental.map((f) => (
                        <Stat
                          key={f.label}
                          label={f.label}
                          value={f.value}
                          tone={f.tone}
                          detail={f.detail}
                        />
                      ))}
                    </div>
                  </Widget>
                )}

                {/* Widget · 舆情时间线 */}
                {activeStep >= 2 && (
                  <Widget
                    icon={Newspaper}
                    title="近 30 天舆情时间线"
                    source={scene === "equity" ? "财联社 / 卖方研报" : "首席分析师周报 / 产业链调研"}
                  >
                    <ol className="space-y-3">
                      {config.news.map((n) => (
                        <li key={n.date} className="flex items-start gap-3">
                          <span className="num font-mono text-[var(--font-micro)] text-[var(--color-text-subtle)] mt-0.5 w-10 shrink-0">
                            {n.date}
                          </span>
                          <span
                            className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                            style={{
                              background:
                                n.tone === "positive"
                                  ? "var(--color-up)"
                                  : n.tone === "negative"
                                    ? "var(--color-down)"
                                    : "var(--color-text-subtle)",
                            }}
                          />
                          <span className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] leading-relaxed">
                            {n.text}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </Widget>
                )}

                {/* Widget · 板块联动 / 同期合约 */}
                {activeStep >= 2 && (
                  <Widget
                    icon={TrendingUp}
                    title={config.peerLabel}
                    source={scene === "equity" ? "同花顺" : "东北亚镁质交易所"}
                    timestamp="14:30"
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {(scene === "equity" ? mockMarketData : mockCommodityData)
                        .slice(0, 5)
                        .map((m) => {
                          const up = m.changePercent >= 0;
                          return (
                            <div
                              key={m.symbol}
                              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)]"
                            >
                              <div className="text-[var(--font-micro)] font-mono text-[var(--color-text-subtle)] mb-1">
                                {m.symbol}
                              </div>
                              <div className="text-[var(--font-body-sm)] font-medium mb-1.5 truncate">
                                {m.name}
                              </div>
                              <div
                                className="num font-mono text-[var(--font-body-sm)] font-semibold"
                                style={{
                                  color: up
                                    ? "var(--color-up)"
                                    : "var(--color-down)",
                                }}
                              >
                                {formatChangePercent(m.changePercent)}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Widget>
                )}

                {/* 最终结论 */}
                {completed && <ConclusionCard scene={scene} config={config} />}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!running && !completed && (
            <div className="mt-16 text-center max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] mb-4">
                <CircleDot className="w-6 h-6" />
              </div>
              <p className="text-[var(--color-text-muted)] text-[var(--font-body-sm)] leading-relaxed">
                点上面任意一个示例问题，或自己输入。
                <br />
                Agent 推理过程 + 自动组装的工作台会出现在这里。
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-[var(--color-divider)] py-8 mt-12">
        <p className="text-center text-[var(--font-micro)] text-[var(--color-text-subtle)] tracking-wider font-mono uppercase">
          AI 输出仅供参考 · 不构成投资建议
        </p>
      </footer>
    </main>
  );
}

/* ============================================================ */
function StepRow({ step, index }: { step: ReasoningStep; index: number }) {
  const Icon =
    step.status === "running"
      ? Loader2
      : step.status === "done"
        ? Check
        : step.icon;

  const colorCls =
    step.status === "running"
      ? "text-[var(--color-accent)]"
      : step.status === "done"
        ? "text-[var(--color-success)]"
        : "text-[var(--color-text-subtle)]";

  return (
    <li className="flex items-start gap-3">
      <span
        className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full border ${
          step.status === "running"
            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
            : step.status === "done"
              ? "border-[var(--color-success)] bg-[rgba(31,203,126,0.12)]"
              : "border-[var(--color-border)]"
        }`}
      >
        <Icon
          className={`w-3.5 h-3.5 ${colorCls} ${
            step.status === "running" ? "animate-spin" : ""
          }`}
          strokeWidth={2}
        />
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="num font-mono text-[var(--font-micro)] text-[var(--color-text-subtle)]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={`text-[var(--font-body-sm)] font-medium ${
              step.status === "pending"
                ? "text-[var(--color-text-subtle)]"
                : "text-[var(--color-text)]"
            }`}
          >
            {step.title}
          </span>
        </div>
        <p className="text-[var(--font-micro)] text-[var(--color-text-muted)] leading-relaxed">
          {step.detail}
        </p>
      </div>
    </li>
  );
}

function ConclusionCard({
  scene,
  config,
}: {
  scene: Scene;
  config: SceneConfig;
}) {
  const equitySections = [
    {
      icon: "📊",
      label: "财务面",
      text: "2026Q1 营收增长 18.0%，归母净利润增长 16.2%，盈利能力稳健，量价齐升逻辑持续。",
    },
    {
      icon: "💰",
      label: "估值面",
      text: "PE-TTM 28.6 倍，位于近 5 年估值分位 30%，安全边际较为充分。",
    },
    {
      icon: "🌡",
      label: "情绪面",
      text: "近期白酒板块整体情绪偏弱，短期可能继续震荡。但中金、中信均给出买入评级。",
    },
    {
      icon: "🔍",
      label: "同业对比",
      text: "白酒板块 5 只龙头中，茅台财报质量最好，估值溢价也最高。",
    },
  ];
  const commoditySections = [
    {
      icon: "📊",
      label: "现货面",
      text: "现货均价 16,850 元/吨，周环比 +1.2%；持仓量环比 +5.6%，库存连续两周回落。",
    },
    {
      icon: "🏭",
      label: "产业链面",
      text: "海城地区氧化镁停产整顿影响 8 万吨产能，上游原料供给收缩支撑价格。",
    },
    {
      icon: "🌡",
      label: "情绪面",
      text: "首席分析师周报偏多研判，下游汽车板厂集中补库，现货成交活跃。",
    },
    {
      icon: "🔍",
      label: "合约对比",
      text: "MG2406 / 2409 月差 +27 元，远月升水反映市场对后续供给收缩的预期。",
    },
  ];
  const sections = scene === "equity" ? equitySections : commoditySections;
  const sources =
    scene === "equity"
      ? [
          { source: "上交所", timestamp: "14:30" },
          { source: "2026Q1 财报" },
          { source: "卖方研报 ×8" },
          { source: "财联社", timestamp: "今日" },
          { source: "同花顺板块" },
        ]
      : [
          { source: "东北亚镁质交易所", timestamp: "14:30" },
          { source: "首席分析师周报 ×3" },
          { source: "产业链调研" },
          { source: "海关进出口" },
          { source: "百川资讯" },
        ];

  return (
    <Card featured>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[var(--color-accent)]" />
        <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-accent)] font-mono">
          Agent 研究结论 · {config.label}
        </p>
      </div>

      <div className="space-y-3 mb-5 text-[var(--font-body)] leading-relaxed text-[var(--color-text-muted)]">
        {sections.map((s) => (
          <p key={s.label}>
            <span className="text-[var(--color-text)] font-medium">
              {s.icon} {s.label}：
            </span>
            {s.text}
          </p>
        ))}
        <p className="pt-3 border-t border-[var(--color-border)]">
          <span className="text-[var(--color-warning)] font-medium">
            ⚖️ 综合研判：
          </span>
          {config.summary}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--color-border)]">
        <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] mr-1">
          数据来源
        </span>
        {sources.map((s, i) => (
          <SourceBadge key={i} source={s.source} timestamp={s.timestamp} />
        ))}
      </div>
    </Card>
  );
}

function Widget({
  icon: Icon,
  title,
  source,
  timestamp,
  children,
}: {
  icon: typeof Database;
  title: string;
  source: string;
  timestamp?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[var(--color-accent)]" strokeWidth={1.75} />
          <h3 className="text-[var(--font-body-lg)] font-medium leading-none">
            {title}
          </h3>
        </div>
        <SourceBadge source={source} timestamp={timestamp} />
      </div>
      {children}
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
  detail?: string;
}) {
  const color =
    tone === "up"
      ? "var(--color-up)"
      : tone === "down"
        ? "var(--color-down)"
        : "var(--color-text)";
  return (
    <div>
      <p className="text-[var(--font-micro)] text-[var(--color-text-subtle)] mb-1">
        {label}
      </p>
      <p
        className="num font-mono text-[var(--font-h4)] font-semibold leading-none"
        style={{ color }}
      >
        {value}
      </p>
      {detail && (
        <p className="text-[var(--font-micro)] text-[var(--color-text-muted)] mt-1">
          {detail}
        </p>
      )}
    </div>
  );
}
