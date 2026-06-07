import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CircleDot,
  Database,
  Eye,
  FileText,
  LineChart,
  Newspaper,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfidenceBadge from "@/components/ui/ConfidenceBadge";
import SourceBadge from "@/components/ui/SourceBadge";
import SectionLabel from "@/components/ui/SectionLabel";
import NavBar from "@/components/landing/NavBar";
import CountUp from "@/components/landing/CountUp";
import HeroPreviewLive from "@/components/landing/HeroPreviewLive";
import ScrollRevealClient from "@/components/landing/ScrollRevealClient";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen text-[var(--color-text)] overflow-x-hidden">
      <NavBar />
      <ScrollRevealClient />

      <HeroSection />
      <WhySection />
      <WorkspaceSection />
      <AgentSection />
      <TrustSection />
      <FinalCta />
      <Footer />
    </main>
  );
}

/* ============================================================
 * Hero
 * ============================================================ */
function HeroSection() {
  return (
    <section className="relative pt-36 pb-24 lg:pt-44 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute inset-0 bg-grid-soft opacity-60 pointer-events-none" />

      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-3xl">
          <div className="animate-in" data-delay="1">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-pill)] bg-[var(--color-accent-soft)] border border-[rgba(46,127,255,0.3)] text-[var(--color-accent)] text-[var(--font-micro)] font-medium tracking-wider mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] pulse-dot" />
              <span className="font-mono">金融研究智能体 · 方法论</span>
            </span>
          </div>

          <h1
            className="animate-in text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.1] tracking-[-0.02em] font-medium mb-6"
            data-delay="2"
          >
            让分析师助理的工作 AI 化，
            <br />
            <span className="text-gradient-brand">让散户对内容有掌控感。</span>
          </h1>

          <p
            className="animate-in text-[var(--color-text-muted)] text-[var(--font-body-lg)] leading-[1.65] max-w-2xl mb-10"
            data-delay="3"
          >
            FIN AI 是一套金融研究 Agent 的客服化方法论，
            把「答疑 / 解读 / 找内容」三类高频工作交给 AI，
            把「署名 / 置信度 / 数据源」留给分析师。
            <br />
            股票与现货，同一套流程。
          </p>

          <div className="animate-in flex flex-wrap items-center gap-3 mb-16" data-delay="4">
            <Link href="/demo">
              <Button size="lg" trailing={<ArrowRight className="w-4 h-4" />}>
                看 30 秒推理 Demo
              </Button>
            </Link>
            <a href="#why">
              <Button variant="secondary" size="lg">
                了解方法论
              </Button>
            </a>
          </div>

          {/* 实时行情预览卡片 · 真数据 */}
          <div data-reveal>
            <HeroPreviewLive />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * Why
 * ============================================================ */
