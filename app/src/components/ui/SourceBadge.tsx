interface SourceBadgeProps {
  source: string;
  timestamp?: string;
  className?: string;
}

export default function SourceBadge({
  source,
  timestamp,
  className = "",
}: SourceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-xs)] text-[var(--font-micro)] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)] font-mono ${className}`}
    >
      <span>{source}</span>
      {timestamp && (
        <span className="text-[var(--color-text-subtle)] num">
          · {timestamp}
        </span>
      )}
    </span>
  );
}
