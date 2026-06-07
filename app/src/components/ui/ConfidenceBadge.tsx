type Level = "high" | "mid" | "low";

interface ConfidenceBadgeProps {
  level: Level;
  /** 内部得分，不再展示给用户，仅用作 hover 详情（避免误导） */
  score?: number;
  className?: string;
}

const styles: Record<
  Level,
  { label: string; tip: string; cls: string }
> = {
  high: {
    label: "高置信",
    tip: "回答内容与知识库匹配度高，可信度较高",
    cls: "text-[var(--color-confidence-high)] bg-[rgba(31,203,126,0.12)] border-[rgba(31,203,126,0.3)]",
  },
  mid: {
    label: "中置信",
    tip: "回答内容部分来自综合解读，建议结合数据源核实",
    cls: "text-[var(--color-confidence-mid)] bg-[rgba(245,166,35,0.12)] border-[rgba(245,166,35,0.3)]",
  },
  low: {
    label: "仅供参考",
    tip: "回答内容与知识库匹配度较低，建议联系分析师核实",
    cls: "text-[var(--color-confidence-low)] bg-[rgba(107,118,145,0.16)] border-[rgba(107,118,145,0.3)]",
  },
};

export default function ConfidenceBadge({
  level,
  className = "",
}: ConfidenceBadgeProps) {
  const { label, tip, cls } = styles[level];
  return (
    <span
      title={tip}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono whitespace-nowrap border ${cls} ${className}`}
    >
      <span aria-hidden className="w-1 h-1 rounded-full bg-current" />
      {label}
    </span>
  );
}
