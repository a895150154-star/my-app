/**
 * FIN AI · Agent Loop 事件类型
 *
 * 借鉴 Dexter 的事件流设计（src/agent/types.ts），简化为前端展示必需的几类。
 * 服务端通过 SSE 推送，前端按 type 分发到 UI。
 */

export type AgentEvent =
  | { type: "started"; taskId: string; query: string }
  | { type: "thinking"; iteration: number; message: string }
  | {
      type: "tool_start";
      iteration: number;
      toolCallId: string;
      tool: string;
      args: Record<string, unknown>;
    }
  | {
      type: "tool_end";
      iteration: number;
      toolCallId: string;
      tool: string;
      summary: string;
      ok: boolean;
    }
  | { type: "tool_error"; iteration: number; toolCallId: string; tool: string; error: string }
  | {
      type: "done";
      taskId: string;
      answer: string;
      confidence: number;
      sources: string[];
      iterations: number;
      totalTimeMs: number;
    }
  | { type: "error"; message: string };

/**
 * SSE 编码：把单条事件序列化成 `data: {...}\n\n`
 */
export function encodeSSE(event: AgentEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
