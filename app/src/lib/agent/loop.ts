/**
 * FIN AI · Agent Loop 核心
 *
 * 借鉴 Dexter (src/agent/agent.ts) 的迭代循环 + 工具调用模式，
 * 简化为：
 *   loop {
 *     1. LLM 看 messages + tools → 返回 assistant message
 *     2. 没有 tool_calls → 终止，返回 final answer
 *     3. 有 tool_calls → 并发执行所有工具，追加 ToolMessage 到 messages，回到 1
 *   }
 *
 * 与 Dexter 的差异：
 *   - 不做 streaming（OpenRouter 兼容性参差），用 blocking + per-iteration 事件
 *   - 不做 compact / microcompact（中小 App 用不上）
 *   - 不做 memory flush（暂未集成持久化记忆）
 *   - 工具集走 src/lib/agent-tools.ts 已有的 4 个函数（不重复造轮子）
 *
 * 输出: async generator of AgentEvent（前端用 SSE 消费）
 */

import { openai, FIN_AI_SYSTEM_PROMPT } from "@/lib/llm";
import {
  AGENT_TOOLS,
  executeAgentTool,
  type NotesSnapshot,
} from "@/lib/agent-tools";
import type { AgentEvent } from "./events";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageFunctionToolCall,
} from "openai/resources/chat/completions";

// 我们的 AGENT_TOOLS 全部是 function 类型，因此这里统一窄化为 function tool call
type FunctionToolCall = ChatCompletionMessageFunctionToolCall;

const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat-v3.1";
const MAX_ITERATIONS = 6;

export interface RunAgentOptions {
  query: string;
  notesSnapshot: NotesSnapshot;
  model?: string;
  signal?: AbortSignal;
}

/**
 * 主入口：跑一次 Agent Loop，事件流式 yield 出来
 */
export async function* runAgent(
  opts: RunAgentOptions,
): AsyncGenerator<AgentEvent> {
  const { query, notesSnapshot, signal } = opts;
  const model = opts.model ?? DEFAULT_MODEL;
  const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();

  yield { type: "started", taskId, query };

  // 初始 messages：system + user
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: FIN_AI_SYSTEM_PROMPT,
    },
    { role: "user", content: query },
  ];

  // 累积所有调用过的工具，用于置信度 + 来源
  const sources = new Set<string>();
  let toolCallsTotal = 0;
  let toolErrors = 0;
  let iteration = 0;

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    if (signal?.aborted) {
      yield { type: "error", message: "用户取消" };
      return;
    }

    // === 1. 调 LLM ===
    let assistantMessage: {
      content: string | null;
      tool_calls?: FunctionToolCall[];
    };
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages,
        tools: AGENT_TOOLS as unknown as Parameters<
          typeof openai.chat.completions.create
        >[0]["tools"],
        temperature: 0.3,
        max_tokens: 1200,
      });
      const choice = completion.choices[0]?.message;
      if (!choice) {
        yield { type: "error", message: "LLM 返回空响应" };
        return;
      }
      assistantMessage = {
        content: choice.content ?? null,
        tool_calls: choice.tool_calls as FunctionToolCall[] | undefined,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "LLM 调用失败";
      yield { type: "error", message: msg };
      return;
    }

    const hasToolCalls =
      Array.isArray(assistantMessage.tool_calls) &&
      assistantMessage.tool_calls.length > 0;

    // 推理文本（如果伴随工具调用，先 emit 出来给 UI）
    if (assistantMessage.content?.trim() && hasToolCalls) {
      yield {
        type: "thinking",
        iteration,
        message: assistantMessage.content.trim(),
      };
    }

    // === 2. 没有 tool_calls：终止，返回最终答案 ===
    if (!hasToolCalls) {
      const answer = assistantMessage.content?.trim() ?? "";
      const confidence = computeConfidence({
        toolCallsTotal,
        toolErrors,
        sourcesCount: sources.size,
        iterations: iteration,
      });
      yield {
        type: "done",
        taskId,
        answer,
        confidence,
        sources: Array.from(sources),
        iterations: iteration,
        totalTimeMs: Date.now() - startTime,
      };
      return;
    }

    // === 3. 有 tool_calls：把 assistant message 推回 messages ===
    messages.push({
      role: "assistant",
      content: assistantMessage.content,
      tool_calls: assistantMessage.tool_calls,
    });

    // === 4. 并发执行所有工具 ===
    const toolCalls = assistantMessage.tool_calls!;
    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        const toolName = tc.function.name;
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(tc.function.arguments || "{}");
        } catch {
          // ignore parse error，下面的 tool 执行会自己处理
        }
        return {
          tc,
          toolName,
          parsedArgs,
          result: await executeAgentTool(toolName, parsedArgs, notesSnapshot),
        };
      }),
    );

    // 5. emit 事件 + 推回 ToolMessage
    for (const { tc, toolName, parsedArgs, result } of toolResults) {
      yield {
        type: "tool_start",
        iteration,
        toolCallId: tc.id,
        tool: toolName,
        args: parsedArgs,
      };

      toolCallsTotal++;
      if (!result.ok) toolErrors++;

      if (result.ok) {
        // 解析 payload 提取 source（如果有）
        try {
          const payloadObj = JSON.parse(result.payload);
          if (typeof payloadObj === "object" && payloadObj !== null) {
            if (typeof (payloadObj as { source?: string }).source === "string") {
              sources.add((payloadObj as { source: string }).source);
            }
            // search_analyst_notes 的 notes 数组里也有分析师署名
            const notes = (payloadObj as { notes?: Array<{ analyst?: string }> })
              .notes;
            if (Array.isArray(notes)) {
              for (const n of notes) {
                if (typeof n.analyst === "string") sources.add(n.analyst);
              }
            }
          }
        } catch {
          // payload 非 JSON，跳过
        }

        yield {
          type: "tool_end",
          iteration,
          toolCallId: tc.id,
          tool: toolName,
          summary: result.summary,
          ok: true,
        };
      } else {
        yield {
          type: "tool_error",
          iteration,
          toolCallId: tc.id,
          tool: toolName,
          error: result.summary,
        };
      }

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result.payload,
      });
    }
  }

  // 到达最大迭代数
  yield {
    type: "done",
    taskId,
    answer: `已达到最大推理轮数（${MAX_ITERATIONS}）。基于已收集的数据返回部分结论。`,
    confidence: 0.4,
    sources: Array.from(sources),
    iterations: iteration,
    totalTimeMs: Date.now() - startTime,
  };
}

/**
 * 置信度计算（启发式）：
 * - 基础分 0.55
 * - 每个成功工具调用 +0.08（最多 +0.24）
 * - 每个去重数据源 +0.05（最多 +0.2）
 * - 工具失败率 > 0.5 → 封顶 0.55
 * - 单轮没工具调用直接结束 → 视为 0.5（信息不足）
 *
 * 这是简化版，生产环境应该用 fact-check 模块做真校验。
 */
function computeConfidence(input: {
  toolCallsTotal: number;
  toolErrors: number;
  sourcesCount: number;
  iterations: number;
}): number {
  if (input.toolCallsTotal === 0) return 0.5;

  const errorRate = input.toolErrors / input.toolCallsTotal;
  if (errorRate > 0.5) return 0.55;

  const base = 0.55;
  const toolBonus = Math.min(0.24, input.toolCallsTotal * 0.08);
  const sourceBonus = Math.min(0.2, input.sourcesCount * 0.05);
  const score = base + toolBonus + sourceBonus;
  return Math.min(0.95, Math.max(0.4, Number(score.toFixed(2))));
}
