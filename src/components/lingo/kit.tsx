import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "accent" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 select-none disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
  accent:
    "bg-accent text-accent-foreground hover:-translate-y-0.5 hover:shadow-[var(--shadow-orb)]",
  ghost: "text-foreground hover:bg-secondary",
  outline: "border border-border-strong text-foreground hover:bg-secondary",
  danger: "bg-destructive text-destructive-foreground hover:opacity-90",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[0.95rem]",
  lg: "h-14 px-8 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export const buttonClass = (variant: ButtonVariant = "primary", size: ButtonSize = "md") =>
  cn(buttonBase, buttonVariants[variant], buttonSizes[size]);

/* ----------------------------------- Card ---------------------------------- */

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("surface-card p-6 sm:p-7", className)} {...props}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "warn";
  className?: string;
}) {
  const tones = {
    neutral: "bg-secondary text-secondary-foreground",
    accent: "bg-accent-soft text-accent",
    warn: "bg-warn-soft text-warn",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Meter ---------------------------------- */

export function Meter({
  label,
  value,
  caption,
  tone = "accent",
}: {
  label: string;
  value: number;
  caption?: string;
  tone?: "accent" | "ink";
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-display text-sm tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700",
            tone === "accent" ? "bg-accent" : "bg-primary",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      {caption ? <p className="mt-2 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  );
}

/* ------------------------------ Selectable chip ---------------------------- */

export function Choice({
  label,
  hint,
  selected,
  onClick,
  className,
}: {
  label: string;
  hint?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-200",
        selected
          ? "border-accent bg-accent-soft/60 shadow-[var(--shadow-soft)]"
          : "border-border bg-card hover:border-border-strong hover:-translate-y-0.5",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-[0.98rem] font-medium">{label}</span>
        {hint ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
          selected ? "border-accent bg-accent" : "border-border-strong",
        )}
      >
        {selected ? (
          <svg viewBox="0 0 12 12" className="size-3 text-accent-foreground" fill="none">
            <path
              d="M2.5 6.2 5 8.5 9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    </button>
  );
}

/* --------------------------------- Sparkline -------------------------------- */

export function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = Math.max(1, max - min);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 32 - ((p - min) / span) * 28 - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cn("h-10 w-full", className)}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------------------------- States --------------------------------- */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border-strong px-8 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3v10" strokeLinecap="round" />
          <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
