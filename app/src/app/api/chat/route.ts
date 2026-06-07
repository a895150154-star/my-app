import { NextResponse } from "next/server";
import { askLLM, type ChatMessage } from "@/lib/llm";

/**
 * POST /api/chat
 *
 * Body:
 *   {
 *     userMessage: string,
 *     widgetContext?: string,   // 当前 widget 上下文（前端拼装）
 *     history?: ChatMessage[],  // 不含 system
 *     model?: string             // 可选切换模型
 *   }
 *
 * Response:
 *   { reply, model, usage }  on success
 *   { error }                on failure (HTTP 4xx/5xx)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.userMessage !== "string") {
      return NextResponse.json(
        { error: "缺少必要参数 userMessage" },
        { status: 400 },
      );
    }

    const userMessage = body.userMessage.trim();
    if (!userMessage) {
      return NextResponse.json({ error: "userMessage 不能为空" }, { status: 400 });
    }
    if (userMessage.length > 2000) {
      return NextResponse.json(
        { error: "问题过长，请精简到 2000 字以内" },
        { status: 400 },
      );
    }

    const widgetContext: string | undefined =
      typeof body.widgetContext === "string" && body.widgetContext.trim()
        ? body.widgetContext
        : undefined;

    const history: ChatMessage[] = Array.isArray(body.history)
      ? body.history
          .filter(
            (m: unknown): m is ChatMessage =>
              !!m &&
              typeof m === "object" &&
              "role" in m &&
              "content" in m &&
              ((m as ChatMessage).role === "user" ||
                (m as ChatMessage).role === "assistant") &&
              typeof (m as ChatMessage).content === "string",
          )
          .slice(-20)
      : [];

    const model: string | undefined =
      typeof body.model === "string" && body.model.trim() ? body.model : undefined;

    const agentId: string | undefined =
      typeof body.agentId === "string" && body.agentId.trim()
        ? body.agentId
        : undefined;

    const result = await askLLM({
      userMessage,
      widgetContext,
      history,
      model,
      agentId,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/chat] LLM 调用失败：", err);
    const message =
      err instanceof Error ? err.message : "未知错误，请稍后再试";
    return NextResponse.json(
      { error: `AI 服务暂时不可用：${message}` },
      { status: 500 },
    );
  }
}
