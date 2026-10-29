import { useEffect, useRef, useState } from "react";
import { LANGUAGES, LANGUAGE_ORDER, useLanguage, type LanguageCode } from "@/lib/language";
import { cn } from "@/lib/utils";

/** Big picture card used in onboarding. */
export function LanguageCard({
  code,
  selected,
  onSelect,
}: {
  code: LanguageCode;
  selected: boolean;
  onSelect: () => void;
}) {
  const l = LANGUAGES[code];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative overflow-hidden rounded-3xl border text-left transition-all duration-300",
        selected
          ? "border-accent shadow-[var(--shadow-lift)] -translate-y-0.5"
          : "border-border hover:-translate-y-0.5 hover:border-border-strong",
      )}
    >
      <div className="relative h-36 overflow-hidden sm:h-40">
        <img
          src={l.image}
          alt={`${l.name} culture — ${l.region}`}
          width={768}
          height={576}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
        <span className="absolute left-4 top-4 grid size-9 place-items-center rounded-full bg-card/90 text-lg shadow-[var(--shadow-soft)] backdrop-blur">
          {l.flag}
        </span>
        {selected && (
          <span className="absolute right-4 top-4 grid size-7 place-items-center rounded-full bg-accent text-accent-foreground">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7" />
            </svg>
          </span>
        )}
        <span className="absolute bottom-3 left-4 font-display text-xl font-semibold text-primary-foreground">
          {l.nativeName}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 bg-card px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate font-display font-medium">{l.name}</p>
          <p className="truncate text-xs text-muted-foreground">{l.region}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{l.learners}</span>
      </div>
    </button>
  );
}

/** Compact flag + name chip that opens a switcher popover. */
export function LanguageSwitcher({
  className,
  align = "left",
  variant = "chip",
}: {
  className?: string;
  align?: "left" | "right";
  variant?: "chip" | "block";
}) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Learning ${language.name}. Switch language`}
        className={cn(
          "flex items-center gap-2.5 transition-colors",
          variant === "chip"
            ? "rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-border-strong"
            : "w-full rounded-2xl border border-border bg-card px-3.5 py-3 text-sm hover:border-border-strong",
        )}
      >
        <span className="text-base leading-none">{language.flag}</span>
        <span className="min-w-0 flex-1 text-left">
          {variant === "block" && (
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Learning
            </span>
          )}
          <span className="block truncate font-medium">{language.name}</span>
        </span>
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-lift)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {LANGUAGE_ORDER.map((code) => {
            const l = LANGUAGES[code];
            const active = code === language.code;
            return (
              <button
                key={code}
                onClick={() => {
                  setLanguage(code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  active ? "bg-secondary" : "hover:bg-secondary",
                )}
              >
                <span className="text-base">{l.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    Level {l.stats.level} · {l.stats.conversations} conversations
                  </span>
                </span>
                {active && <span className="size-2 shrink-0 rounded-full bg-accent" />}
              </button>
            );
          })}
          <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Switching keeps every language's progress and memory exactly where it was.
          </p>
        </div>
      )}
    </div>
  );
}

/** Horizontal chip row used to scope Progress / Memory to one language. */
export function LanguageTabs({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {LANGUAGE_ORDER.map((code) => {
        const l = LANGUAGES[code];
        const active = code === language.code;
        return (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="text-base leading-none">{l.flag}</span>
            {l.name}
          </button>
        );
      })}
    </div>
  );
}
