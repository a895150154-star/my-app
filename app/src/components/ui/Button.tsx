import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium leading-none rounded-md transition-all duration-200 ease-out select-none disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-text-on-accent)] border border-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] hover:border-[var(--color-accent-hover)] hover:-translate-y-px hover:shadow-[var(--shadow-elevated)] active:bg-[var(--color-accent-active)] active:translate-y-0 active:shadow-[var(--shadow-ambient)] disabled:bg-[var(--color-surface-3)] disabled:border-[var(--color-border)] disabled:text-[var(--color-text-subtle)] disabled:transform-none disabled:shadow-none",
  secondary:
    "bg-transparent text-[var(--color-text)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:bg-[var(--color-surface-3)] disabled:text-[var(--color-text-subtle)] disabled:border-[var(--color-border)]",
  ghost:
    "bg-transparent text-[var(--color-text-muted)] border-none hover:text-[var(--color-text)] active:text-[var(--color-accent)]",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-[var(--font-body-sm)]",
  md: "px-6 py-3 text-[var(--font-body)]",
  lg: "px-8 py-4 text-[var(--font-body-lg)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    leading,
    trailing,
    className = "",
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
});

export default Button;
