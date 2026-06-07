/**
 * FIN AI · Agent Loop 工具定义
 *
 * 暴露给 LLM 的 4 个工具：
 * 1. fetch_quote            —— 拉某只股票的最新行情（Tushare 真数据）
 * 2. fetch_fundamental      —— 拉某只股票的最近一期财报（Tushare 真数据）
 * 3. search_analyst_notes   —— 在知识库三维索引上检索分析师研判
 * 4. detect_conflicting_views —— 同一标的不同分析师观点冲突检测
 *
 * 工具的 schema 用 OpenAI function calling 标准（OpenRouter 兼容）
 */

import { fetchLatestQuote, fetchFundamentalSnapshot } from "@/lib/tushare";
import {
  NOTE_TYPE_LABELS,
  type AnalystNote,
  type NoteType,
  type AnalystStance,
} from "@/lib/analyst-notes";

// ============================================================
// JSON Schema（给 LLM 看的）
// ============================================================

export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "fetch_quote",
      description:
        "拉某只 A 股的最新日线行情（包括最新价、涨跌额、涨跌幅、成交量、交易日）。当你需要回答用户关于价格、涨跌的问题时使用。",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "6 位股票代码，例如 600519、002594",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "fetch_fundamental",
      description:
        "拉某只 A 股的最近一期财务快照（营收、净利、毛利率、ROE、同比）。当用户问基本面、财报、盈利能力时使用。注意：Tushare 接口有限频，调用前确认必要性。",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "6 位股票代码",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_analyst_notes",
      description:
        "在分析师研判知识库的三维索引（品种/时间/研判类型）上检索研判。这是产品的核心知识库，所有方向性回答都必须先查这里。",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "可选：6 位股票代码，按标的过滤",
          },
          tag: {
            type: "string",
            description: "可选：品种/行业/主题标签，按标签过滤（如『白酒』『新能源车』）",
          },
          note_type: {
            type: "string",
            enum: [
              "event_driven",
              "valuation",
              "trend",
              "risk_alert",
              "earnings_review",
            ],
            description:
              "可选：研判类型 — event_driven(事件驱动) / valuation(估值修复) / trend(趋势跟踪) / risk_alert(风险预警) / earnings_review(财报点评)",
          },
          start_date: {
            type: "string",
            description: "可选：开始日期 YYYY-MM-DD",
          },
          end_date: {
            type: "string",
            description: "可选：结束日期 YYYY-MM-DD",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "detect_conflicting_views",
      description:
        "对某只股票检测不同分析师观点是否冲突（一位看好另一位谨慎）。当 search_analyst_notes 返回 ≥ 2 条研判时，应该调用这个工具检查冲突；如果有冲突，必须在回答里告知散户。",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "6 位股票代码",
          },
        },
        required: ["symbol"],
      },
    },
  },
] as const;

// ============================================================
// 工具执行：server-side dispatcher
// ============================================================

export interface ToolCallResult {
  ok: boolean;
  /** 给 LLM 看的 JSON-stringify 后的字符串 */
  payload: string;
  /** 给前端"推理轨迹"展示的简短描述 */
  summary: string;
}

/**
 * 知识库快照：前端把 localStorage 里的 notes 通过请求体传过来
 * （localStorage 在 server 端读不到）
 */
export type NotesSnapshot = AnalystNote[];

/**
 * 工具调度器：根据工具名 + 参数 + 快照，返回执行结果
 */
