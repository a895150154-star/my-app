import OpenAI from "openai";
import { openai, FIN_AI_SYSTEM_PROMPT } from "@/lib/llm";
import {
  AGENT_TOOLS,
  executeAgentTool,
  type NotesSnapshot,
} from "@/lib/agent-tools";
import { factCheck } from "@/lib/fact-check";

/**
 * Agent Loop · SSE 流式版
 *
 * 老版本：一次性返回完整结果
 * 新版本：用 Server-Sent Events 把 5 步进度 + 工具调用 + 最终答案逐事件推送
 *
 * 客户端 fetch 后用 ReadableStream 逐行读取 `data: <json>\n\n`
 *
 * 事件类型（event field）：
 *   - "progress"  —— 5 步进度更新 { stepKey, status: "active"|"done"|"skipped" }
 *   - "tool"      —— 单次工具调用记录（trace）
 *   - "reply"     —— 最终回答（含 factCheck）
 *   - "error"     —— 异常
 *   - "done"      —— 流结束
 */

const MAX_ROUNDS = 5;

export interface TraceStep {
  round: number;
  thought?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolSummary?: string;
  toolOk?: boolean;
}

export type ProgressStepKey =
  | "FETCH_DATA"
  | "SEARCH_SENTIMENT"
  | "ANALYZE"
  | "VERIFY"
  | "GENERATE";

export const PROGRESS_STEPS: { key: ProgressStepKey; label: string }[] = [
  { key: "SEARCH_SENTIMENT", label: "检索分析师研判" },
  { key: "FETCH_DATA", label: "拉取行情/财报数据" },
  { key: "ANALYZE", label: "综合研判分析" },
  { key: "VERIFY", label: "事实校验与置信度评估" },
  { key: "GENERATE", label: "生成研究结论" },
];

const AGENT_SYSTEM_PROMPT = `${FIN_AI_SYSTEM_PROMPT}

# Agent Loop 工具调用规则
你现在有 4 个工具可以调用：
1. fetch_quote(symbol)              —— 拉行情
2. fetch_fundamental(symbol)        —— 拉财报
3. search_analyst_notes(...)        —— 检索分析师研判（必须先用这个！）
4. detect_conflicting_views(symbol) —— 检测分析师观点冲突

# 标准推理流程（你必须按这个顺序）
当用户问关于某只股票的方向/观点问题时：
1. **先用 search_analyst_notes(symbol=...) 检索这只股票的研判**
2. 如果研判 ≥ 2 条，**调用 detect_conflicting_views(symbol=...) 检测冲突**
3. 如果用户问的是具体数字（价格/财报），用 fetch_quote / fetch_fundamental 拉真实数据
4. 综合所有工具结果，按"核心观点 / 理由 / 观察清单 / 数据出处 / 免责声明"结构回答

# 关键合规约束
- 只要研判库里有研判，**必须**先调 search_analyst_notes 检索后再回答
- 如果 detect_conflicting_views 返回 has_conflict=true，必须在回答里**明确告知散户存在分歧**
- 所有方向性陈述必须带分析师署名（不可说"AI 认为"）`;

function flattenToolPayload(payload: string): string {
  try {
    const obj: unknown = JSON.parse(payload);
    return collectStrings(obj).join(" ");
  } catch {
    return payload;
  }
}

function collectStrings(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (typeof v === "number" || typeof v === "boolean") return [String(v)];
  if (Array.isArray(v)) return v.flatMap(collectStrings);
  if (v && typeof v === "object") {
    return Object.values(v as Record<string, unknown>).flatMap(collectStrings);
  }
  return [];
}