function WhySection() {
  const pains = [
    {
      icon: Users,
      title: "助理在重复回答同一批问题",
      desc: "60% 的散户提问都是同款问题。AI 接住高频答疑，助理回归高价值服务。",
    },
    {
      icon: FileText,
      title: "散户找不到买过的内容",
      desc: "分析师推过几十份研报，散户翻不到。AI 按问题语义直接定位原文段落。",
    },
    {
      icon: Eye,
      title: "看不懂分析师在说什么",
      desc: '"供给收缩"、"基差走阔"——AI 用白话解释专业术语，但不改原意。',
    },
    {
      icon: Search,
      title: "等回复要等几小时",
      desc: "助理人工排队，等不到散户都凉了。AI 毫秒级响应，置信度低再转人工。",
    },
    {
      icon: Brain,
      title: "分析师本人被打断",
      desc: "助理转问题给分析师，分析师写不出深度研报。AI 兜住前线，分析师专心做研究。",
    },
    {
      icon: Shield,
      title: "合规边界守不住",
      desc: "不预测目标价、不给买卖建议、不用绝对化表述——这些约束内置在 Agent 行为边界。",
    },
  ];

  return (
    <section id="why" className="relative py-24 lg:py-32 border-t border-[var(--color-divider)]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-16" data-reveal>
          <SectionLabel index="01">为什么做 · 投研客服的 6 个真痛点</SectionLabel>
          <h2 className="text-[28px] lg:text-[40px] leading-[1.15] tracking-[-0.02em] font-medium mb-5">
            分析师助理花在低价值工作上的时间，
            <br />
            <span className="text-gradient-brand">FIN AI 全替你接住。</span>
          </h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            这套方法论源自一个真实的现货交易所降本项目，
            离职后加入股票场景迭代成通用产品 ——
            标的可以变，流程不变。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pains.map((p, i) => (
            <div
              key={p.title}
              data-reveal
              data-reveal-delay={String((i % 3) + 1)}
            >
              <Card magnetic className="h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <p.icon className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="text-[var(--font-h4)] font-semibold leading-tight">
                    {p.title}
                  </h3>
                </div>
                <p className="text-[var(--color-text-muted)] leading-[1.7] text-[var(--font-body-sm)]">
                  {p.desc}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * Workspace — OpenBB 哲学的中文化
 * ============================================================ */
function WorkspaceSection() {
  const widgets = [
    {
      icon: LineChart,
      name: "K 线 + 技术指标",
      detail: "MACD / KDJ / 布林带 · AI 用人话解读",
    },
    {
      icon: FileText,
      name: "财报与基本面",
      detail: "营收 / 利润 / ROE · 同业横向对比",
    },
    {
      icon: Newspaper,
      name: "舆情与公告",
      detail: "财联社 / 公司公告 / 研报摘要时间线",
    },
    {
      icon: TrendingUp,
      name: "板块联动",
      detail: "同行业涨跌幅 · 北向资金流向",
    },
    {
      icon: Database,
      name: "宏观指标",
      detail: "CPI / 社融 / 利率 · 影响传导路径",
    },
    {
      icon: Workflow,
      name: "Agent 推理流",
      detail: "每一步用了什么数据、结论如何得出",
    },
  ];

  return (
    <section
      id="workspace"
      className="relative py-24 lg:py-32 border-t border-[var(--color-divider)] bg-[var(--color-surface)]/30"
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-16" data-reveal>
          <SectionLabel index="02">工作台 · AI 看见散户在研究什么</SectionLabel>
          <h2 className="text-[28px] lg:text-[40px] leading-[1.15] tracking-[-0.02em] font-medium mb-5">
            分析师内容 + 散户上下文 + AI 助理，
            <br />
            <span className="text-gradient-brand">同一屏内闭环。</span>
          </h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            常驻 AI Copilot 不是独立聊天框 ——
            它能直接读取散户屏幕上的行情、财报、研报片段，给出针对性回答。
            分析师的署名、置信度、数据源始终保留 ——
            散户对自己买的内容，第一次有了真正的掌控感。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((w, i) => (
            <div
              key={w.name}
              data-reveal
              data-reveal-delay={String((i % 3) + 1)}
              className="group flex items-start gap-4 p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)] transition-all"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] group-hover:scale-110 transition-transform">
                <w.icon className="w-5 h-5" strokeWidth={1.75} />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-[var(--font-body-lg)] font-medium mb-1">
                  {w.name}
                </h3>
                <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] leading-relaxed">
                  {w.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 统计数据 */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-12 rounded-[var(--radius-xl)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-border)]"
          data-reveal
        >
          {[
            { value: 60, suffix: "%", label: "助理时间释放", detail: "重复答疑由 AI 接住" },
            { value: 200, suffix: "ms", label: "首响时延", detail: "高置信度问题秒回" },
            { value: 2, suffix: "类", label: "标的覆盖", detail: "股票 + 现货同套流程" },
            { value: 100, suffix: "%", label: "输出可追溯", detail: "置信度 + 数据源 + 分析师署名" },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--color-bg)] p-6">
              <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-medium font-mono mb-3">
                {s.label}
              </p>
              <p className="text-[32px] lg:text-[40px] leading-none font-semibold tracking-[-0.02em] text-[var(--color-text)] mb-2">
                <CountUp end={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[var(--font-micro)] text-[var(--color-text-muted)] mt-2">
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * Agent 推理流程
 * ============================================================ */
function AgentSection() {
  const steps = [
    {
      n: "01",
      icon: Database,
      title: "拉取行情",
      detail: "实时 K 线 · 历史数据 · 资金流向",
    },
    {
      n: "02",
      icon: Newspaper,
      title: "检索舆情",
      detail: "研报库 · 公司公告 · 新闻时间线",
    },
    {
      n: "03",
      icon: Brain,
      title: "综合研判",
      detail: "多步推理 · 子任务拆解 · 路径规划",
    },
    {
      n: "04",
      icon: Eye,
      title: "事实校验",
      detail: "结论与原文相似度比对 · 置信度评估",
    },
    {
      n: "05",
      icon: Sparkles,
      title: "生成结论",
      detail: "结构化输出 · 数据源标注 · 置信度",
    },
  ];

  return (
    <section
      id="agent"
      className="relative py-24 lg:py-32 border-t border-[var(--color-divider)]"
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-16" data-reveal>
          <SectionLabel index="03">智能体推理 · 流程复刻，标的中性</SectionLabel>
          <h2 className="text-[28px] lg:text-[40px] leading-[1.15] tracking-[-0.02em] font-medium mb-5">
            5 步闭环推理，
            <br />
            <span className="text-gradient-brand">每一步都留痕、可校验。</span>
          </h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            传统 RAG 只能单步问答，Function Calling 依赖预定义函数链。
            FIN AI 的 Agent Loop 自主拆解任务、规划数据路径、每步质量自检 ——
            不合格则回溯重做，合规边界外则强制转人工。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-px rounded-[var(--radius-xl)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-border)]">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="bg-[var(--color-bg)] p-6 relative"
              data-reveal
              data-reveal-delay={String((i % 4) + 1)}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[var(--font-micro)] font-mono font-semibold tracking-widest text-[var(--color-accent)]">
                  第 {s.n} 步
                </span>
                <s.icon
                  className="w-4 h-4 text-[var(--color-text-subtle)]"
                  strokeWidth={1.75}
                />
              </div>
              <h3 className="text-[var(--font-body-lg)] font-semibold mb-2">
                {s.title}
              </h3>
              <p className="text-[var(--font-micro)] text-[var(--color-text-muted)] leading-relaxed font-mono uppercase tracking-wide">
                {s.detail}
              </p>
            </div>
          ))}
        </div>

        {/* 示例输出 */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-4" data-reveal>
          <Card className="lg:col-span-3" featured>
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-1.5">
                  示例提问
                </p>
                <h3 className="text-[var(--font-h4)] font-medium">
                  贵州茅台当下值得长期持有吗？
                </h3>
              </div>
              <ConfidenceBadge level="mid" score={72} />
            </div>

            <div className="space-y-3 mb-4 text-[var(--font-body-sm)] leading-relaxed text-[var(--color-text-muted)]">
              <p>
                <span className="text-[var(--color-text)] font-medium">财务面：</span>
                Q1 营收增长 18.0%，归母净利润增长 16.2%，盈利能力稳健。
              </p>
              <p>
                <span className="text-[var(--color-text)] font-medium">估值面：</span>
                PE-TTM 处于近 5 年 30% 分位，安全边际较为充分。
              </p>
              <p>
                <span className="text-[var(--color-text)] font-medium">情绪面：</span>
                近期白酒板块情绪偏弱，短期可能继续震荡。
              </p>
              <p className="pt-2 border-t border-[var(--color-border)]">
                <span className="text-[var(--color-warning)] font-medium">研究结论：</span>{" "}
                中长期持有逻辑成立，但短期受板块情绪影响存在波动。仅供参考，请结合自身风险偏好判断，本结论不构成投资建议。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--color-border)]">
              <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] mr-1">
                数据来源
              </span>
              <SourceBadge source="上交所" timestamp="14:30" />
              <SourceBadge source="2026Q1 财报" />
              <SourceBadge source="卖方研报 ×8" />
              <SourceBadge source="财联社" timestamp="今日" />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-3">
              Agent 推理路径
            </p>
            <ol className="space-y-2.5 text-[var(--font-body-sm)] leading-relaxed">
              {[
                "拉取近 12 个月行情与财报",
                "检索 8 份卖方研报，提取核心观点",
                "扫描近 30 天舆情与公告",
                "横向比较白酒板块 5 只龙头",
                "事实校验：与原文相似度 ≥ 0.78",
                "生成结构化结论 · 置信度 72%",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="num font-mono text-[var(--font-micro)] text-[var(--color-accent)] mt-0.5 w-4 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[var(--color-text-muted)]">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * Trust / 合规
 * ============================================================ */
function TrustSection() {
  const items = [
    {
      icon: Shield,
      title: "幻觉拦截",
      desc: "结论与原文相似度低于阈值，自动降级为「仅供参考」。",
    },
    {
      icon: CircleDot,
      title: "合规边界",
      desc: "不预测目标价、不给买卖建议、不使用「保赚 / 必涨」表述。",
    },
    {
      icon: Users,
      title: "人工兜底",
      desc: "涉及交易语义的请求强制转交人工，AI 边界外回退。",
    },
    {
      icon: Eye,
      title: "结论可追溯",
      desc: "每条输出标注置信度评分与完整数据源链，可点击复核。",
    },
  ];
  return (
    <section
      id="trust"
      className="relative py-24 lg:py-32 border-t border-[var(--color-divider)] bg-[var(--color-surface)]/30"
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-16" data-reveal>
          <SectionLabel index="04">可信赖 · 让公司敢上线，让散户敢用</SectionLabel>
          <h2 className="text-[28px] lg:text-[40px] leading-[1.15] tracking-[-0.02em] font-medium mb-5">
            金融场景的 AI，
            <br />
            <span className="text-gradient-brand">合规必须比聪明更重要。</span>
          </h2>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            FIN AI 在架构层就把合规约束内置进 Agent 行为边界 ——
            不该说的话不说，置信度低自动降级，
            合规高危请求强制转人工兜底。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((it, i) => (
            <div
              key={it.title}
              data-reveal
              data-reveal-delay={String((i % 4) + 1)}
            >
              <Card magnetic className="h-full">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] mb-4">
                  <it.icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <h3 className="text-[var(--font-h4)] font-semibold mb-2">
                  {it.title}
                </h3>
                <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] leading-relaxed">
                  {it.desc}
                </p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * Final CTA
 * ============================================================ */
function FinalCta() {
  return (
    <section className="relative py-28 lg:py-36 border-t border-[var(--color-divider)] overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute inset-0 bg-grid-soft opacity-40 pointer-events-none" />

      <div className="relative max-w-[760px] mx-auto px-6 text-center" data-reveal>
        <SectionLabel>立即体验</SectionLabel>
        <h2 className="text-[40px] lg:text-[56px] leading-[1.1] tracking-[-0.02em] font-medium mb-6">
          一套流程，
          <br />
          <span className="text-gradient-brand">两种标的，三方共赢。</span>
        </h2>
        <p className="text-[var(--color-text-muted)] leading-relaxed mb-10 max-w-lg mx-auto">
          30 秒看一遍 Demo，理解 Agent Loop 怎么处理股票与现货 ——
          再看看 Workspace 怎么把分析师内容 + AI 助理 + 散户问题闭环到一屏。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <Link href="/demo">
            <Button size="lg" trailing={<ArrowRight className="w-4 h-4" />}>
              看推理 Demo
            </Button>
          </Link>
          <Link href="/workspace">
            <Button variant="secondary" size="lg">
              看工作台 Workspace
            </Button>
          </Link>
        </div>
        <p className="text-[var(--font-micro)] text-[var(--color-text-subtle)] tracking-wider font-mono uppercase">
          AI 输出仅供参考 · 不构成投资建议
        </p>
      </div>
    </section>
  );
}

/* ============================================================
 * Footer
 * ============================================================ */
function Footer() {
  return (
    <footer className="border-t border-[var(--color-divider)] py-10">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--color-accent)] to-[#6b5aff] text-white font-semibold text-[10px]">
            FA
          </span>
          <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)]">
            FIN AI · 金融研究 Agent 客服化方法论 · v0.1.0
          </p>
        </div>
        <p className="text-[var(--font-micro)] text-[var(--color-text-subtle)] tracking-wider">
          © 2026 FIN AI · AI 输出仅供参考，不构成投资建议
        </p>
      </div>
    </footer>
  );
}
