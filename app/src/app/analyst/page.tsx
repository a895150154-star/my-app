"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  PencilLine,
  Trash2,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import {
  createNote,
  deleteNote,
  listNotes,
  stanceLabel,
  stanceColor,
  confidenceLabel,
  NOTE_TYPE_LABELS,
  type AnalystNote,
  type AnalystStance,
  type Confidence,
  type NoteType,
} from "@/lib/analyst-notes";
import { searchStocks, findStock, type StockEntry } from "@/lib/stock-list";

/**
 * /analyst —— 分析师发布研判页
 *
 * MVP 闭环里的 #1：分析师写一条研判 → 系统存储 → workspace AI 引用
 */
export default function AnalystPage() {
  const [notes, setNotes] = useState<AnalystNote[]>([]);
  const [refresh, setRefresh] = useState(0);

  // 表单状态
  const [symbol, setSymbol] = useState("");
  const [symbolName, setSymbolName] = useState("");
  const [symbolQuery, setSymbolQuery] = useState("");
  const [showStockPicker, setShowStockPicker] = useState(false);
  const [stance, setStance] = useState<AnalystStance>("neutral");
  const [confidence, setConfidence] = useState<Confidence>("mid");
  const [noteType, setNoteType] = useState<NoteType>("earnings_review");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [certNo, setCertNo] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [analyst, setAnalyst] = useState("");
  const [validDays, setValidDays] = useState(30);
  const [justPublished, setJustPublished] = useState(false);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  useEffect(() => {
    queueMicrotask(() => setNotes(listNotes()));
  }, [refresh]);

  const stockMatches: StockEntry[] = symbolQuery
    ? searchStocks(symbolQuery, 8)
    : [];

  const handlePickStock = (stock: StockEntry) => {
    setSymbol(stock.symbol);
    setSymbolName(stock.name);
    setSymbolQuery(`${stock.symbol} · ${stock.name}`);
    setShowStockPicker(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !title.trim() || !body.trim() || !analyst.trim()) return;

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validDays);

    createNote({
      symbol,
      symbolName: symbolName || findStock(symbol)?.name || symbol,
      stance,
      title: title.trim(),
      body: body.trim(),
      analyst: analyst.trim(),
      confidence,
      noteType,
      tags,
      certNo: certNo.trim() || undefined,
      validUntil: validUntilDate.toISOString().slice(0, 10),
    });

    // 清空表单 + 触发刷新
    setTitle("");
    setBody("");
    setSymbolQuery("");
    setSymbol("");
    setSymbolName("");
    setTags([]);
    setTagInput("");
    setCertNo("");
    setJustPublished(true);
    setRefresh((r) => r + 1);
    setTimeout(() => setJustPublished(false), 2500);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("确定删除这条研判？散户端的 AI 会立刻停止引用。")) return;
    deleteNote(id);
    setRefresh((r) => r + 1);
  };

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* 顶栏 */}
      <header className="border-b border-[var(--color-divider)] bg-[var(--color-surface)] sticky top-0 z-10">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/workspace"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors flex items-center gap-1 text-[var(--font-body-sm)]"
            >
              <ArrowLeft className="w-4 h-4" />
              返回 workspace
            </Link>
            <span className="text-[var(--color-text-subtle)]">/</span>
            <h1 className="text-[var(--font-h2)] font-medium flex items-center gap-2">
              <PencilLine className="w-5 h-5 text-[var(--color-accent)]" />
              分析师工作台
            </h1>
          </div>
          <div className="text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono">
            发布研判 · 散户端实时引用
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8">
        {/* 左：发布表单 */}
        <section>
          <h2 className="text-[var(--font-h3)] font-medium mb-1">发布新研判</h2>
          <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] mb-6">
            研判发布后，散户在 workspace 问到该股票时，AI 会自动引用您的观点。
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)]"
          >
            {/* 股票选择 */}
            <div>
              <label className="block text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                标的（必填）
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={symbolQuery}
                  onChange={(e) => {
                    setSymbolQuery(e.target.value);
                    setShowStockPicker(true);
                  }}
                  onFocus={() => setShowStockPicker(true)}
                  placeholder="输入代码 / 名称 / 拼音搜索"
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--font-body)] outline-none focus:border-[var(--color-accent)] transition-colors"
                />
                {showStockPicker && stockMatches.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-[200px] overflow-y-auto rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)] z-20 shadow-lg">
                    {stockMatches.map((s) => (
                      <button
                        key={s.symbol}
                        type="button"
                        onClick={() => handlePickStock(s)}
                        className="w-full px-3 py-2 text-left hover:bg-[var(--color-accent-soft)] flex items-center gap-3 transition-colors"
                      >
                        <span className="num font-mono text-[var(--font-body-sm)] text-[var(--color-text-subtle)] w-16">
                          {s.symbol}
                        </span>
                        <span className="text-[var(--font-body-sm)]">{s.name}</span>
                        {s.industry && (
                          <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono ml-auto">
                            {s.industry}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 倾向 + 置信度 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                  倾向
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["bullish", "neutral", "cautious"] as AnalystStance[]).map(
                    (s) => {
                      const active = s === stance;
                      const Icon =
                        s === "bullish"
                          ? TrendingUp
                          : s === "cautious"
                            ? TrendingDown
                            : Minus;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStance(s)}
                          className={`px-2 py-2 rounded-[var(--radius-md)] text-[var(--font-body-sm)] font-medium border transition-all flex items-center justify-center gap-1 ${
                            active
                              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]"
                              : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
                          }`}
                          style={active ? { color: stanceColor(s) } : undefined}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {stanceLabel(s)}
                        </button>
                      );
                    },
                  )}
                </div>
                <p className="text-[10px] text-[var(--color-text-subtle)] mt-1.5 font-mono">
                  合规：不允许「买入/卖出」等明确建议表述
                </p>
              </div>

              <div>
                <label className="block text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                  置信度
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["high", "mid", "low"] as Confidence[]).map((c) => {
                    const active = c === confidence;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setConfidence(c)}
                        className={`px-2 py-2 rounded-[var(--radius-md)] text-[var(--font-body-sm)] font-medium border transition-all ${
                          active
                            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]"
                            : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
                        }`}
                      >
                        {confidenceLabel(c)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[var(--color-text-subtle)] mt-1.5 font-mono">
                  低置信度 AI 会标注「仅供参考」
                </p>
              </div>
            </div>

            {/* 研判类型 + 标签 —— 知识库三维索引 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                  研判类型
                </label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as NoteType)}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--font-body)] outline-none focus:border-[var(--color-accent)] transition-colors"
                >
                  {(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((t) => (
                    <option key={t} value={t}>
                      {NOTE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[var(--color-text-subtle)] mt-1.5 font-mono">
                  AI 按类型检索：如「找最近 7 天的风险预警」
                </p>
              </div>
              <div>
                <label className="block text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                  品种 / 行业标签
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="如：白酒"
                    className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--font-body)] outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--font-body-sm)] hover:bg-[var(--color-accent-soft)] transition-colors"
                  >
                    加
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        onClick={() => removeTag(t)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[var(--font-micro)] font-mono bg-[var(--color-accent-soft)] text-[var(--color-accent)] cursor-pointer hover:opacity-80"
                      >
                        {t}
                        <span className="text-[10px]">×</span>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-[var(--color-text-subtle)] mt-1.5 font-mono">
                  AI 按标签检索：如「白酒板块所有研判」
                </p>
              </div>
            </div>

            {/* 标题 */}
            <div>
              <label className="block text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                一句话标题（必填）
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="如：Q1 营收略低于预期，关注库存周期"
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--font-body)] outline-none focus:border-[var(--color-accent)] transition-colors"
                maxLength={60}
              />
              <p className="text-[10px] text-[var(--color-text-subtle)] mt-1 font-mono">
                {title.length} / 60
              </p>
            </div>

            {/* 正文 */}
            <div>
              <label className="block text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                研判正文（必填，散户能直接看到）
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="用散户能听懂的话写：核心观点、数据依据、需要关注的信号、风险点……"
                rows={6}
                className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--font-body)] leading-relaxed outline-none focus:border-[var(--color-accent)] transition-colors resize-y"
                maxLength={800}
              />
              <p className="text-[10px] text-[var(--color-text-subtle)] mt-1 font-mono">
                {body.length} / 800
              </p>
            </div>

            {/* 签名 + 执业证 + 有效期 */}
            <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr] gap-4">
              <div>
                <label className="block text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                  分析师签名（必填）
                </label>
                <input
                  type="text"
                  value={analyst}
                  onChange={(e) => setAnalyst(e.target.value)}
                  placeholder="如：张明（白酒首席）"
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--font-body)] outline-none focus:border-[var(--color-accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                  执业证编号
                </label>
                <input
                  type="text"
                  value={certNo}
                  onChange={(e) => setCertNo(e.target.value)}
                  placeholder="如：S0570521xxx"
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--font-body)] font-mono outline-none focus:border-[var(--color-accent)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[var(--font-micro)] uppercase tracking-wider text-[var(--color-text-subtle)] font-mono mb-2">
                  有效期
                </label>
                <select
                  value={validDays}
                  onChange={(e) => setValidDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--font-body)] outline-none focus:border-[var(--color-accent)] transition-colors"
                >
                  <option value={7}>7 天</option>
                  <option value={14}>14 天</option>
                  <option value={30}>30 天</option>
                  <option value={90}>90 天</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono">
                {justPublished && (
                  <span className="text-[var(--color-up)] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已发布，AI 立即引用
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!symbol || !title.trim() || !body.trim() || !analyst.trim()}
                className="px-5 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-[var(--font-body-sm)] font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                发布研判
              </button>
            </div>
          </form>
        </section>

        {/* 右：研判列表 */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[var(--font-h3)] font-medium">已发布研判</h2>
            <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono">
              {notes.length} 条
            </span>
          </div>
          <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] mb-6">
            散户在 workspace 问对应股票时，AI 会引用这些研判 + 实时行情综合回答。
          </p>

          <div className="space-y-3">
            {notes.length === 0 && (
              <div className="p-8 text-center text-[var(--color-text-muted)] rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)]">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-[var(--font-body-sm)]">还没有研判，先写一条吧</p>
              </div>
            )}

            {notes.map((note) => (
              <article
                key={note.id}
                className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)]"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded text-[var(--font-micro)] font-mono font-medium"
                      style={{
                        background: "var(--color-surface-2)",
                        color: stanceColor(note.stance),
                      }}
                    >
                      {stanceLabel(note.stance)}
                    </span>
                    <span className="num font-mono text-[var(--font-body-sm)] text-[var(--color-text-subtle)]">
                      {note.symbol}
                    </span>
                    <span className="text-[var(--font-body)] font-medium">
                      {note.symbolName}
                    </span>
                    <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono">
                      · {confidenceLabel(note.confidence)}
                    </span>
                    <span className="text-[var(--font-micro)] px-1.5 py-0.5 rounded font-mono bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                      {NOTE_TYPE_LABELS[note.noteType]}
                    </span>
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[var(--font-micro)] px-1.5 py-0.5 rounded font-mono bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-[var(--color-text-subtle)] hover:text-[var(--color-down)] transition-colors shrink-0"
                    aria-label="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-[var(--font-body-lg)] font-medium mb-2">
                  {note.title}
                </h3>
                <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] leading-relaxed mb-3 whitespace-pre-wrap">
                  {note.body}
                </p>

                <div className="flex items-center justify-between text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono pt-3 border-t border-[var(--color-divider)]">
                  <span>{note.analyst}</span>
                  <span>
                    {new Date(note.createdAt).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · 有效至 "}
                    {note.validUntil}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
