/**
 * FIN AI · 分析师研判（AnalystNote）持久层
 *
 * MVP 设计：
 * - 分析师在 /analyst 录入研判
 * - 散户在 workspace 看到这条研判被 AI 引用
 * - 闭环：分析师写 → 系统存 → AI 转述给散户
 *
 * 合规约束（继承自 .claude/rules/agent-boundary.md）：
 * - stance 字段不允许"买入/卖出"原词；用"看好/中性/谨慎"代替
 * - 研判必须有作者签名（分析师姓名）和时间戳，可追溯
 * - 散户端看到研判时，必须显示"来自 XX 分析师"，不能匿名
 */

export type AnalystStance = "bullish" | "neutral" | "cautious";
export type Confidence = "high" | "mid" | "low";

/**
 * 研判类型（知识库第二维：研判类型）
 * 用于让 AI 按类型检索知识库，例如"找最近 7 天的风险预警类研判"
 */
export type NoteType =
  | "event_driven" // 事件驱动（财报/政策/突发）
  | "valuation" // 估值修复
  | "trend" // 趋势跟踪（技术面 / 资金面）
  | "risk_alert" // 风险预警
  | "earnings_review"; // 财报点评

export interface AnalystNote {
  id: string;
  /** 6 位股票代码 */
  symbol: string;
  /** 标的名称（冗余存，避免 widget 端再查） */
  symbolName: string;
  /** 倾向（克制表述：看好/中性/谨慎，不允许买卖原词） */
  stance: AnalystStance;
  /** 一句话标题 */
  title: string;
  /** 研判正文（散户能直接看的口语化文字） */
  body: string;
  /** 分析师姓名（签名） */
  analyst: string;
  /** 置信度 */
  confidence: Confidence;
  /** 有效期至 YYYY-MM-DD（过了这个日期 AI 不再引用） */
  validUntil: string;
  /** ISO 时间戳 */
  createdAt: string;

  // ============ 知识库三维索引字段 ============
  /** 研判类型（第二维：研判类型） */
  noteType: NoteType;
  /** 品种 / 行业 / 主题标签（第一维：品种 —— 一条研判可属多类） */
  tags: string[];
  /** 分析师执业证编号（上线前必填，演示版可为空） */
  certNo?: string;
}

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  event_driven: "事件驱动",
  valuation: "估值修复",
  trend: "趋势跟踪",
  risk_alert: "风险预警",
  earnings_review: "财报点评",
};

const STORAGE_KEY = "finai.analyst-notes.v2";
const STORAGE_KEY_V1 = "finai.analyst-notes.v1";

// ------------------------------------------------------------
// CRUD
// ------------------------------------------------------------

function readAll(): AnalystNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AnalystNote[];
    }
    // 旧版数据迁移：v1 → v2（补默认 noteType + tags）
    const v1Raw = window.localStorage.getItem(STORAGE_KEY_V1);
    if (v1Raw) {
      const migrated = (JSON.parse(v1Raw) as Omit<AnalystNote, "noteType" | "tags">[]).map(
        (n) => ({
          ...n,
          noteType: "earnings_review" as NoteType,
          tags: [],
        }),
      );
      writeAll(migrated);
      window.localStorage.removeItem(STORAGE_KEY_V1);
      return migrated;
    }
    return seedNotes();
  } catch {
    return [];
  }
}

