import { KnowledgeItem } from "@/types";

interface KnowledgeCardProps {
  item: KnowledgeItem;
}

const categoryConfig: Record<
  KnowledgeItem["category"],
  { label: string; bg: string; text: string; dot: string }
> = {
  research: {
    label: "RESEARCH",
    bg: "bg-[var(--accent-glow)]",
    text: "text-[var(--accent)]",
    dot: "bg-[var(--accent)]",
  },
  sentiment: {
    label: "SENTIMENT",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    dot: "bg-indigo-400",
  },
  strategy: {
    label: "STRATEGY",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  alert: {
    label: "ALERT",
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

export default function KnowledgeCard({ item }: KnowledgeCardProps) {
  const cat = categoryConfig[item.category];
  const timeAgo = getTimeAgo(item.createdAt);

  return (
    <div className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border-strong)] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 ${cat.bg} px-2 py-1 rounded-md`}>
          <div className={`w-1 h-1 rounded-full ${cat.dot}`} />
          <span className={`text-[10px] font-semibold tracking-widest ${cat.text}`}>
            {cat.label}
          </span>
        </div>
        <span className="text-[10px] text-[var(--foreground-dim)] font-mono">{timeAgo}</span>
      </div>
      <h3 className="text-sm font-semibold text-white mb-2 leading-snug group-hover:text-[var(--accent)] transition-colors">
        {item.title}
      </h3>
      <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-3">
        {item.content}
      </p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--foreground-dim)]">{item.author}</span>
        <div className="flex gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}
