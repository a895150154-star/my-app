"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import KlineChart, { type KlinePoint } from "@/components/market/KlineChart";
import {
  QuoteCardWidget,
  ValuationCardWidget,
  HoldersWidget,
} from "@/components/market/OverviewWidgets";
import {
  Activity,
  AtSign,
  Bot,
  ChevronRight,
  FileText,
  LineChart,
  Loader2,
  MoreVertical,
  PencilLine,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import ConfidenceBadge from "@/components/ui/ConfidenceBadge";
import SourceBadge from "@/components/ui/SourceBadge";
import SearchPalette from "@/components/workspace/SearchPalette";
import WidgetLibraryDrawer from "@/components/workspace/WidgetLibraryDrawer";
import MarkdownLite from "@/components/workspace/MarkdownLite";
import OpenBBCardHeader from "@/components/workspace/OpenBBCardHeader";
import ProgressTimeline from "@/components/workspace/ProgressTimeline";
import { mockMarketData } from "@/lib/mock-data";
import { findStock } from "@/lib/stock-list";
import {
  listNotes,
  listNotesBySymbol,
  stanceLabel,
  stanceColor,
  confidenceLabel,
  type AnalystNote,
} from "@/lib/analyst-notes";
import {
  loadState,
  newId,
  resetState,
  saveState,
  type Dashboard,
  type Tab,
  type WidgetKind,
  type WorkspaceState,
} from "@/lib/workspace-store";

/** 每个 dashboard 最多多少个 widget — 超过会拒绝添加并提示用户 */
const MAX_WIDGETS_PER_DASHBOARD = 8;

interface TraceStep {
  round: number;
  thought?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolSummary?: string;
  toolOk?: boolean;
}

type ProgressStatus = "pending" | "active" | "done" | "skipped";
interface AgentProgress {
  /** 5 步状态：key → status */
  steps: Record<string, ProgressStatus>;
  /** 是否还在流式过程中（reply 未到时为 true） */
  streaming: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  refs?: string[];
  confidence?: "high" | "mid" | "low";
  score?: number;
  sources?: { source: string; timestamp?: string }[];
  /** 当 AI 因为合规边界主动建议转人工时，气泡里高亮"联系分析师"按钮 */
  handoff?: boolean;
  /** Agent Loop 的推理轨迹 */
  trace?: TraceStep[];
  /** 本次 LLM 调用的总轮数 */
  rounds?: number;
  /** 5 步进度（SSE 流式时实时更新） */
  progress?: AgentProgress;
}

/** 5 步骤配置（和后端 PROGRESS_STEPS 对齐） */
const PROGRESS_STEP_DEFS: { key: string; label: string }[] = [
  { key: "SEARCH_SENTIMENT", label: "检索分析师研判" },
  { key: "FETCH_DATA", label: "拉取行情/财报数据" },
  { key: "ANALYZE", label: "综合研判分析" },
  { key: "VERIFY", label: "事实校验与置信度评估" },
  { key: "GENERATE", label: "生成研究结论" },
];

function initialProgress(): AgentProgress {
  return {
    steps: Object.fromEntries(
      PROGRESS_STEP_DEFS.map((s) => [s.key, "pending" as ProgressStatus]),
    ),
    streaming: true,
  };
}

/**
 * 用户输入里是否包含触发"强制转人工"的敏感问题
 * 命中：明确买卖请求、目标价、止损、杠杆/合约/期权、情绪化求助
 */
const SENSITIVE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /我.*该(买|卖|入|进|抄|止损|清仓|加仓)|买不买|卖不卖|要不要(买|卖|入)/, reason: "明确买卖建议" },
  { pattern: /目标价|看到多少|涨到多少|能涨到|跌到多少|目标位/, reason: "具体价位预测" },
  { pattern: /止损位|止盈位|止损线/, reason: "操作点位" },
  { pattern: /杠杆|合约|期权|两融|融资|融券|爆仓/, reason: "高风险衍生品" },
  { pattern: /套住了|亏了好多|割肉|心慌|焦虑|血亏|怎么办啊/, reason: "情绪化求助" },
];

function detectSensitive(input: string): string | null {
  for (const { pattern, reason } of SENSITIVE_PATTERNS) {
    if (pattern.test(input)) return reason;
  }
  return null;
}