function writeAll(notes: AnalystNote[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function listNotes(): AnalystNote[] {
  return readAll().sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );
}

export function listNotesBySymbol(symbol: string): AnalystNote[] {
  const today = new Date().toISOString().slice(0, 10);
  return listNotes().filter(
    (n) => n.symbol === symbol && n.validUntil >= today,
  );
}

// ============================================================
// 知识库三维索引：品种 × 时间 × 研判类型
// 这是产品的"分析师能力产品化"护城河
// ============================================================

/**
 * 按标签（品种 / 行业 / 主题）检索
 * 维度一：品种
 */
export function listNotesByTag(tag: string): AnalystNote[] {
  const today = new Date().toISOString().slice(0, 10);
  const tagLower = tag.toLowerCase();
  return listNotes().filter(
    (n) =>
      n.validUntil >= today &&
      n.tags.some((t) => t.toLowerCase().includes(tagLower)),
  );
}

/**
 * 按时间窗口检索（含两端）
 * 维度二：时间
 */
export function listNotesByDateRange(
  startISODate: string,
  endISODate: string,
): AnalystNote[] {
  const today = new Date().toISOString().slice(0, 10);
  return listNotes().filter(
    (n) =>
      n.validUntil >= today &&
      n.createdAt.slice(0, 10) >= startISODate &&
      n.createdAt.slice(0, 10) <= endISODate,
  );
}

/**
 * 按研判类型检索
 * 维度三：研判类型
 */
export function listNotesByType(noteType: NoteType): AnalystNote[] {
  const today = new Date().toISOString().slice(0, 10);
  return listNotes().filter(
    (n) => n.validUntil >= today && n.noteType === noteType,
  );
}

/**
 * 组合检索：在三个维度上同时过滤
 * Agent Loop 里的 search_analyst_notes 工具用这个
 */
export function queryNotes(filters: {
  symbol?: string;
  tag?: string;
  noteType?: NoteType;
  /** YYYY-MM-DD */
  startDate?: string;
  /** YYYY-MM-DD */
  endDate?: string;
}): AnalystNote[] {
  const today = new Date().toISOString().slice(0, 10);
  return listNotes().filter((n) => {
    if (n.validUntil < today) return false;
    if (filters.symbol && n.symbol !== filters.symbol) return false;
    if (filters.noteType && n.noteType !== filters.noteType) return false;
    if (filters.tag) {
      const tagLower = filters.tag.toLowerCase();
      if (!n.tags.some((t) => t.toLowerCase().includes(tagLower))) return false;
    }
    if (filters.startDate && n.createdAt.slice(0, 10) < filters.startDate) {
      return false;
    }
    if (filters.endDate && n.createdAt.slice(0, 10) > filters.endDate) {
      return false;
    }
    return true;
  });
}

/**
 * 冲突分析师观点检测：同一标的的多位分析师，stance 出现分歧
 * 例如张明看好 + 李婷谨慎 → 必须提示散户存在分歧
 *
 * 返回：如果有冲突，给出冲突方分析师的 note；没有则返回空
 */
export function detectConflictingViews(symbol: string): {
  hasConflict: boolean;
  stances: { stance: AnalystStance; notes: AnalystNote[] }[];
} {
  const notes = listNotesBySymbol(symbol);
  const byStance = new Map<AnalystStance, AnalystNote[]>();
  for (const n of notes) {
    const arr = byStance.get(n.stance) ?? [];
    arr.push(n);
    byStance.set(n.stance, arr);
  }
  const stances = [...byStance.entries()].map(([stance, ns]) => ({
    stance,
    notes: ns,
  }));
  // 看好和谨慎同时出现，才算冲突；中性 vs 看好/谨慎 不算冲突
  const hasBullish = byStance.has("bullish");
  const hasCautious = byStance.has("cautious");
  return {
    hasConflict: hasBullish && hasCautious,
    stances,
  };
}

export function createNote(
  input: Omit<AnalystNote, "id" | "createdAt">,
): AnalystNote {
  const note: AnalystNote = {
    ...input,
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all.unshift(note);
  writeAll(all);
  return note;
}

export function deleteNote(id: string) {
  writeAll(readAll().filter((n) => n.id !== id));
}

export function resetNotes() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ------------------------------------------------------------
// 文案 helpers
// ------------------------------------------------------------

export function stanceLabel(s: AnalystStance): string {
  return { bullish: "看好", neutral: "中性", cautious: "谨慎" }[s];
}

export function stanceColor(s: AnalystStance): string {
  return {
    bullish: "var(--color-up)",
    neutral: "var(--color-text-subtle)",
    cautious: "var(--color-down)",
  }[s];
}

export function confidenceLabel(c: Confidence): string {
  return { high: "高置信", mid: "中置信", low: "低置信" }[c];
}

// ------------------------------------------------------------
// 演示用种子数据（仅当 localStorage 完全空时写一次）
// ------------------------------------------------------------

function seedNotes(): AnalystNote[] {
  if (typeof window === "undefined") return [];
  const today = new Date();
  const plus30 = new Date(today);
  plus30.setDate(plus30.getDate() + 30);
  const validUntil = plus30.toISOString().slice(0, 10);

  const seed: AnalystNote[] = [
    {
      id: "note_seed_1",
      symbol: "600519",
      symbolName: "贵州茅台",
      stance: "neutral",
      title: "短期不追高、跌到 1500 以下分批介入；长期定价权未变",
      body: "我的明确判断：当前位置不是好的加仓点，但也没到清仓的程度。\n\n核心理由：Q1 营收 +6.5% 低于预期（市场预期 8%），但毛利率 89.76% 说明价格端没崩——这是分水岭，只要毛利率没破 85%，长期逻辑就还在。\n\n操作上：1）不建议在当前位置追高；2）如果跌到 1500 元以下，可以分批关注（不是一把梭，是分 3 笔，每跌 5% 加一笔）；3）如果毛利率单季度跌破 85%，要重新评估。\n\n下个验证点：中秋动销数据（9 月底出）。届时如果动销超预期，可以加大仓位；如果继续疲软，要降仓。",
      analyst: "张明（白酒首席）",
      confidence: "high",
      noteType: "earnings_review",
      tags: ["白酒", "高端消费", "防御性资产"],
      certNo: "S0570521xxx (演示)",
      validUntil,
      createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "note_seed_2",
      symbol: "002594",
      symbolName: "比亚迪",
      stance: "bullish",
      title: "明确看好 · 当前位置可以建底仓，回调到 200 以下加仓",
      body: "我的明确判断：比亚迪是当前 A 股新能源里最值得拿的标的，建议作为底仓配置。\n\n核心理由：1）4 月海外销量 9.1 万辆同比 +110%，欧洲市占率突破 4%——这是质变，欧洲市场的定价能力比国内高 30%；2）垂直整合让单车成本比同行低 8000-12000 元，价格战里反而是受益方；3）Q2 业绩大概率超预期（我们预测同比 +35%，市场预期 +22%）。\n\n操作建议：1）当前位置可以建底仓（不超过仓位的 15%）；2）如果回调到 200 元以下，加到 20-25%；3）止损位放在 180 元（对应估值 PE 15x）。\n\n风险：欧盟反补贴税终裁（预计 6 月）。如果终裁加征 30% 以上，要立刻降仓 1/3。",
      analyst: "李婷（新能源高级分析师）",
      confidence: "high",
      noteType: "trend",
      tags: ["新能源车", "出海", "成长股"],
      certNo: "S0570520xxx (演示)",
      validUntil,
      createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: "note_seed_3",
      symbol: "300750",
      symbolName: "宁德时代",
      stance: "cautious",
      title: "明确谨慎 · 当前位置建议持币观望，已有仓位减到 5% 以下",
      body: "我的明确判断：宁德当前不是好的进场点，已经持有的建议把仓位降到 5% 以下，等右侧信号再加。\n\n核心理由：1）动力电池价格已跌至 0.4 元/Wh 历史低位，还在跌，看不到底；2）宁德 Q1 毛利率环比 -1.2pct，比同行下滑还快——说明它的成本护城河在变薄；3）储能业务 +180% 增长虽然好，但收入占比才 18%，对冲不动动力电池的下滑。\n\n操作建议：1）已有仓位减到 5% 以下；2）不建议现在加仓；3）等两个右侧信号同时出现：a) 碳酸锂价格连续 2 个月企稳；b) 储能收入占比突破 25%。这两个都满足后，可以重新评估。\n\n注意：这不是说宁德要崩，它的长期地位还在。只是当前位置赔率不好。",
      analyst: "王浩（电新行业资深）",
      confidence: "mid",
      noteType: "risk_alert",
      tags: ["新能源车", "动力电池", "周期股"],
      certNo: "S0570519xxx (演示)",
      validUntil,
      createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ];
  writeAll(seed);
  return seed;
}
