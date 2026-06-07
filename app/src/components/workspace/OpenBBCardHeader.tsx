"use client";

import { ChevronDown, MoreVertical, type LucideIcon } from "lucide-react";

/**
 * OpenBB 风格的 widget 卡片标题栏
 *
 * 视觉参考：左侧【绿色圆 + 图标】+ 【widget 名称】+ 【蓝色股票徽章 + ChevronDown】
 *           右侧【+ 加按钮】【MoreVertical 菜单】【× 关闭】
 *
 * 不做交互（演示性外观），只保留视觉
 * 真实关闭按钮在 WidgetGrid 外层处理，这里的 × 仅作 visual hint
 */
interface Props {
  /** widget 类型小图标（lucide） */
  icon: LucideIcon;
  /** widget 名称（如"股票代码信息"） */
  label: string;
  /** 股票名称（如"苹果公司" / "贵州茅台"） */
  symbolName?: string;
  /** 数据时间戳（小字显示在标题栏底部） */
  timestamp?: string;
}

export default function OpenBBCardHeader({
  icon: Icon,
  label,
  symbolName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timestamp,
}: Props) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] min-w-0">
      {/* 绿色圆图标 */}
      <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 rounded-full bg-[var(--color-up)]/15 text-[var(--color-up)]">
        <Icon className="w-2.5 h-2.5" strokeWidth={2} />
      </span>

      {/* widget 名（可截断） */}
      <span className="text-[var(--font-body-sm)] font-medium text-[var(--color-text)] truncate min-w-0">
        {label}
      </span>

      {/* 股票徽章（可截断；不显示 badge index 因为太挤了） */}
      {symbolName && (
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-[10px] font-mono font-medium hover:bg-[var(--color-accent)] hover:text-white transition-colors shrink min-w-0"
          title={symbolName}
        >
          <span className="truncate max-w-[48px]">{symbolName}</span>
          <ChevronDown className="w-2 h-2 shrink-0" />
        </button>
      )}

      <div className="flex-1" />

      {/* 工具按钮：默认隐藏，hover 整个卡片才出 */}
      <div className="flex items-center gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 rounded text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          aria-label="更多"
          tabIndex={-1}
        >
          <MoreVertical className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
