"use client";

import { Check, Loader2, MinusCircle } from "lucide-react";

/**
 * Agent 5 步进度时间线
 *
 * 视觉参考：每步一个大圆，已完成打钩，进行中转圈，未到/跳过灰显
 *
 *   ✓  拉取行情/财报数据
 *      STEP 1 · FETCH_DATA
 *   ⟳  检索分析师研判
 *      STEP 2 · SEARCH_SENTIMENT
 *   ○  综合研判分析
 *      STEP 3 · ANALYZE
 *   ○  事实校验与置信度评估
 *      STEP 4 · VERIFY
 *   ○  生成研究结论
 *      STEP 5 · GENERATE
 */

export type ProgressStatus = "pending" | "active" | "done" | "skipped";

export interface ProgressStep {
  key: string;
  /** 中文标签 */
  label: string;
  /** 状态 */
  status: ProgressStatus;
}

interface Props {
  steps: ProgressStep[];
  /** 紧凑模式：缩小圆圈 + 行高（嵌在 chat 气泡里时用）*/
  dense?: boolean;
}

export default function ProgressTimeline({ steps, dense }: Props) {
  return (
    <div
      className={`rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] ${
        dense ? "p-2" : "p-3"
      }`}
    >
      <div className={dense ? "space-y-2" : "space-y-3"}>
        {steps.map((step, idx) => (
          <StepRow
            key={step.key}
            step={step}
            index={idx + 1}
            isLast={idx === steps.length - 1}
            dense={dense}
          />
        ))}
      </div>
    </div>
  );
}

function StepRow({
  step,
  index,
  isLast,
  dense,
}: {
  step: ProgressStep;
  index: number;
  isLast: boolean;
  dense?: boolean;
}) {
  const size = dense ? 18 : 24;

  return (
    <div className="flex items-start gap-2.5 relative">
      {/* 左侧大圆 */}
      <div
        className="relative flex flex-col items-center shrink-0"
        style={{ width: size }}
      >
        <StatusCircle status={step.status} size={size} />
        {!isLast && (
          <span
            className={`absolute top-full w-px ${
              step.status === "done"
                ? "bg-[var(--color-up)]/40"
                : "bg-[var(--color-divider)]"
            }`}
            style={{ height: dense ? 12 : 18 }}
          />
        )}
      </div>

      {/* 右侧标签 */}
      <div className="flex-1 min-w-0 pb-0.5">
        <p
          className={`leading-tight font-medium ${
            dense ? "text-[var(--font-body-sm)]" : "text-[var(--font-body)]"
          } ${
            step.status === "skipped"
              ? "text-[var(--color-text-subtle)] line-through decoration-[var(--color-text-subtle)]/40"
              : step.status === "pending"
                ? "text-[var(--color-text-subtle)]"
                : "text-[var(--color-text)]"
          }`}
        >
          {step.label}
        </p>
        <p className="text-[10px] tracking-wider font-mono text-[var(--color-text-subtle)] mt-0.5">
          第 {index} 步
        </p>
      </div>
    </div>
  );
}

function StatusCircle({
  status,
  size,
}: {
  status: ProgressStatus;
  size: number;
}) {
  // active: 主题色边框 + 转圈图标
  if (status === "active") {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] shrink-0"
        style={{ width: size, height: size }}
      >
        <Loader2 className="animate-spin" style={{ width: size * 0.55, height: size * 0.55 }} />
      </span>
    );
  }
  // done: 主题色填充 + 白勾
  if (status === "done") {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-[var(--color-up)] text-white shrink-0"
        style={{ width: size, height: size }}
      >
        <Check style={{ width: size * 0.6, height: size * 0.6 }} strokeWidth={3} />
      </span>
    );
  }
  // skipped: 灰底加横线图标
  if (status === "skipped") {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] shrink-0"
        style={{ width: size, height: size }}
        title="此步骤本次未触发"
      >
        <MinusCircle style={{ width: size * 0.55, height: size * 0.55 }} />
      </span>
    );
  }
  // pending: 灰色空圆
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border-2 border-[var(--color-border-strong)] shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
