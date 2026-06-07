/**
 * FIN AI · Agent Loop 客户端入口
 *
 * 老版本是纯前端 mock，现在改为：通过 SSE 调真实后端 /api/agent，
 * 把后端 AgentEvent 翻译成前端 UI 期望的 5 步进度 + AgentMessage 回调。
 *
 * 保持 runAgentLoop(query, onStepUpdate, onMessage) 签名不变，
 * 这样 chat 页面无需改动。
 *
 * 5 步映射（后端事件 → 前端 step）：
 *   started        → 整个 5 步 pending
 *   tool_start     → 根据 tool 名设置 step 1/2 running
 *   tool_end       → step 1/2 done
 *   thinking       → step 3 running
 *   done(开始前)   → step 3/4 done, step 5 running
 *   done           → step 5 done, push final AgentMessage
 */

import type {
  AgentLoopState,
  AgentStep,
  AgentMessage,
} from "@/types";
import type { AgentEvent } from "@/lib/agent/events";
import type { NotesSnapshot } from "@/lib/agent-tools";

function createSteps(): AgentStep[] {
  return [
    { step: 1, action: "fetch_data", label: "拉取行情/财报数据", status: "pending" },
    { step: 2, action: "search_sentiment", label: "检索分析师研判", status: "pending" },
    { step: 3, action: "analyze", label: "综合研判分析", status: "pending" },
    { step: 4, action: "verify", label: "事实校验与置信度评估", status: "pending" },
    { step: 5, action: "generate", label: "生成研究结论", status: "pending" },
  ];
}

/** 工具名 → 前端 step index（0-based） */
function toolToStepIdx(tool: string): number {
  if (tool === "fetch_quote" || tool === "fetch_fundamental") return 0;
  if (tool === "search_analyst_notes" || tool === "detect_conflicting_views") return 1;
  return 2;
}

export async function runAgentLoop(
  query: string,
  onStepUpdate: (state: AgentLoopState) => void,
  onMessage: (message: AgentMessage) => void,
  notesSnapshot: NotesSnapshot = [],
): Promise<void> {
  const steps = createSteps();
  const state: AgentLoopState = {
    taskId: `task-${Date.now()}`,
    query,
    steps,
    currentStep: 0,
    status: "running",
  };
  const setRunning = (idx: number) => {
    if (state.steps[idx].status === "pending") {
      state.steps[idx].status = "running";
      state.currentStep = idx + 1;
    }
  };
  const setDone = (idx: number) => {
    if (state.steps[idx].status !== "done") {
      state.steps[idx].status = "done";
    }
  };
  const push = () => onStepUpdate({ ...state, steps: state.steps.map((s) => ({ ...s })) });
  push();

  // 启动 SSE
  let response: Response;
  try {
    response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, notesSnapshot }),
    });
  } catch (err) {
    handleFailure(err instanceof Error ? err.message : "网络错误", state, onStepUpdate, onMessage);
    return;
  }

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    handleFailure(text || `HTTP ${response.status}`, state, onStepUpdate, onMessage);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE 按 `\n\n` 分块
    let sepIdx: number;
    while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);
      if (!chunk.startsWith("data:")) continue;
      const jsonStr = chunk.slice(5).trim();
      if (!jsonStr) continue;
      let event: AgentEvent;
      try {
        event = JSON.parse(jsonStr) as AgentEvent;
      } catch {
        continue;
      }
      handleEvent(event, state, onStepUpdate, onMessage, push, setRunning, setDone);
    }
  }
}

function handleEvent(
  event: AgentEvent,
  state: AgentLoopState,
  onStepUpdate: (s: AgentLoopState) => void,
  onMessage: (m: AgentMessage) => void,
  push: () => void,
  setRunning: (idx: number) => void,
  setDone: (idx: number) => void,
) {
  switch (event.type) {
    case "started":
      state.taskId = event.taskId;
      state.status = "running";
      push();
      return;

    case "tool_start": {
      const idx = toolToStepIdx(event.tool);
      setRunning(idx);
      push();
      return;
    }

    case "tool_end": {
      const idx = toolToStepIdx(event.tool);
      setDone(idx);
      push();
      onMessage({
        id: `${state.taskId}-${event.toolCallId}`,
        role: "system",
        content: event.summary,
        timestamp: new Date().toISOString(),
        agentStep: { ...state.steps[idx] },
      });
      return;
    }

    case "tool_error": {
      const idx = toolToStepIdx(event.tool);
      state.steps[idx].status = "failed";
      push();
      onMessage({
        id: `${state.taskId}-${event.toolCallId}-err`,
        role: "system",
        content: `⚠️ ${event.tool} 执行失败：${event.error}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    case "thinking": {
      // 进入分析阶段：把 1/2 标 done（如果还没），3 设 running
      [0, 1].forEach((i) => {
        if (state.steps[i].status === "running") setDone(i);
      });
      setRunning(2);
      push();
      onMessage({
        id: `${state.taskId}-think-${event.iteration}`,
        role: "system",
        content: `🧠 推理 #${event.iteration}：${event.message}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    case "done": {
      // 把所有未完成的 step 标 done
      state.steps.forEach((s, i) => {
        if (s.status !== "done") setDone(i);
      });
      state.status = "complete";
      push();
      onMessage({
        id: `${state.taskId}-result`,
        role: "agent",
        content: event.answer || "（Agent 未返回结论）",
        timestamp: new Date().toISOString(),
        confidence: event.confidence,
        sources: event.sources,
      });
      return;
    }

    case "error": {
      state.steps.forEach((s) => {
        if (s.status === "running" || s.status === "pending") s.status = "failed";
      });
      state.status = "error";
      push();
      onMessage({
        id: `${state.taskId}-error`,
        role: "system",
        content: `❌ Agent 执行失败：${event.message}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }
}

function handleFailure(
  msg: string,
  state: AgentLoopState,
  onStepUpdate: (s: AgentLoopState) => void,
  onMessage: (m: AgentMessage) => void,
) {
  state.status = "error";
  state.steps.forEach((s) => {
    if (s.status === "running" || s.status === "pending") s.status = "failed";
  });
  onStepUpdate({ ...state, steps: state.steps.map((s) => ({ ...s })) });
  onMessage({
    id: `${state.taskId}-error`,
    role: "system",
    content: `❌ Agent 调用失败：${msg}`,
    timestamp: new Date().toISOString(),
  });
}
