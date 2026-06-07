"use client";

import { Brain, Database, Save, type LucideIcon, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Drawer from "@/components/ui/Drawer";

interface Connection {
  id: string;
  name: string;
  type: "LLM" | "行情" | "数据库";
  icon: LucideIcon;
  status: "connected" | "pending" | "error";
  detail: string;
  endpoint?: string;
}

const CONNECTIONS: Connection[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    type: "LLM",
    icon: Brain,
    status: "connected",
    detail: "通过 OpenAI 兼容协议接入 DeepSeek / Claude / GPT 等模型",
    endpoint: "https://openrouter.ai/api/v1",
  },
  {
    id: "tushare",
    name: "Tushare Pro",
    type: "行情",
    icon: Database,
    status: "connected",
    detail: "A 股日线 K + 最新价（免费版 20 积分起步）",
    endpoint: "http://api.tushare.pro",
  },
  {
    id: "supabase",
    name: "Supabase",
    type: "数据库",
    icon: Save,
    status: "pending",
    detail: "对话历史 / dashboard 持久化（MVP 暂用 localStorage）",
  },
];

const STATUS_STYLES: Record<Connection["status"], { label: string; cls: string; icon: LucideIcon }> = {
  connected: {
    label: "已连接",
    cls: "text-[var(--color-success)] bg-[rgba(31,203,126,0.12)] border-[rgba(31,203,126,0.3)]",
    icon: CheckCircle2,
  },
  pending: {
    label: "待接入",
    cls: "text-[var(--color-warning)] bg-[rgba(245,166,35,0.12)] border-[rgba(245,166,35,0.3)]",
    icon: Clock,
  },
  error: {
    label: "异常",
    cls: "text-[var(--color-danger)] bg-[rgba(232,75,95,0.12)] border-[rgba(232,75,95,0.3)]",
    icon: AlertCircle,
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ConnectionsDrawer({ open, onClose }: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="连接"
      subtitle="外部数据源与服务接入状态"
      width={480}
    >
      <div className="p-4 space-y-3">
        {CONNECTIONS.map((c) => {
          const Icon = c.icon;
          const status = STATUS_STYLES[c.status];
          const StatusIcon = status.icon;
          return (
            <div
              key={c.id}
              className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <div className="flex items-start gap-4 mb-3">
                <span className="inline-flex items-center justify-center w-10 h-10 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[var(--font-body-lg)] font-medium">
                      {c.name}
                    </h3>
                    <span className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono uppercase tracking-wider">
                      {c.type}
                    </span>
                  </div>
                  <p className="text-[var(--font-body-sm)] text-[var(--color-text-muted)] leading-relaxed">
                    {c.detail}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-pill)] text-[var(--font-micro)] font-medium border shrink-0 ${status.cls}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>
              {c.endpoint && (
                <p className="text-[var(--font-micro)] text-[var(--color-text-subtle)] font-mono pl-14 truncate">
                  {c.endpoint}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-4 mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-dashed border-[var(--color-border)]">
        <p className="text-[var(--font-micro)] text-[var(--color-text-subtle)] leading-relaxed">
          🔒 所有 API key 仅存于本机 .env.local，不会提交到代码仓库或上传到云端。
        </p>
      </div>
    </Drawer>
  );
}
