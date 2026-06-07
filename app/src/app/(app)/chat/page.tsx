"use client";

import { useState, useRef, useEffect } from "react";
import { AgentMessage, AgentLoopState } from "@/types";
import ChatMessage from "@/components/ChatMessage";
import AgentStepIndicator from "@/components/AgentStepIndicator";
import { runAgentLoop } from "@/lib/agent-loop";
import { listNotes } from "@/lib/analyst-notes";

const suggestedQuestions = [
  { q: "MG2406 当前行情怎么样？", tag: "MARKET" },
  { q: "氧化镁最近有什么舆情？", tag: "SENTIMENT" },
  { q: "镁合金短线该怎么操作？", tag: "STRATEGY" },
  { q: "氯化镁今天为什么涨这么多？", tag: "ANALYSIS" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loopState, setLoopState] = useState<AgentLoopState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (query: string) => {
    if (!query.trim() || isRunning) return;

    const userMessage: AgentMessage = {
      id: `user-${crypto.randomUUID()}`,
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsRunning(true);

    // 把 localStorage 里的分析师研判快照传给 Agent（server 端读不到 localStorage）
    const notesSnapshot = (() => {
      try {
        return listNotes();
      } catch {
        return [];
      }
    })();

    await runAgentLoop(
      query,
      (state) => setLoopState(state),
      (msg) => setMessages((prev) => [...prev, msg]),
      notesSnapshot
    );

    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-8 py-6 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold mb-1">
              AI RESEARCH ASSISTANT
            </p>
            <h1 className="text-xl font-bold text-white">AI 研究助手</h1>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              基于 Agent Loop 架构 · 多步推理 · 自主验证 · 置信度标注
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest font-semibold">
                Online
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[var(--accent)] blur-2xl opacity-30 rounded-full" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center text-3xl font-bold text-[var(--background)] glow-accent">
                  AI
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                欢迎使用 <span className="gradient-hero">FIN AI</span>
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] mb-8 text-center max-w-md leading-relaxed">
                基于 Agent Loop 架构的金融研究智能体
                <br />
                为您拉取行情 · 检索舆情 · 综合研判
              </p>
              <p className="text-[10px] uppercase tracking-widest text-[var(--foreground-dim)] font-semibold mb-3">
                · Try one of these queries ·
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-3xl w-full">
                {suggestedQuestions.map((s) => (
                  <button
                    key={s.q}
                    onClick={() => handleSend(s.q)}
                    className="group text-left bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-elevated)] rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono text-[var(--accent)] font-semibold tracking-widest">
                        {s.tag}
                      </span>
                      <div className="flex-1 h-px bg-[var(--border)] group-hover:bg-[var(--accent)]/30 transition-colors" />
                      <svg
                        className="w-3 h-3 text-[var(--foreground-dim)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                    <p className="text-sm text-white">{s.q}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-8 py-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </div>
          )}
        </div>

        {loopState && (
          <aside className="w-80 border-l border-[var(--border)] bg-[var(--surface)]/30 overflow-y-auto scrollbar-thin">
            <div className="p-5">
              <h3 className="text-[10px] font-semibold text-[var(--foreground-dim)] uppercase tracking-widest mb-4">
                · Execution Trace ·
              </h3>
              <AgentStepIndicator state={loopState} />
            </div>
          </aside>
        )}
      </div>

      <div className="px-8 py-4 border-t border-[var(--border)] bg-[var(--surface)]/30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex gap-2 items-center bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--accent)] rounded-xl px-4 py-2 transition-colors">
            <span className="text-[var(--accent)] font-mono text-sm font-bold">{">"}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入您的研究问题..."
              disabled={isRunning}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-[var(--foreground-dim)] focus:outline-none disabled:opacity-50 py-2"
            />
            <button
              type="submit"
              disabled={isRunning || !input.trim()}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 disabled:bg-[var(--surface-elevated)] disabled:text-[var(--foreground-dim)] text-[var(--background)] text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  分析中
                </>
              ) : (
                <>
                  发送
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
                  </svg>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-[var(--foreground-dim)] text-center mt-3 tracking-wide">
            ⚠ AI 输出仅供参考，不构成投资建议。涉及交易决策请咨询专业投顾。
          </p>
        </form>
      </div>
    </div>
  );
}