export default function WorkspacePage() {
  // ============ 持久化状态 ============
  const [state, setState] = useState<WorkspaceState | null>(null);
  // 初次加载从 localStorage 读 —— 用 queueMicrotask 避开严格效应规则
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setState(loadState());
    });
    return () => {
      cancelled = true;
    };
  }, []);
  // 任何状态变化保存
  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const currentDashboard: Dashboard | null = state
    ? state.dashboards.find((d) => d.id === state.currentDashboardId) ??
      state.dashboards[0] ??
      null
    : null;

  const tabs: Tab[] = currentDashboard?.tabs ?? [];
  const activeTabId =
    currentDashboard?.activeTabId && tabs.some((t) => t.id === currentDashboard.activeTabId)
      ? currentDashboard.activeTabId
      : tabs[0]?.id ?? null;
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  // ============ Drawer / Palette 开关 ============
  const [searchOpen, setSearchOpen] = useState(false);
  const [widgetsOpen, setWidgetsOpen] = useState(false);

  // ⌘K 全局快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const hit = isMac ? e.metaKey && e.key === "k" : e.ctrlKey && e.key === "k";
      if (hit) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ============ Dashboard 操作 ============
  const updateDashboards = useCallback(
    (mutator: (dashboards: Dashboard[]) => Dashboard[]) => {
      setState((prev) => {
        if (!prev) return prev;
        return { ...prev, dashboards: mutator(prev.dashboards) };
      });
    },
    [],
  );

  const setCurrentDashboard = (id: string) => {
    setState((prev) => (prev ? { ...prev, currentDashboardId: id } : prev));
  };

  const createDashboard = () => {
    const id = newId("dash");
    const next: Dashboard = {
      id,
      name: `新仪表盘 ${(state?.dashboards.length ?? 0) + 1}`,
      tabs: [],
      activeTabId: undefined,
      createdAt: Date.now(),
    };
    updateDashboards((d) => [...d, next]);
    setCurrentDashboard(id);
  };

  const renameDashboard = (id: string, name: string) => {
    updateDashboards((dashboards) =>
      dashboards.map((d) => (d.id === id ? { ...d, name } : d)),
    );
  };

  const deleteDashboard = (id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const filtered = prev.dashboards.filter((d) => d.id !== id);
      const list = filtered.length === 0
        ? loadState().dashboards.slice(0, 1) // 至少保留一个
        : filtered;
      return {
        ...prev,
        dashboards: list,
        currentDashboardId:
          prev.currentDashboardId === id ? list[0]?.id ?? null : prev.currentDashboardId,
      };
    });
  };

  // ============ Tab 操作 ============
  const updateCurrentTabs = (
    mutator: (tabs: Tab[]) => Tab[],
    nextActive?: string,
  ) => {
    if (!currentDashboard) return;
    updateDashboards((dashboards) =>
      dashboards.map((d) =>
        d.id === currentDashboard.id
          ? {
              ...d,
              tabs: mutator(d.tabs),
              activeTabId: nextActive ?? d.activeTabId,
            }
          : d,
      ),
    );
  };

  const addTab = (widget: WidgetKind, title: string, symbol = "600519") => {
    if (tabs.length >= MAX_WIDGETS_PER_DASHBOARD) {
      window.alert(
        `每个仪表盘最多 ${MAX_WIDGETS_PER_DASHBOARD} 个卡片，请先关闭一个再添加。`,
      );
      return;
    }
    const id = newId("t");
    updateCurrentTabs((tabs) => [...tabs, { id, title, widget, symbol }], id);
  };

  const addTabRaw = (tab: Tab) => {
    if (tabs.length >= MAX_WIDGETS_PER_DASHBOARD) {
      window.alert(
        `每个仪表盘最多 ${MAX_WIDGETS_PER_DASHBOARD} 个卡片，请先关闭一个再添加。`,
      );
      return;
    }
    updateCurrentTabs((tabs) => [...tabs, tab], tab.id);
  };

  const closeTab = (id: string) => {
    const remaining = tabs.filter((t) => t.id !== id);
    updateCurrentTabs(
      () => remaining,
      activeTabId === id ? remaining[0]?.id : undefined,
    );
  };

  const setActiveTabId = (id: string) => {
    if (!currentDashboard) return;
    updateDashboards((dashboards) =>
      dashboards.map((d) =>
        d.id === currentDashboard.id ? { ...d, activeTabId: id } : d,
      ),
    );
  };

  // ============ 搜索股票选定后行为 ============
  const handleSearchPick = (symbol: string, name: string, kind: WidgetKind = "kline") => {
    const titleMap: Record<WidgetKind, string> = {
      kline: `${name} · K 线`,
      fundamental: `${name} · 财报`,
      research: `${name} · 研判`,
      quote_card: `${name} · 实时行情`,
      valuation: `${name} · 估值与市值`,
      holders: `${name} · 股东结构`,
    };
    const id = newId("t");
    updateCurrentTabs(
      (tabs) => [...tabs, { id, title: titleMap[kind], widget: kind, symbol }],
      id,
    );
  };

  // ============ AI Copilot ============
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "agent",
      content:
        "你好，我是 FIN AI。我会把您当前关注标的的分析师明确观点转述给您。\n\n比如试着问我「茅台最近怎么看」「比亚迪能不能买」「宁德怎么操作」——我会告诉您张明、李婷、王浩三位老师的明确判断。",
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [aiSidebarCollapsed, setAiSidebarCollapsed] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const onAiInputChange = (v: string) => {
    setAiInput(v);
    setShowMentions(v.endsWith("@"));
  };

  const mentionWidget = (tab: Tab) => {
    setAiInput((prev) =>
      prev.replace(/@$/, `@${tab.title} `).replace(/\s*$/, " "),
    );
    setShowMentions(false);
  };

  const sendMessage = async () => {
    if (!aiInput.trim() || aiThinking) return;

    const userMsg: ChatMessage = {
      id: newId("u"),
      role: "user",
      content: aiInput,
      refs: extractRefs(aiInput),
    };

    const history = messages
      .filter((m) => m.id !== "m0")
      .slice(-10)
      .map((m) => ({
        role: m.role === "agent" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));

    setMessages((prev) => [...prev, userMsg]);
    setAiInput("");

    // 合规闸门：仅当用户问敏感问题、且当前标的没有可转述的分析师研判时，才硬拦截转人工
    // 有研判时由 LLM 用研判内容回答（合规归属在分析师身上）
    const sensitiveReason = detectSensitive(userMsg.content);
    const hasNotes =
      activeTab && listNotesBySymbol(activeTab.symbol).length > 0;
    if (sensitiveReason && !hasNotes) {
      const reply: ChatMessage = {
        id: newId("a"),
        role: "agent",
        content: `您这个问题涉及 ${sensitiveReason}，且当前标的暂时没有分析师研判可参考，AI 不能给您明确指令。\n\n建议联系您的分析师老师本人。我可以先帮您整理一下当前持仓和最近的对话，方便您和分析师沟通时参考。`,
        confidence: "low",
        sources: activeTab
          ? [{ source: `合规拦截 · ${activeTab.title}` }]
          : undefined,
        handoff: true,
      };
      setMessages((prev) => [...prev, reply]);
      return;
    }

    setAiThinking(true);

    // 拼接 widget 上下文（含真实数据快照）+ 收集本次注入的数据源
    const ctx = activeTab
      ? await buildWidgetContext(activeTab)
      : { context: undefined as string | undefined, sources: [] as WidgetContextSource[] };

    // 先插入一个"AI 思考中"的占位气泡，progress 事件会实时更新它
    const placeholderId = newId("a");
    const initial: ChatMessage = {
      id: placeholderId,
      role: "agent",
      content: "",
      progress: initialProgress(),
    };
    setMessages((prev) => [...prev, initial]);

    const collectedTrace: TraceStep[] = [];

    try {
      const notesSnapshot = listNotes();
      const res = await fetch("/api/agent/loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMsg.content,
          widgetContext: ctx.context,
          history,
          notesSnapshot,
        }),
      });

      if (!res.ok || !res.body) {
        // 不是流式响应（fetch 失败或服务器返回了 JSON 错误）
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // 逐块读取并按 "\n\n" 切 SSE 事件
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          if (!ev.trim()) continue;
          handleSseEvent(ev, placeholderId, collectedTrace, ctx, activeTab);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "调用失败";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                content: `⚠️ ${message}\n\n请检查：\n• OpenRouter API key 是否正确（app/.env.local）\n• 网络能否访问 openrouter.ai\n• 账户是否还有余额`,
                confidence: "low",
                progress: undefined,
              }
            : m,
        ),
      );
    } finally {
      setAiThinking(false);
    }
  };

  /**
   * 处理一条 SSE 事件文本（形如 "event: tool\ndata: {...}"）
   * 根据事件类型更新对应 placeholder message
   */
  const handleSseEvent = (
    rawEvent: string,
    placeholderId: string,
    collectedTrace: TraceStep[],
    ctx: { context: string | undefined; sources: WidgetContextSource[] },
    activeTab: Tab | undefined,
  ) => {
    const lines = rawEvent.split("\n");
    let eventName = "message";
    let dataStr = "";
    for (const line of lines) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
    }
    if (!dataStr) return;
    let data: unknown;
    try {
      data = JSON.parse(dataStr);
    } catch {
      return;
    }

    if (eventName === "progress") {
      const { stepKey, status } = data as {
        stepKey: string;
        status: ProgressStatus;
      };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId && m.progress
            ? {
                ...m,
                progress: {
                  ...m.progress,
                  steps: { ...m.progress.steps, [stepKey]: status },
                },
              }
            : m,
        ),
      );
      return;
    }

    if (eventName === "tool") {
      collectedTrace.push(data as TraceStep);
      return;
    }

    if (eventName === "reply") {
      const payload = data as {
        reply: string;
        trace: TraceStep[];
        factCheck?: {
          overall: "high" | "mid" | "low";
          avgScore: number;
        } | null;
        rounds?: number;
      };
      const traceSources = (payload.trace ?? []).flatMap((step) => {
        if (!step.toolName || !step.toolOk) return [];
        if (step.toolName === "fetch_quote")
          return [{ source: "Tushare · 日线行情" }];
        if (step.toolName === "fetch_fundamental")
          return [{ source: "Tushare · 巨潮资讯" }];
        if (step.toolName === "search_analyst_notes")
          return [{ source: "本地研判库" }];
        if (step.toolName === "detect_conflicting_views")
          return [{ source: "冲突检测" }];
        return [];
      });
      const replySources =
        traceSources.length > 0
          ? traceSources
          : ctx.sources.length > 0
            ? ctx.sources
            : activeTab
              ? [{ source: `当前 widget · ${activeTab.title}` }]
              : undefined;
      const factOverall = payload.factCheck?.overall;
      const finalConfidence: "high" | "mid" | "low" =
        factOverall ?? (traceSources.length > 0 ? "high" : "mid");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                content: payload.reply ?? "（AI 未返回内容）",
                confidence: finalConfidence,
                score: payload.factCheck?.avgScore,
                sources: replySources,
                trace: payload.trace,
                rounds: payload.rounds,
                progress: m.progress
                  ? { ...m.progress, streaming: false }
                  : undefined,
              }
            : m,
        ),
      );
      return;
    }

    if (eventName === "error") {
      const { error } = data as { error: string };
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                content: `⚠️ ${error}`,
                confidence: "low",
                progress: undefined,
              }
            : m,
        ),
      );
    }
  };

  // ============ 加载占位 ============
  if (!state || !currentDashboard) {
    return (
      <main className="min-h-screen grid place-items-center bg-[var(--color-bg)] text-[var(--color-text-muted)]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </main>
    );
  }

  return (
    <main className="h-screen w-screen flex bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      <LeftSidebar
        state={state}
        currentDashboard={currentDashboard}
        onOpenSearch={() => setSearchOpen(true)}
        onCreateDashboard={createDashboard}
        onSelectDashboard={setCurrentDashboard}
        onRenameDashboard={renameDashboard}
        onDeleteDashboard={deleteDashboard}
        onAddTab={addTab}
        onResetAll={() => {
          resetState();
          setState(loadState());
        }}
      />

      {/* ============ Center Workspace · Grid 平铺 ============ */}
      <section className="flex-1 flex flex-col min-w-0 border-x border-[var(--color-border)]">
        {/* Dashboard 顶栏：标题 + 添加 widget */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
          <div className="flex items-center gap-3">
            <h1 className="text-[var(--font-body-lg)] font-medium">
              {currentDashboard.name}
            </h1>
            <span className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono">
              共 {tabs.length} 张卡片 · 实时平铺
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="px-2.5 py-1.5 text-[var(--font-body-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded transition-colors flex items-center gap-1"
              title="⌘K 搜索股票"
            >
              <Search className="w-3.5 h-3.5" />
              <span>切换标的</span>
            </button>
            <button
              onClick={() => setWidgetsOpen(true)}
              disabled={tabs.length >= MAX_WIDGETS_PER_DASHBOARD}
              className="px-2.5 py-1.5 text-[var(--font-body-sm)] text-white bg-[var(--color-accent)] hover:opacity-90 disabled:bg-[var(--color-surface-2)] disabled:text-[var(--color-text-subtle)] disabled:cursor-not-allowed rounded transition-opacity flex items-center gap-1"
              title={
                tabs.length >= MAX_WIDGETS_PER_DASHBOARD
                  ? `已达上限 (${MAX_WIDGETS_PER_DASHBOARD})`
                  : "添加卡片"
              }
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                添加卡片 ({tabs.length}/{MAX_WIDGETS_PER_DASHBOARD})
              </span>
            </button>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-[var(--color-bg)] p-3">
          {tabs.length > 0 ? (
            <WidgetGrid
              tabs={tabs}
              onCloseTab={closeTab}
              onFocusTab={setActiveTabId}
              activeTabId={activeTabId ?? undefined}
            />
          ) : (
            <EmptyState onOpenSearch={() => setSearchOpen(true)} />
          )}
        </div>
      </section>

      {/* ============ Right AI Copilot ============ */}
      {aiSidebarCollapsed ? (
        <button
          onClick={() => setAiSidebarCollapsed(false)}
          className="w-12 flex flex-col items-center justify-start pt-4 gap-3 border-l border-[var(--color-border)] hover:bg-[var(--color-surface)]/40 transition-colors"
        >
          <Bot className="w-5 h-5 text-[var(--color-accent)]" />
          <span className="text-[var(--font-micro)] text-[var(--color-text-muted)] [writing-mode:vertical-rl] tracking-wider">
            FIN AI
          </span>
        </button>
      ) : (
        <aside className="w-[380px] flex flex-col bg-[var(--color-bg)] border-l border-[var(--color-border)]">
          <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-divider)]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Bot className="w-4 h-4" />
              </span>
              <div className="leading-tight">
                <p className="text-[var(--font-body-sm)] font-medium">
                  FIN AI · 研判转述员
                </p>
                <p className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono">
                  上下文 · {activeTab?.title ?? "—"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAiSidebarCollapsed(true)}
              className="text-[var(--color-text-subtle)] hover:text-[var(--color-text)] p-1.5 rounded transition-colors"
              aria-label="收起 AI 侧栏"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </header>

          <div className="p-4 border-b border-[var(--color-divider)]">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-[var(--color-accent)]" />
                <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-accent)] font-mono">
                  AI 会做什么
                </p>
              </div>
              <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] leading-relaxed">
                把分析师的明确观点转述给您，并用实时行情/财报验证。AI 不会给自己的买卖建议。
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
            {messages.map((m) => (
              <Message
                key={m.id}
                message={m}
                onContactAnalyst={() => setContactOpen(true)}
              />
            ))}
            {aiThinking && (
              <div className="flex items-center gap-2 pl-7 text-[var(--color-text-muted)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-accent)]" />
                <span className="text-[var(--font-body-sm)]">FIN AI 正在思考...</span>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--color-divider)] p-3 relative">
            {showMentions && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-elevated)] p-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                <p className="px-2 py-1 text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono">
                  引用 widget 作为上下文
                </p>
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => mentionWidget(t)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-[var(--color-surface-2)] text-[var(--font-body-sm)] text-left"
                  >
                    <WidgetIcon kind={t.widget} />
                    <span className="flex-1 truncate">{t.title}</span>
                  </button>
                ))}
              </div>
            )}

            {detectSensitive(aiInput) &&
              activeTab &&
              listNotesBySymbol(activeTab.symbol).length === 0 && (
                <div className="mb-2 flex items-start gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)] text-[var(--font-micro)] leading-relaxed">
                  <Phone className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0 mt-0.5" />
                  <span className="text-[var(--color-text)]">
                    您的问题涉及 <strong>{detectSensitive(aiInput)}</strong>
                    ，但该标的暂时没有分析师研判，AI 会建议联系分析师。
                  </span>
                </div>
              )}

            <div className="flex items-end gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] focus-within:border-[var(--color-accent)] rounded-[var(--radius-md)] transition-colors p-2">
              <textarea
                value={aiInput}
                onChange={(e) => onAiInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="问 FIN AI...  输入 @ 引用卡片"
                rows={2}
                className="flex-1 bg-transparent text-[var(--font-body-sm)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] outline-none resize-none"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onAiInputChange(aiInput + "@")}
                  className="p-1.5 text-[var(--color-text-subtle)] hover:text-[var(--color-accent)] rounded transition-colors"
                  aria-label="引用卡片"
                >
                  <AtSign className="w-4 h-4" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!aiInput.trim() || aiThinking}
                  className="p-1.5 text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] disabled:text-[var(--color-text-subtle)] disabled:hover:bg-transparent rounded transition-colors"
                  aria-label="发送"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-[var(--font-micro)] text-[var(--color-text-subtle)] tracking-wider font-mono uppercase">
              AI 输出仅供参考 · 不构成投资建议
            </p>
          </div>
        </aside>
      )}

      {/* ============ Palettes & Drawers ============ */}
      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPick={handleSearchPick}
      />
      <WidgetLibraryDrawer
        open={widgetsOpen}
        onClose={() => setWidgetsOpen(false)}
        onAdd={addTabRaw}
      />
      <ContactAnalystModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        activeTab={activeTab}
      />
    </main>
  );
}

