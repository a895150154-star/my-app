"use client";

import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  featured?: boolean;
  magnetic?: boolean;
  children: ReactNode;
}

const base =
  "rounded-[var(--radius-lg)] p-6 transition-all duration-[var(--duration-base)] ease-out";

export default function Card({
  featured = false,
  magnetic = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!magnetic) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  };

  const variantClass = featured
    ? "bg-[var(--color-surface)] border border-[var(--color-accent)] shadow-[var(--shadow-elevated)] relative overflow-hidden"
    : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]";

  const magneticClass = magnetic ? "magnetic-card" : "";

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={`${base} ${variantClass} ${magneticClass} ${className}`}
      {...rest}
    >
      {featured && (
        <span
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "var(--gradient-brand)" }}
        />
      )}
      {children}
    </div>
  );
}