export async function executeAgentTool(
  toolName: string,
  args: Record<string, unknown>,
  notesSnapshot: NotesSnapshot,
): Promise<ToolCallResult> {
  try {
    switch (toolName) {
      case "fetch_quote":
        return await runFetchQuote(args.symbol as string);
      case "fetch_fundamental":
        return await runFetchFundamental(args.symbol as string);
      case "search_analyst_notes":
        return runSearchNotes(args, notesSnapshot);
      case "detect_conflicting_views":
        return runDetectConflicts(args.symbol as string, notesSnapshot);
      default:
        return {
          ok: false,
          payload: JSON.stringify({ error: `未知工具：${toolName}` }),
          summary: `❌ 未知工具：${toolName}`,
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "工具执行异常";
    return {
      ok: false,
      payload: JSON.stringify({ error: msg }),
      summary: `❌ ${toolName} 调用失败：${msg}`,
    };
  }
}

async function runFetchQuote(symbol: string): Promise<ToolCallResult> {
  if (!symbol || !/^\d{6}$/.test(symbol)) {
    return {
      ok: false,
      payload: JSON.stringify({ error: "symbol 必须是 6 位数字" }),
      summary: `❌ fetch_quote 参数无效`,
    };
  }
  const quote = await fetchLatestQuote(symbol);
  const price = (quote.priceCents / 100).toFixed(2);
  const change = (quote.changeCents / 100).toFixed(2);
  const sign = quote.changeCents >= 0 ? "+" : "";
  return {
    ok: true,
    payload: JSON.stringify({
      symbol: quote.symbol,
      price_yuan: Number(price),
      change_yuan: Number(change),
      change_percent: quote.changePercent,
      volume_lots: quote.volume,
      trade_date: quote.tradeDate,
      source: "Tushare · 日线行情",
    }),
    summary: `📈 拉取 ${symbol} 行情 → ¥${price}（${sign}${change} / ${sign}${quote.changePercent.toFixed(2)}%）`,
  };
}

async function runFetchFundamental(symbol: string): Promise<ToolCallResult> {
  if (!symbol || !/^\d{6}$/.test(symbol)) {
    return {
      ok: false,
      payload: JSON.stringify({ error: "symbol 必须是 6 位数字" }),
      summary: `❌ fetch_fundamental 参数无效`,
    };
  }
  const snap = await fetchFundamentalSnapshot(symbol);
  return {
    ok: true,
    payload: JSON.stringify({
      symbol: snap.symbol,
      period: snap.period,
      revenue_yuan: snap.revenue,
      revenue_yoy_percent: snap.revenueYoY,
      net_profit_yuan: snap.netProfit,
      net_profit_yoy_percent: snap.netProfitYoY,
      gross_margin_percent: snap.grossMargin,
      roe_percent: snap.roe,
      source: snap.source,
    }),
    summary: `📊 拉取 ${symbol} ${snap.period} 财报 → 营收同比 ${snap.revenueYoY?.toFixed(1) ?? "—"}% · 毛利率 ${snap.grossMargin?.toFixed(2) ?? "—"}%`,
  };
}

function runSearchNotes(
  args: Record<string, unknown>,
  snapshot: NotesSnapshot,
): ToolCallResult {
  const today = new Date().toISOString().slice(0, 10);
  const symbol = args.symbol as string | undefined;
  const tag = args.tag as string | undefined;
  const noteType = args.note_type as NoteType | undefined;
  const startDate = args.start_date as string | undefined;
  const endDate = args.end_date as string | undefined;

  const filtered = snapshot.filter((n) => {
    if (n.validUntil < today) return false;
    if (symbol && n.symbol !== symbol) return false;
    if (noteType && n.noteType !== noteType) return false;
    if (tag) {
      const tagLower = tag.toLowerCase();
      if (!n.tags.some((t) => t.toLowerCase().includes(tagLower))) return false;
    }
    if (startDate && n.createdAt.slice(0, 10) < startDate) return false;
    if (endDate && n.createdAt.slice(0, 10) > endDate) return false;
    return true;
  });

  const filters: string[] = [];
  if (symbol) filters.push(`标的 ${symbol}`);
  if (tag) filters.push(`#${tag}`);
  if (noteType) filters.push(NOTE_TYPE_LABELS[noteType]);
  if (startDate || endDate) filters.push(`${startDate ?? ""}~${endDate ?? ""}`);
  const filterDesc = filters.length > 0 ? filters.join("·") : "全部";

  return {
    ok: true,
    payload: JSON.stringify({
      count: filtered.length,
      filters: { symbol, tag, note_type: noteType, start_date: startDate, end_date: endDate },
      notes: filtered.map((n) => ({
        id: n.id,
        symbol: n.symbol,
        symbol_name: n.symbolName,
        stance: n.stance,
        title: n.title,
        body: n.body,
        analyst: n.analyst,
        cert_no: n.certNo,
        note_type: n.noteType,
        type_label: NOTE_TYPE_LABELS[n.noteType],
        tags: n.tags,
        confidence: n.confidence,
        created_at: n.createdAt,
        valid_until: n.validUntil,
      })),
    }),
    summary: `🔍 检索研判（${filterDesc}）→ 找到 ${filtered.length} 条`,
  };
}

function runDetectConflicts(
  symbol: string,
  snapshot: NotesSnapshot,
): ToolCallResult {
  if (!symbol || !/^\d{6}$/.test(symbol)) {
    return {
      ok: false,
      payload: JSON.stringify({ error: "symbol 必须是 6 位数字" }),
      summary: `❌ detect_conflicting_views 参数无效`,
    };
  }
  const today = new Date().toISOString().slice(0, 10);
  const notes = snapshot.filter(
    (n) => n.symbol === symbol && n.validUntil >= today,
  );
  const byStance = new Map<AnalystStance, AnalystNote[]>();
  for (const n of notes) {
    const arr = byStance.get(n.stance) ?? [];
    arr.push(n);
    byStance.set(n.stance, arr);
  }
  const hasBullish = byStance.has("bullish");
  const hasCautious = byStance.has("cautious");
  const hasConflict = hasBullish && hasCautious;

  return {
    ok: true,
    payload: JSON.stringify({
      symbol,
      has_conflict: hasConflict,
      stance_breakdown: [...byStance.entries()].map(([s, ns]) => ({
        stance: s,
        count: ns.length,
        analysts: ns.map((n) => n.analyst),
      })),
    }),
    summary: hasConflict
      ? `⚠️ ${symbol} 分析师观点存在冲突（看好 + 谨慎并存）`
      : `✓ ${symbol} 分析师观点无冲突`,
  };
}
