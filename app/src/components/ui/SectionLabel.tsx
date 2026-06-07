interface SectionLabelProps {
  index?: string;
  children: React.ReactNode;
}

export default function SectionLabel({ index, children }: SectionLabelProps) {
  return (
    <p className="inline-flex items-center gap-2 text-[var(--font-micro)] uppercase tracking-[0.18em] font-semibold text-[var(--color-accent)] mb-4 font-mono">
      {index && (
        <span className="text-[var(--color-text-subtle)]">/ {index}</span>
      )}
      <span>{children}</span>
    </p>
  );
}
