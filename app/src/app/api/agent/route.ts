/**
 * FIN AI · Agent Loop API
 *
 * POST /api/agent
 * 请求体: { query: string, notesSnapshot: AnalystNote[] }
 * 响应: text/event-stream（SSE），每行 `data: {AgentEvent}\n\n`
 *
 * 设计：
 * - notesSnapshot 从前端 localStorage 传过来（服务端读不到客户端存储）
 * - 流式吐 AgentEvent，前端 EventSource-like 解析
 * - AbortController 接 client disconnect，避免烧 token
 */

import { NextRequest } from "next/server";
import { runAgent } from "@/lib/agent/loop";
import { encodeSSE, type AgentEvent } from "@/lib/agent/events";
import type { NotesSnapshot } from "@/lib/agent-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AgentRequestBody {
  query?: string;
  notesSnapshot?: NotesSnapshot;
  model?: string;
}

export async function POST(req: NextRequest) {
  let body: AgentRequestBody;
  try {
    body = (await req.json()) as AgentRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "请求体必须是合法 JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const query = body.query?.trim();
  if (!query) {
    return new Response(
      JSON.stringify({ error: "缺少 query 字段" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const notesSnapshot = body.notesSnapshot ?? [];
  const abortController = new AbortController();
  req.signal.addEventListener("abort", () => abortController.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const safeEnqueue = (event: AgentEvent) => {
        try {
          controller.enqueue(encoder.encode(encodeSSE(event)));
        } catch {
          // controller closed
        }
      };

      try {
        for await (const event of runAgent({
          query,
          notesSnapshot,
          model: body.model,
          signal: abortController.signal,
        })) {
          safeEnqueue(event);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Agent 执行异常";
        safeEnqueue({ type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