/** 工具名 → 进度步骤映射 */
function stepForTool(toolName: string): ProgressStepKey | null {
  if (toolName === "fetch_quote" || toolName === "fetch_fundamental") {
    return "FETCH_DATA";
  }
  if (
    toolName === "search_analyst_notes" ||
    toolName === "detect_conflicting_views"
  ) {
    return "SEARCH_SENTIMENT";
  }
  return null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const userMessage: string | undefined = body.userMessage;
  const widgetContext: string | undefined = body.widgetContext;
  const history: { role: "user" | "assistant"; content: string }[] =
    body.history ?? [];
  const notesSnapshot: NotesSnapshot = body.notesSnapshot ?? [];

  if (!userMessage || typeof userMessage !== "string") {
    return new Response(JSON.stringify({ error: "userMessage 必填" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const systemContent = [
          AGENT_SYSTEM_PROMPT,
          widgetContext ? `\n# 当前 widget 上下文\n${widgetContext}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: systemContent },
          ...history,
          { role: "user", content: userMessage },
        ];

        const trace: TraceStep[] = [];
        const factSources: string[] = [];
        if (widgetContext) factSources.push(widgetContext);

        const chosenModel =
          process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat-v3.1";

        /** 已点亮过的步骤集合，避免重复发"active" */
        const activatedSteps = new Set<ProgressStepKey>();
        const completedSteps = new Set<ProgressStepKey>();

        const activate = (step: ProgressStepKey) => {
          if (activatedSteps.has(step)) return;
          activatedSteps.add(step);
          send("progress", { stepKey: step, status: "active" });
        };
        const complete = (step: ProgressStepKey) => {
          if (completedSteps.has(step)) return;
          completedSteps.add(step);
          send("progress", { stepKey: step, status: "done" });
        };

        let finalReply = "";
        let rounds = 0;

        for (let round = 1; round <= MAX_ROUNDS; round++) {
          rounds = round;
          const response = await openai.chat.completions.create({
            model: chosenModel,
            messages,
            tools: AGENT_TOOLS as unknown as OpenAI.Chat.ChatCompletionTool[],
            tool_choice: "auto",
            temperature: 0.3,
            max_tokens: 1200,
          });

          const msg = response.choices[0]?.message;
          if (!msg) break;
          messages.push(msg as OpenAI.Chat.ChatCompletionMessageParam);

          // Case 1: LLM 想调工具
          if (msg.tool_calls && msg.tool_calls.length > 0) {
            // 先点亮所有这一轮要触及的步骤
            for (const tc of msg.tool_calls) {
              if (tc.type !== "function") continue;
              const step = stepForTool(tc.function.name);
              if (step) activate(step);
            }

            // 并行执行
            const toolResults = await Promise.all(
              msg.tool_calls.map(async (tc) => {
                if (tc.type !== "function") return null;
                const fn = tc.function;
                let parsedArgs: Record<string, unknown> = {};
                try {
                  parsedArgs = JSON.parse(fn.arguments);
                } catch {
                  parsedArgs = {};
                }
                const result = await executeAgentTool(
                  fn.name,
                  parsedArgs,
                  notesSnapshot,
                );
                const traceStep: TraceStep = {
                  round,
                  thought: msg.content ?? undefined,
                  toolName: fn.name,
                  toolArgs: parsedArgs,
                  toolSummary: result.summary,
                  toolOk: result.ok,
                };
                trace.push(traceStep);
                send("tool", traceStep);

                if (result.ok) {
                  factSources.push(flattenToolPayload(result.payload));
                }
                return { tool_call_id: tc.id, content: result.payload };
              }),
            );

            for (const r of toolResults) {
              if (!r) continue;
              messages.push({
                role: "tool",
                tool_call_id: r.tool_call_id,
                content: r.content,
              });
            }

            // 这一轮工具全做完，标记对应步骤 done
            for (const tc of msg.tool_calls) {
              if (tc.type !== "function") continue;
              const step = stepForTool(tc.function.name);
              if (step) complete(step);
            }

            continue;
          }

          // Case 2: LLM 直接给答案了 → 进入综合分析
          activate("ANALYZE");
          finalReply = msg.content ?? "";
          complete("ANALYZE");
          break;
        }

        // 兜底
        if (!finalReply && rounds >= MAX_ROUNDS) {
          activate("ANALYZE");
          const summaryResponse = await openai.chat.completions.create({
            model: chosenModel,
            messages: [
              ...messages,
              {
                role: "user",
                content:
                  "请基于以上所有工具结果，立即给出最终回答，不要再调用工具。",
              },
            ],
            temperature: 0.3,
            max_tokens: 1200,
          });
          finalReply = summaryResponse.choices[0]?.message?.content ?? "";
          complete("ANALYZE");
        }

        // 没有触发过的工具相关步骤 → 标 skipped（避免视觉上一直 active）
        for (const s of ["FETCH_DATA", "SEARCH_SENTIMENT"] as ProgressStepKey[]) {
          if (!activatedSteps.has(s)) {
            send("progress", { stepKey: s, status: "skipped" });
          }
        }
        if (!activatedSteps.has("ANALYZE")) {
          activate("ANALYZE");
          complete("ANALYZE");
        }

        // VERIFY 阶段
        activate("VERIFY");
        const factReport = finalReply ? factCheck(finalReply, factSources) : null;
        complete("VERIFY");

        // GENERATE 阶段
        activate("GENERATE");
        send("reply", {
          reply: factReport?.annotatedReply ?? finalReply,
          originalReply: finalReply,
          trace,
          factCheck: factReport
            ? {
                overall: factReport.overall,
                avgScore: factReport.avgScore,
                sentences: factReport.sentences,
              }
            : null,
          model: chosenModel,
          rounds,
        });
        complete("GENERATE");

        send("done", {});
        controller.close();
      } catch (err) {
        console.error("[api/agent/loop] 失败:", err);
        const message = err instanceof Error ? err.message : "未知错误";
        send("error", { error: `Agent Loop 失败：${message}` });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // 防止 Nginx / Vercel 缓冲
      "X-Accel-Buffering": "no",
    },
  });
}
