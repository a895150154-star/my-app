export interface MarketData {
  symbol: string;
  name: string;
  priceCents: number;
  changeCents: number;
  changePercent: number;
  volume: number;
  timestamp: string;
  source: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  author: string;
  category: "research" | "sentiment" | "strategy" | "alert";
  createdAt: string;
  expiresAt: string | null;
  tags: string[];
}

export interface AgentMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  confidence?: number;
  sources?: string[];
  agentStep?: AgentStep;
}

export interface AgentStep {
  step: number;
  action: "fetch_data" | "search_sentiment" | "analyze" | "verify" | "generate";
  label: string;
  status: "pending" | "running" | "done" | "failed";
}

export interface AgentLoopState {
  taskId: string;
  query: string;
  steps: AgentStep[];
  currentStep: number;
  status: "idle" | "running" | "complete" | "error";
}
