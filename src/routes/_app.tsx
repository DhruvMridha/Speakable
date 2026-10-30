import type { ReactElement } from "react";
import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/lingo/language-switcher";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

const primary = [
  { to: "/home", label: "Home", icon: "home" },
  { to: "/practice", label: "Practice", icon: "mic" },
  { to: "/progress", label: "Progress", icon: "chart" },
  { to: "/memory", label: "Memory", icon: "memory" },
] as const;

const secondary = [
  { to: "/history", label: "History", icon: "clock" },
  { to: "/settings", label: "Settings", icon: "cog" },
  { to: "/demo", label: "Demo", icon: "spark" },
] as const;

function Icon({ name, className }: { name: string; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  const paths: Record<string, ReactElement> = {
    home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z" />,
    mic: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </>
    ),
    chart: <path d="M4 19h16M7 16V9m5 7V5m5 11v-5" />,
    memory: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4v5M12 15v5M4 12h5M15 12h5M6.5 6.5 9.8 9.8M14.2 14.2l3.3 3.3M17.5 6.5l-3.3 3.3M9.8 14.2l-3.3 3.3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.5l3 1.6" />
      </>
    ),
    cog: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
      </>
    ),
    spark: <path d="M12 3.5 13.9 9l5.6 2-5.6 2-1.9 5.5L10.1 13 4.5 11l5.6-2z" />,
  };
  return (
    <svg viewBox="0 0 24 24" className={cn("size-[18px]", className)} {...common}>
      {paths[name]}
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="relative grid size-8 shrink-0 place-items-center rounded-xl bg-primary">
        <span className="block size-2.5 rounded-full bg-accent" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight">Speakable</span>
      )}
    </Link>
  );
}

function NavItem({ to, label, icon }: { to: string; label: string; icon: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-card text-foreground shadow-[var(--shadow-soft)]"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon name={icon} className={cn(active && "text-accent")} />
      <span className="truncate font-medium">{label}</span>
    </Link>
  );
}

function AppShell() {
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-border bg-surface px-4 py-6 lg:flex">
        <div>
          <div className="px-2">
            <Wordmark />
          </div>
          <nav className="mt-9 space-y-1">
            {primary.map((i) => (
              <NavItem key={i.to} {...i} />
            ))}
          </nav>
          <div className="mt-8 space-y-1 border-t border-border pt-6">
            {secondary.map((i) => (
              <NavItem key={i.to} {...i} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <LanguageSwitcher variant="block" />
          <Link
            to="/practice"
            className="flex items-center gap-3 rounded-2xl bg-primary px-4 py-4 text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
              <Icon name="mic" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">Start speaking</span>
              <span className="block truncate text-xs opacity-70">2 min is enough</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-5 py-3.5 backdrop-blur lg:hidden">
        <Wordmark />
        <div className="flex items-center gap-2">
          <LanguageSwitcher align="right" />
          <button
            onClick={() => setMobileNav((v) => !v)}
            aria-label="Menu"
            className="grid size-10 place-items-center rounded-full border border-border"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              {mobileNav ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </header>

      {mobileNav && (
        <div className="fixed inset-x-0 top-[61px] z-30 border-b border-border bg-background p-4 lg:hidden">
          <div className="space-y-1" onClick={() => setMobileNav(false)}>
            {[...primary, ...secondary].map((i) => (
              <NavItem key={i.to} {...i} />
            ))}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 pb-24 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end border-t border-border bg-background/95 px-2 pb-2 pt-2 backdrop-blur lg:hidden">
        {primary.slice(0, 2).map((i) => (
          <MobileTab key={i.to} {...i} active={pathname === i.to} />
        ))}
        <Link
          to="/practice"
          className="mx-auto -mt-6 grid size-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-[var(--shadow-orb)]"
          aria-label="Start a conversation"
        >
          <Icon name="mic" className="size-6" />
        </Link>
        {primary.slice(2).map((i) => (
          <MobileTab key={i.to} {...i} active={pathname === i.to} />
        ))}
      </nav>
    </div>
  );
}

function MobileTab({
  to,
  label,
  icon,
  active,
}: {
  to: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 py-1.5 text-[0.68rem] font-medium",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon name={icon} className={cn(active && "text-accent")} />
      {label}
    </Link>
  );
}