/* ============================================================
 * Contact Analyst Modal —— 转人工兜底
 * ============================================================ */
function ContactAnalystModal({
  open,
  onClose,
  activeTab,
}: {
  open: boolean;
  onClose: () => void;
  activeTab: Tab | undefined;
}) {
  if (!open) return null;

  // 从当前标的的研判里抽出最近一位分析师（mock：用 seed 数据的签名）
  const relatedAnalyst = activeTab
    ? listNotesBySymbol(activeTab.symbol)[0]?.analyst
    : undefined;

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-[min(440px,92vw)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-[var(--radius-lg)] shadow-[var(--shadow-deep)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-divider)]">
          <h3 className="text-[var(--font-h3)] font-medium flex items-center gap-2">
            <Phone className="w-4 h-4 text-[var(--color-accent)]" />
            联系分析师
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {relatedAnalyst ? (
            <>
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)]">
                <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                  推荐对接
                </p>
                <p className="text-[var(--font-body-lg)] font-medium">
                  {relatedAnalyst}
                </p>
                <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] mt-1">
                  发布过 {activeTab?.symbol} 的研判，最熟悉这只标的
                </p>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-dashed border-[var(--color-border)] text-[var(--font-body-sm)] text-[var(--color-text-muted)]">
              当前标的还没有专属分析师，将转给值班团队。
            </div>
          )}

          <div className="space-y-2.5 text-[var(--font-body-sm)]">
            <div className="flex items-start gap-2">
              <span className="text-[var(--color-text-subtle)] font-mono w-16 shrink-0">
                微信
              </span>
              <span className="font-mono">finai-analyst-001</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[var(--color-text-subtle)] font-mono w-16 shrink-0">
                电话
              </span>
              <span className="font-mono">400-888-XXXX 转 8</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[var(--color-text-subtle)] font-mono w-16 shrink-0">
                工作时间
              </span>
              <span>交易日 9:00 - 17:00</span>
            </div>
          </div>

          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--font-micro)] text-[var(--color-text-subtle)] leading-relaxed">
            💡 联系分析师时，FIN AI 会把您当前看过的 widget 和最近 5 条对话作为
            <span className="text-[var(--color-text-muted)]"> 沟通摘要 </span>
            发给对方，避免重复描述。
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--radius-md)] text-[var(--font-body-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              稍后再说
            </button>
            <button
              onClick={() => {
                window.alert(
                  `沟通摘要已生成（演示）：\n标的：${activeTab?.title ?? "—"}\n对接：${relatedAnalyst ?? "值班团队"}\n\n生产版会通过企业微信 / IM 直接发送。`,
                );
                onClose();
              }}
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-[var(--font-body-sm)] font-medium hover:opacity-90 transition-opacity"
            >
              生成摘要并对接
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
 * Left Sidebar
 * ============================================================ */
interface LeftSidebarProps {
  state: WorkspaceState;
  currentDashboard: Dashboard;
  onOpenSearch: () => void;
  onCreateDashboard: () => void;
  onSelectDashboard: (id: string) => void;
  onRenameDashboard: (id: string, name: string) => void;
  onDeleteDashboard: (id: string) => void;
  onAddTab: (widget: WidgetKind, title: string) => void;
  onResetAll: () => void;
}

function LeftSidebar({
  state,
  currentDashboard,
  onOpenSearch,
  onCreateDashboard,
  onSelectDashboard,
  onRenameDashboard,
  onDeleteDashboard,
  onAddTab,
  onResetAll,
}: LeftSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  return (
    <aside className="w-64 flex flex-col bg-[var(--color-bg)] shrink-0">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-divider)] hover:bg-[var(--color-surface)]/30 transition-colors"
      >
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-accent)] to-[#6b5aff] text-white font-semibold text-[var(--font-body-sm)]">
          FA
        </span>
        <div className="leading-tight">
          <p className="text-[var(--font-body-sm)] font-semibold tracking-tight">
            FIN AI
          </p>
          <p className="text-[10px] tracking-[0.18em] text-[var(--color-text-subtle)] font-mono">
            研究工作台
          </p>
        </div>
      </Link>

      {/* Search */}
      <div className="px-3 py-3 border-b border-[var(--color-divider)]">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 px-2.5 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-subtle)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)] transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[var(--font-body-sm)] flex-1 text-left">搜索股票</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* My Dashboards */}
      <nav className="px-3 py-3 flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <p className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono">
            我的仪表盘
          </p>
          <button
            onClick={onCreateDashboard}
            className="text-[var(--color-text-subtle)] hover:text-[var(--color-accent)] p-0.5 rounded transition-colors"
            aria-label="新建仪表盘"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <ul className="space-y-0.5">
          {state.dashboards.map((d) => {
            const active = d.id === currentDashboard.id;
            const isEditing = editingId === d.id;
            return (
              <li key={d.id} className="relative">
                {isEditing ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                      if (editingName.trim()) {
                        onRenameDashboard(d.id, editingName.trim());
                      }
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      } else if (e.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    className="w-full px-2 py-1.5 bg-[var(--color-surface-2)] border border-[var(--color-accent)] rounded text-[var(--font-body-sm)] text-[var(--color-text)] outline-none"
                  />
                ) : (
                  <div
                    className={`group w-full flex items-center gap-2 px-2 py-1.5 text-[var(--font-body-sm)] rounded transition-colors ${
                      active
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    <button
                      onClick={() => onSelectDashboard(d.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                      <span className="flex-1 truncate">{d.name}</span>
                      {active && (
                        <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] shrink-0" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === d.id ? null : d.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] p-0.5 rounded transition-opacity shrink-0"
                      aria-label="更多操作"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {menuOpenId === d.id && (
                  <div className="absolute right-0 top-full mt-1 z-10 min-w-[120px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-[var(--shadow-elevated)] py-1">
                    <button
                      onClick={() => {
                        setEditingId(d.id);
                        setEditingName(d.name);
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[var(--font-body-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                    >
                      重命名
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(`确定删除仪表盘「${d.name}」吗？此操作不可撤销`)
                        ) {
                          onDeleteDashboard(d.id);
                        }
                        setMenuOpenId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[var(--font-body-sm)] text-[var(--color-danger)] hover:bg-[var(--color-surface-2)] flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 px-2 mb-1.5 flex items-center justify-between text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono">
          <span>快速添加卡片</span>
          <span
            className={
              currentDashboard.tabs.length >= MAX_WIDGETS_PER_DASHBOARD
                ? "text-[var(--color-down)]"
                : ""
            }
          >
            {currentDashboard.tabs.length} / {MAX_WIDGETS_PER_DASHBOARD}
          </span>
        </div>
        <div className="space-y-0.5">
          {(() => {
            const full = currentDashboard.tabs.length >= MAX_WIDGETS_PER_DASHBOARD;
            return (
              <>
                <QuickAdd
                  icon={Activity}
                  label="实时行情"
                  disabled={full}
                  onClick={() => onAddTab("quote_card", "实时行情")}
                />
                <QuickAdd
                  icon={Wallet}
                  label="估值与市值"
                  disabled={full}
                  onClick={() => onAddTab("valuation", "估值与市值")}
                />
                <QuickAdd
                  icon={LineChart}
                  label="K 线 + 指标"
                  disabled={full}
                  onClick={() => onAddTab("kline", "新 K 线")}
                />
                <QuickAdd
                  icon={FileText}
                  label="财报快照"
                  disabled={full}
                  onClick={() => onAddTab("fundamental", "财报快照")}
                />
                <QuickAdd
                  icon={Users}
                  label="股东结构"
                  disabled={full}
                  onClick={() => onAddTab("holders", "股东结构")}
                />
                <QuickAdd
                  icon={PencilLine}
                  label="分析师研判"
                  disabled={full}
                  onClick={() => onAddTab("research", "分析师研判")}
                />
              </>
            );
          })()}
        </div>
        {currentDashboard.tabs.length >= MAX_WIDGETS_PER_DASHBOARD && (
          <p className="mt-2 px-2 text-[10px] text-[var(--color-down)] font-mono leading-tight">
            已达上限 · 关闭一张卡片再添加
          </p>
        )}
      </nav>

      <div className="px-4 py-3 border-t border-[var(--color-divider)] flex items-center justify-between gap-2">
        <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono">
          v0.2.0
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (
                confirm(
                  "确定要重置所有仪表盘和对话历史吗？此操作不可撤销",
                )
              ) {
                onResetAll();
              }
            }}
            className="text-[var(--color-text-subtle)] hover:text-[var(--color-text)] p-1 rounded transition-colors"
            aria-label="重置演示"
            title="重置演示（清除本地缓存）"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <Link
            href="/analyst"
            className="text-[var(--color-text-subtle)] hover:text-[var(--color-accent)] p-1 rounded transition-colors"
            aria-label="分析师工作台"
            title="分析师工作台"
          >
            <PencilLine className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function QuickAdd({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 text-[var(--font-body-sm)] rounded transition-colors ${
        disabled
          ? "text-[var(--color-text-subtle)] opacity-40 cursor-not-allowed"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface)]"
      }`}
      title={disabled ? "已达卡片上限" : undefined}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
      <span className="flex-1 text-left">{label}</span>
      <Plus className="w-3 h-3 opacity-50" />
    </button>
  );
}

function EmptyState({
  onOpenSearch,
}: {
  onOpenSearch: () => void;
}) {
  return (
    <div className="h-full grid place-items-center text-center px-6">
      <div className="max-w-md">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] mb-4">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-[var(--font-h4)] font-medium mb-2">
          这是一个空仪表盘
        </h2>
        <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] mb-6 leading-relaxed">
          点击「⌘K 搜索」开始研究一只股票，或在左下「分析师工作台」录入研判。
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onOpenSearch}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-[var(--font-body-sm)] font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            搜索股票
          </button>
          <Link
            href="/analyst"
            className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-[var(--font-body-sm)] font-medium hover:border-[var(--color-accent)] transition-colors"
          >
            发布研判
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Widget Renderer
 * ============================================================ */
function WidgetIcon({ kind }: { kind: WidgetKind }) {
  const Icon =
    kind === "kline"
      ? LineChart
      : kind === "fundamental"
        ? FileText
        : kind === "research"
          ? PencilLine
          : kind === "quote_card"
            ? Activity
            : kind === "valuation"
              ? Wallet
              : Users;
  return (
    <Icon
      className="w-3.5 h-3.5 text-[var(--color-text-subtle)]"
      strokeWidth={1.75}
    />
  );
}

function WidgetRenderer({ tab }: { tab: Tab }) {
  if (tab.widget === "kline") return <KLineWidget symbol={tab.symbol} />;
  if (tab.widget === "fundamental") return <FundamentalWidget symbol={tab.symbol} />;
  if (tab.widget === "research") return <ResearchNotesWidget symbol={tab.symbol} />;
  if (tab.widget === "quote_card") return <QuoteCardWidget symbol={tab.symbol} />;
  if (tab.widget === "valuation") return <ValuationCardWidget symbol={tab.symbol} />;
  return <HoldersWidget symbol={tab.symbol} />;
}

/* ============================================================
 * Widget Grid —— OpenBB 风格平铺
 * ============================================================ */
function WidgetGrid({
  tabs,
  onCloseTab,
  onFocusTab,
  activeTabId,
}: {
  tabs: Tab[];
  onCloseTab: (id: string) => void;
  onFocusTab: (id: string) => void;
  activeTabId?: string;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 auto-rows-[minmax(180px,auto)]">
      {tabs.map((tab) => {
        const colSpan = tab.span ?? defaultSpanFor(tab.widget);
        const rowSpan = tab.rowSpan ?? defaultRowSpanFor(tab.widget);
        const active = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onFocusTab(tab.id)}
            className={`group relative rounded-md border-2 bg-[var(--color-surface)] overflow-hidden transition-all cursor-pointer ${
              active
                ? "border-[var(--color-accent)]"
                : "border-[var(--color-border-strong)] hover:border-[var(--color-accent-soft)]"
            }`}
            style={{
              gridColumn: `span ${colSpan} / span ${colSpan}`,
              gridRow: `span ${rowSpan} / span ${rowSpan}`,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--color-text-subtle)] hover:text-[var(--color-down)] hover:bg-[var(--color-surface-2)] transition-all"
              aria-label="关闭卡片"
              title="关闭"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <WidgetRenderer tab={tab} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * 不同 widget 默认占多少列（密集版：4 列网格）
 * - 小卡片（行情/估值/股东）占 1 列
 * - 中卡片（财报/研判）占 2 列
 * - K 线占 4 列（一整行）
 */
function defaultSpanFor(kind: WidgetKind): 1 | 2 | 3 | 4 {
  if (kind === "kline") return 4;
  if (kind === "research") return 2;
  if (kind === "fundamental") return 2;
  return 1;
}

function defaultRowSpanFor(kind: WidgetKind): 1 | 2 {
  if (kind === "kline") return 2;
  if (kind === "research") return 2;
  return 1;
}

function KLineWidget({ symbol }: { symbol: string }) {
  const [kline, setKline] = useState<KlinePoint[]>([]);
  const [quote, setQuote] = useState<{
    priceCents: number;
    changeCents: number;
    changePercent: number;
    volume: number;
    tradeDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/market/kline?symbol=${symbol}&limit=120`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        if (!cancelled) setKline(data.points ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "拉取失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    const pull = () => {
      fetch(`/api/market/quote?symbol=${symbol}`)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) return;
          if (!cancelled) setQuote(data);
        })
        .catch(() => {});
    };
    pull();
    const id = setInterval(pull, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  const stockName =
    findStock(symbol)?.name ??
    mockMarketData.find((m) => m.symbol === symbol)?.name ??
    symbol;

  const latest = kline[kline.length - 1];
  const tone: "up" | "down" | undefined = quote
    ? quote.changePercent >= 0
      ? "up"
      : "down"
    : undefined;

  return (
    <div className="flex flex-col h-full">
      <OpenBBCardHeader
        icon={LineChart}
        label="价格表现"
        symbolName={stockName}
        timestamp={quote?.tradeDate}
      />

      <div className="flex items-center gap-4 px-3 py-2 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/30 flex-wrap">
        <PriceField label="开盘" value={latest ? latest.open.toFixed(2) : "—"} />
        <PriceField label="最高" value={latest ? latest.high.toFixed(2) : "—"} />
        <PriceField label="最低" value={latest ? latest.low.toFixed(2) : "—"} />
        <PriceField
          label="收盘"
          value={quote ? (quote.priceCents / 100).toFixed(2) : "—"}
          tone={tone}
          change={
            quote
              ? `${quote.changeCents >= 0 ? "+" : ""}${(quote.changeCents / 100).toFixed(2)} (${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)`
              : undefined
          }
        />
        <PriceField
          label="成交"
          value={quote ? `${(quote.volume / 10000).toFixed(1)} 万手` : "—"}
        />
        <span className="ml-auto flex items-center gap-1.5 text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] pulse-dot" />
          每 30 秒刷新
        </span>
      </div>

      <div className="flex-1 px-3 py-3 min-h-[300px]">
        {loading ? (
          <div className="h-full grid place-items-center text-[var(--color-text-subtle)] font-mono text-[var(--font-body-sm)]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>正在拉取 {symbol} 行情...</span>
            </div>
          </div>
        ) : error ? (
          <div className="h-full grid place-items-center text-[var(--color-danger)] font-mono text-[var(--font-body-sm)] text-center">
            <div>
              <p>⚠️ {error}</p>
              <p className="mt-2 text-[var(--font-micro)] text-[var(--color-text-subtle)]">
                请检查 Tushare token 和积分余额
              </p>
            </div>
          </div>
        ) : (
          <KlineChart points={kline} height={300} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}

interface FundamentalSnapshot {
  symbol: string;
  period: string;
  revenue: number | null;
  revenueYoY: number | null;
  netProfit: number | null;
  netProfitYoY: number | null;
  grossMargin: number | null;
  roe: number | null;
  source: string;
}

function FundamentalWidget({ symbol }: { symbol: string }) {
  const stockName = findStock(symbol)?.name ?? "—";
  const [data, setData] = useState<FundamentalSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch(`/api/market/fundamental?symbol=${symbol}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
        if (!cancelled) setData(json as FundamentalSnapshot);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "拉取失败");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    queueMicrotask(load);
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <div className="flex flex-col">
      <OpenBBCardHeader
        icon={FileText}
        label="财务快照"
        symbolName={stockName}
        timestamp={data?.period}
      />
      <div className="p-3 space-y-3 overflow-auto scrollbar-thin">
        {loading && (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse h-[70px]"
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--font-body-sm)] text-[var(--color-text-muted)] space-y-2">
            <div className="font-medium text-[var(--color-text)]">财报数据暂不可用</div>
            <div className="font-mono text-[var(--font-micro)] text-[var(--color-text-subtle)]">
              {error}
            </div>
            {error.includes("频率超限") && (
              <div className="text-[var(--font-micro)] text-[var(--color-text-subtle)]">
                Tushare 财务接口限频（income 1 次/小时、fina_indicator 1 次/分钟）。
                数据已缓存 1 小时，请稍后再切回本 widget。
              </div>
            )}
          </div>
        )}

        {data && !loading && !error && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <BigStat
                label="营业收入"
                value={formatCnAmount(data.revenue)}
                detail={formatYoY(data.revenueYoY)}
                tone={toneOfYoY(data.revenueYoY)}
              />
              <BigStat
                label="归母净利"
                value={formatCnAmount(data.netProfit)}
                detail={formatYoY(data.netProfitYoY)}
                tone={toneOfYoY(data.netProfitYoY)}
              />
              <BigStat
                label="毛利率"
                value={formatPercent(data.grossMargin)}
                detail="销售毛利率"
              />
              <BigStat
                label="ROE"
                value={formatPercent(data.roe)}
                detail="净资产收益率"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ResearchNotesWidget({ symbol }: { symbol: string }) {
  const stockName = findStock(symbol)?.name ?? "—";
  const [notes, setNotes] = useState<AnalystNote[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setNotes(listNotesBySymbol(symbol));
      setLoaded(true);
    });
  }, [symbol]);

  return (
    <div className="flex flex-col">
      <OpenBBCardHeader
        icon={PencilLine}
        label={`分析师研判 (${notes.length})`}
        symbolName={stockName}
      />
      <div className="p-3 space-y-2 overflow-auto scrollbar-thin">
        {loaded && notes.length === 0 && (
          <div className="p-8 text-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)]">
            <PencilLine className="w-8 h-8 mx-auto mb-3 opacity-40 text-[var(--color-text-subtle)]" />
            <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] mb-3">
              该标的还没有分析师研判
            </p>
            <Link
              href="/analyst"
              className="inline-block px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-[var(--font-body-sm)] font-medium hover:opacity-90 transition-opacity"
            >
              前往分析师工作台发布
            </Link>
          </div>
        )}

        {notes.map((note) => (
          <article
            key={note.id}
            className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)]"
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded text-[var(--font-micro)] font-mono font-medium"
                style={{
                  background: "var(--color-surface-2)",
                  color: stanceColor(note.stance),
                }}
              >
                {stanceLabel(note.stance)}
              </span>
              <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono">
                {confidenceLabel(note.confidence)}
              </span>
              <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono ml-auto">
                有效至 {note.validUntil}
              </span>
            </div>
            <h3 className="text-[var(--font-body-lg)] font-medium mb-2">
              {note.title}
            </h3>
            <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap mb-3">
              {note.body}
            </p>
            <div className="flex items-center justify-between text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono pt-3 border-t border-[var(--color-divider)]">
              <span>— {note.analyst}</span>
              <span>
                {new Date(note.createdAt).toLocaleString("zh-CN", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </article>
        ))}

        {notes.length > 0 && (
          <div className="text-center pt-2">
            <Link
              href="/analyst"
              className="text-[var(--font-micro)] font-mono text-[var(--color-text-subtle)] hover:text-[var(--color-accent)] transition-colors"
            >
              ↗ 前往分析师工作台管理
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Helper UI
 * ============================================================ */
function PriceField({
  label,
  value,
  tone,
  change,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
  change?: string;
}) {
  const color =
    tone === "up"
      ? "var(--color-up)"
      : tone === "down"
        ? "var(--color-down)"
        : "var(--color-text)";
  return (
    <div className="flex flex-col">
      <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] mb-0.5">
        {label}
      </span>
      <span
        className="num font-mono text-[var(--font-body)] font-semibold leading-none"
        style={{ color }}
      >
        {value}
      </span>
      {change && (
        <span
          className="num font-mono text-[var(--font-micro)] mt-1"
          style={{ color }}
        >
          {change}
        </span>
      )}
    </div>
  );
}

function BigStat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "up" | "down";
}) {
  const color =
    tone === "up"
      ? "var(--color-up)"
      : tone === "down"
        ? "var(--color-down)"
        : "var(--color-text)";
  return (
    <div className="p-2.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-1">
        {label}
      </p>
      <p
        className="num font-mono text-[18px] leading-none font-semibold"
        style={{ color }}
      >
        {value}
      </p>
      {detail && (
        <p
          className="text-[10px] mt-1 num font-mono"
          style={{ color: tone ? color : "var(--color-text-muted)" }}
        >
          {detail}
        </p>
      )}
    </div>
  );
}

function Message({
  message,
  onContactAnalyst,
}: {
  message: ChatMessage;
  onContactAnalyst: () => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-3.5 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-accent)] text-white text-[var(--font-body-sm)] leading-relaxed">
          {message.refs && message.refs.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {message.refs.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono"
                >
                  <AtSign className="w-2.5 h-2.5" />
                  {r}
                </span>
              ))}
            </div>
          )}
          <p>{stripRefs(message.content)}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Bot className="w-3 h-3" />
        </span>
        <span className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono">
          FIN AI
        </span>
        {message.confidence && (
          <ConfidenceBadge
            level={message.confidence}
            score={message.score}
            className="ml-auto"
          />
        )}
      </div>
      {message.progress && (
        <div className="pl-7">
          <ProgressTimeline
            dense
            steps={PROGRESS_STEP_DEFS.map((def) => ({
              key: def.key,
              label: def.label,
              status: message.progress!.steps[def.key] ?? "pending",
            }))}
          />
        </div>
      )}
      {message.content && <MarkdownLite text={message.content} className="pl-7" />}
      {message.sources && (
        <div className="flex flex-wrap items-center gap-1.5 pl-7 pt-1">
          {message.sources.map((s, i) => (
            <SourceBadge key={i} source={s.source} timestamp={s.timestamp} />
          ))}
        </div>
      )}
      {message.handoff && (
        <div className="pl-7 pt-1">
          <button
            onClick={onContactAnalyst}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-[var(--font-micro)] font-medium bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
          >
            <Phone className="w-3 h-3" />
            立即联系分析师
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Util
 * ============================================================ */
function extractRefs(input: string): string[] {
  const matches = input.match(/@([^\s@]+(?:\s[^\s@]+)*)/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1).trim()).filter(Boolean);
}

function stripRefs(input: string): string {
  return input.replace(/@[^\s@]+(?:\s[^\s@]+)*\s?/g, "").trim() || input;
}

/**
 * 把元为单位的数字格式化为中文阅读习惯（亿/万）
 */
function formatCnAmount(yuan: number | null): string {
  if (yuan == null || Number.isNaN(yuan)) return "—";
  const abs = Math.abs(yuan);
  if (abs >= 1e8) return `${(yuan / 1e8).toFixed(1)} 亿`;
  if (abs >= 1e4) return `${(yuan / 1e4).toFixed(1)} 万`;
  return yuan.toFixed(0);
}

function formatPercent(pct: number | null): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  return `${pct.toFixed(2)}%`;
}

function formatYoY(pct: number | null): string {
  if (pct == null || Number.isNaN(pct)) return "同比 —";
  const sign = pct >= 0 ? "+" : "";
  return `同比 ${sign}${pct.toFixed(1)}%`;
}

function toneOfYoY(pct: number | null): "up" | "down" | undefined {
  if (pct == null || Number.isNaN(pct)) return undefined;
  return pct >= 0 ? "up" : "down";
}

function describeWidget(kind: WidgetKind): string {
  switch (kind) {
    case "kline":
      return "K 线 + 技术指标";
    case "fundamental":
      return "财报快照与基本面数据";
    case "research":
      return "分析师研判";
    case "quote_card":
      return "实时行情卡（现价/涨跌/量比/换手率）";
    case "valuation":
      return "估值卡（PE/PB/市值/股息率）";
    case "holders":
      return "前 10 大流通股东";
  }
}

/**
 * 把当前标的有效的分析师研判格式化为可注入 LLM 的 markdown
 * 返回 null 表示没有任何有效研判
 */
function formatAnalystNotesForLLM(symbol: string): {
  text: string;
  sources: WidgetContextSource[];
} | null {
  const notes = listNotesBySymbol(symbol);
  if (notes.length === 0) return null;

  const lines: string[] = ["# 分析师研判库（来自本地研判库，须严格转述）"];
  const sources: WidgetContextSource[] = [];

  notes.forEach((n, idx) => {
    lines.push(
      `\n## 研判 ${idx + 1}：${n.title}`,
      `- 倾向：${stanceLabel(n.stance)}`,
      `- 置信度：${confidenceLabel(n.confidence)}`,
      `- 分析师：${n.analyst}`,
      `- 有效期至：${n.validUntil}`,
      `- 内容：${n.body}`,
    );
    sources.push({
      source: `${n.analyst} · ${stanceLabel(n.stance)}`,
      timestamp: new Date(n.createdAt).toLocaleDateString("zh-CN"),
    });
  });

  lines.push(
    "",
    "# 引用规则",
    "1. 回答时必须明确说出是哪位分析师的观点（如『张明老师在 X 月 X 日的研判中提到……』）",
    "2. 不可改写分析师的核心结论；可以用更通俗的话转述细节",
    "3. 若研判倾向是『谨慎』，必须把风险点呈现出来，不可只挑利好转述",
    "4. 不要把分析师的研判说成 AI 的判断 —— 你只是转述者",
  );

  return { text: lines.join("\n"), sources };
}

/**
 * 数据源徽章 —— 跟着 AI 回复一起渲染，标明本次回答用了哪些真实数据
 */
interface WidgetContextSource {
  source: string;
  timestamp?: string;
}

/**
 * 构造 widget 上下文 —— AI 真上下文的关键
 *
 * 不只告诉 AI"用户在看哪个 widget"，还把 widget 的真实数据快照塞进去；
 * 同时返回本次注入的数据源列表，供前端在 AI 回复下方渲染徽章。
 */
async function buildWidgetContext(
  tab: Tab,
): Promise<{ context: string; sources: WidgetContextSource[] }> {
  const baseInfo = `用户当前正在查看的 widget：${tab.title}（类型：${describeWidget(tab.widget)}，标的：${tab.symbol}）。`;
  const sources: WidgetContextSource[] = [];

  // 全 widget 通用：把当前标的的所有有效分析师研判都注入
  // 这是 MVP 闭环的核心 —— AI 始终能引用分析师观点，不只在 research widget 里
  const analystBlock = formatAnalystNotesForLLM(tab.symbol);
  const analystSection = analystBlock ? `\n\n${analystBlock.text}` : "";
  if (analystBlock) sources.push(...analystBlock.sources);

  // K 线 widget：拉真实最新价 + 最近 5 日 K 数据
  if (tab.widget === "kline") {
    try {
      const [quoteRes, klineRes] = await Promise.all([
        fetch(`/api/market/quote?symbol=${tab.symbol}`).then((r) =>
          r.ok ? r.json() : null,
        ),
        fetch(`/api/market/kline?symbol=${tab.symbol}&limit=5`).then((r) =>
          r.ok ? r.json() : null,
        ),
      ]);

      const lines: string[] = [baseInfo, "", "# 当前 widget 的真实数据快照"];

      if (quoteRes && !quoteRes.error) {
        const price = (quoteRes.priceCents / 100).toFixed(2);
        const change = (quoteRes.changeCents / 100).toFixed(2);
        const pct = quoteRes.changePercent.toFixed(2);
        const sign = quoteRes.changeCents >= 0 ? "+" : "";
        lines.push(
          `- 最新价：¥${price}（${sign}${change} / ${sign}${pct}%）`,
          `- 成交量：${(quoteRes.volume / 10000).toFixed(1)} 万手`,
          `- 交易日：${quoteRes.tradeDate}`,
          `- 数据源：Tushare · 上交所/深交所`,
        );
        sources.push({
          source: "Tushare · 日线行情",
          timestamp: quoteRes.tradeDate,
        });
      }

      if (klineRes?.points?.length) {
        lines.push("", "# 最近 5 个交易日 K 线（OHLC）");
        const points = klineRes.points as {
          time: string;
          open: number;
          high: number;
          low: number;
          close: number;
          changePercent: number;
        }[];
        points.forEach((p) => {
          const sign = p.changePercent >= 0 ? "+" : "";
          lines.push(
            `- ${p.time}：开 ${p.open.toFixed(2)} / 高 ${p.high.toFixed(2)} / 低 ${p.low.toFixed(2)} / 收 ${p.close.toFixed(2)}（${sign}${p.changePercent.toFixed(2)}%）`,
          );
        });
      }

      lines.push(
        "",
        "请基于以上真实行情数据回答用户问题。所有数字必须引用上方数据，不要编造。",
      );
      return { context: lines.join("\n") + analystSection, sources };
    } catch {
      return {
        context:
          baseInfo +
          "\n\n（注：本应注入真实行情数据，但拉取失败，请告知用户当前数据不可用）" +
          analystSection,
        sources: analystBlock
          ? [...analystBlock.sources, { source: `${tab.title} · 数据拉取失败` }]
          : [{ source: `${tab.title} · 数据拉取失败` }],
      };
    }
  }

  // 财报 widget：接真 Tushare fina_indicator + income
  if (tab.widget === "fundamental") {
    try {
      const res = await fetch(
        `/api/market/fundamental?symbol=${tab.symbol}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);

      const lines: string[] = [
        baseInfo,
        "",
        "# 当前 widget 的真实财务快照",
        `- 报告期：${json.period}`,
        `- 营业收入：${formatCnAmount(json.revenue)}（${formatYoY(json.revenueYoY)}）`,
        `- 归母净利：${formatCnAmount(json.netProfit)}（${formatYoY(json.netProfitYoY)}）`,
        `- 毛利率：${formatPercent(json.grossMargin)}`,
        `- ROE：${formatPercent(json.roe)}`,
        `- 数据源：${json.source}`,
        "",
        "请基于以上真实财务数据回答用户问题。数字必须引用上方数据，不要编造。",
      ];
      sources.push({ source: json.source, timestamp: json.period });
      return { context: lines.join("\n") + analystSection, sources };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "财报数据拉取失败";
      const errSources: WidgetContextSource[] = analystBlock
        ? [...analystBlock.sources, { source: "财报接口排队中" }]
        : [{ source: "财报接口排队中" }];
      return {
        context:
          [
            baseInfo,
            "",
            `# 当前 widget 的财报数据暂不可用（${message}）`,
            "请告诉用户：财报数据暂未获取到，建议稍后再问或查阅原始公告。",
            "Tushare 财务接口限频 1 次/分钟，可能正在排队。",
          ].join("\n") + analystSection,
        sources: errSources,
      };
    }
  }

  // 行情卡：拉真实 quote-card 数据
  if (tab.widget === "quote_card") {
    try {
      const res = await fetch(`/api/market/quote-card?symbol=${tab.symbol}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      const lines = [
        baseInfo,
        "",
        "# 当前 widget 显示的实时行情",
        `- 交易日：${json.tradeDate}`,
        `- 现价：¥${(json.priceCents / 100).toFixed(2)}`,
        `- 涨跌：${json.changeCents >= 0 ? "+" : ""}${(json.changeCents / 100).toFixed(2)} (${json.changePercent.toFixed(2)}%)`,
        `- 振幅：${json.amplitudePercent.toFixed(2)}%`,
        `- 换手率：${json.turnoverRate != null ? json.turnoverRate.toFixed(2) + "%" : "—"}`,
        `- 量比：${json.volumeRatio != null ? json.volumeRatio.toFixed(2) : "—"}`,
        `- 成交量：${(json.volume / 10000).toFixed(1)} 万手`,
        `- 成交额：${(json.amount / 1e5).toFixed(2)} 亿`,
      ];
      sources.push({ source: json.source, timestamp: json.tradeDate });
      return { context: lines.join("\n") + analystSection, sources };
    } catch {
      return {
        context: baseInfo + analystSection,
        sources: analystBlock ? analystBlock.sources : [{ source: "行情卡接口失败" }],
      };
    }
  }

  // 估值卡：拉真实 valuation 数据
  if (tab.widget === "valuation") {
    try {
      const res = await fetch(`/api/market/valuation?symbol=${tab.symbol}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      const fmt = (v: number | null) => (v == null ? "—" : v.toFixed(2));
      const fmtCny = (v: number | null) => {
        if (v == null) return "—";
        if (Math.abs(v) >= 1e8) return `${(v / 1e8).toFixed(1)} 亿`;
        return `${(v / 1e4).toFixed(1)} 万`;
      };
      const lines = [
        baseInfo,
        "",
        "# 当前 widget 显示的估值快照",
        `- 交易日：${json.tradeDate}`,
        `- 市盈率 PE：${fmt(json.pe)} · TTM：${fmt(json.peTtm)}`,
        `- 市净率 PB：${fmt(json.pb)}`,
        `- 市销率 PS：${fmt(json.ps)} · TTM：${fmt(json.psTtm)}`,
        `- 股息率：${fmt(json.dvRatio)}% · TTM：${fmt(json.dvTtm)}%`,
        `- 总市值：${fmtCny(json.totalMv)}`,
        `- 流通市值：${fmtCny(json.circMv)}`,
      ];
      sources.push({ source: json.source, timestamp: json.tradeDate });
      return { context: lines.join("\n") + analystSection, sources };
    } catch {
      return {
        context: baseInfo + analystSection,
        sources: analystBlock ? analystBlock.sources : [{ source: "估值接口失败" }],
      };
    }
  }

  // 股东结构：拉真实 holders 数据
  if (tab.widget === "holders") {
    try {
      const res = await fetch(`/api/market/holders?symbol=${tab.symbol}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      type H = { holderName: string; holdRatio: number | null; holdChange: number | null };
      const lines = [
        baseInfo,
        "",
        `# 当前 widget 显示的前 10 大流通股东（报告期 ${json.endDate}）`,
        ...(json.holders as H[]).map(
          (h, i) =>
            `${i + 1}. ${h.holderName} · 持股比例 ${h.holdRatio != null ? h.holdRatio.toFixed(2) + "%" : "—"}${
              h.holdChange != null && h.holdChange !== 0
                ? `（${h.holdChange > 0 ? "增持" : "减持"} ${Math.abs(h.holdChange / 1e4).toFixed(1)} 万股）`
                : ""
            }`,
        ),
      ];
      sources.push({ source: json.source, timestamp: json.endDate });
      return { context: lines.join("\n") + analystSection, sources };
    } catch {
      return {
        context: baseInfo + analystSection,
        sources: analystBlock ? analystBlock.sources : [{ source: "股东接口失败" }],
      };
    }
  }

  // 研判 widget：分析师研判是主体
  if (tab.widget === "research") {
    if (analystBlock) {
      return {
        context:
          baseInfo +
          "\n\n用户正在查看分析师研判 widget。请围绕下方研判内容回答用户问题，明确引用具体哪位分析师的观点。" +
          analystSection,
        sources,
      };
    }
    return {
      context: [
        baseInfo,
        "",
        "# 该标的暂无有效的分析师研判",
        "请告诉用户：目前该标的还没有分析师研判，",
        "建议联系您的分析师老师本人，或先看 K 线 / 财报 widget 了解客观数据。",
      ].join("\n"),
      sources: [{ source: "暂无研判" }],
    };
  }

  return { context: baseInfo + analystSection, sources };
}
