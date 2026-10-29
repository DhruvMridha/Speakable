import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* --------------------------------- Streak --------------------------------- */

export function StreakPill({ days = 7, className }: { days?: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-warn/30 bg-warn-soft px-3.5 py-1.5 text-xs font-medium text-warn",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
        <path d="M13 2c.6 3.4-1.2 4.9-2.6 6.3C8.9 9.8 7.5 11.2 7.5 14a4.5 4.5 0 0 0 9 0c0-1.6-.6-2.7-1.3-3.6.2 1.6-.6 2.6-1.4 2.6-1 0-1.3-.8-1.1-2.1C13.1 7.6 15 6.2 13 2Z" />
        <path d="M9 15.5c0 2.2 1.4 3.7 3 3.7s3-1.5 3-3.7c0-1-.4-1.8-.9-2.4-.2 1-.8 1.7-1.5 1.7-.8 0-1-.7-.9-1.6-1.2 .7-2.7 1.3-2.7 2.3Z" opacity=".55" />
      </svg>
      {days} day streak
    </span>
  );
}

/* ----------------------------------- XP ----------------------------------- */

export function XpChip({
  amount,
  label,
  tone = "accent",
  className,
}: {
  amount: number;
  label?: string;
  tone?: "accent" | "onDark";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold",
        tone === "accent" ? "bg-accent text-accent-foreground" : "bg-primary-foreground/15",
        className,
      )}
    >
      <span className="font-display tabular-nums">+{amount} XP</span>
      {label ? <span className="font-medium opacity-80">{label}</span> : null}
    </span>
  );
}

/* --------------------------------- Goal bar -------------------------------- */

export function GoalBar({
  label,
  value,
  target,
  unit = "min",
  tone = "accent",
  className,
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
  tone?: "accent" | "onDark";
  className?: string;
}) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("text-sm font-medium", tone === "onDark" && "opacity-90")}>{label}</span>
        <span className="font-display text-sm tabular-nums text-muted-foreground">
          <span className={tone === "onDark" ? "opacity-80" : "text-foreground"}>{value}</span> / {target} {unit}
        </span>
      </div>
      <div
        className={cn(
          "mt-2.5 h-2 w-full overflow-hidden rounded-full",
          tone === "onDark" ? "bg-primary-foreground/15" : "bg-secondary",
        )}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ---------------------------------- Level ---------------------------------- */

export function LevelRing({
  level,
  xp,
  next,
  className,
}: {
  level: number;
  xp: number;
  next: number;
  className?: string;
}) {
  const pct = Math.min(1, xp / next);
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative grid size-[84px] place-items-center">
        <svg viewBox="0 0 80 80" className="absolute size-[84px] -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--secondary)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="text-center leading-none">
          <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">Level</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{level}</p>
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg font-semibold tabular-nums">
          {xp.toLocaleString()} <span className="text-muted-foreground">/ {next.toLocaleString()} XP</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {(next - xp).toLocaleString()} XP to level {level + 1}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------- Achievements ------------------------------ */

export type Achievement = {
  name: string;
  hint: string;
  icon: "mic" | "flame" | "book" | "target";
  earned?: boolean;
};

const icons: Record<Achievement["icon"], string> = {
  mic: "M9 5.5a3 3 0 0 1 6 0V11a3 3 0 0 1-6 0V5.5ZM5 11a7 7 0 0 0 14 0M12 18v3",
  flame: "M12 3c3 3.5 0 4.5 0 7 2-1 3 1 3 3a3 3 0 1 1-6 0c0-3 3-4 3-10Z",
  book: "M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5V5.5ZM19 18v3H7.5",
  target: "M12 3v3m0 12v3M3 12h3m12 0h3M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z",
};

export function AchievementBadge({ a, className }: { a: Achievement; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors",
        a.earned
          ? "border-accent/35 bg-accent-soft/50"
          : "border-dashed border-border-strong bg-card opacity-60",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          a.earned ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d={icons[a.icon]} />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{a.name}</p>
        <p className="truncate text-xs text-muted-foreground">{a.hint}</p>
      </div>
    </div>
  );
}

/* --------------------------------- Stat tile ------------------------------- */

export function StatTile({
  icon,
  value,
  label,
  className,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card px-4 py-4", className)}>
      <span className="text-accent">{icon}</span>
      <p className="mt-2 font-display text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export const weekIcons = {
  mic: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5V5.5ZM19 18v3H7.5" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
};
