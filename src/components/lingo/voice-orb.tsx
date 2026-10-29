import { cn } from "@/lib/utils";

export type VoiceState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "interrupted"
  | "completed";

export const voiceCopy: Record<VoiceState, { label: string; hint: string }> = {
  idle: { label: "Tap to speak", hint: "Lingo is ready when you are" },
  listening: { label: "I'm listening…", hint: "Speak naturally — take your time" },
  thinking: { label: "Thinking…", hint: "Understanding what you said" },
  speaking: { label: "Lingo is speaking…", hint: "Interrupt any time — just talk" },
  interrupted: { label: "Go ahead —", hint: "Lingo stopped so you can continue" },
  completed: { label: "Conversation complete", hint: "Preparing your feedback" },
};

function Bars({ state }: { state: VoiceState }) {
  const heights = [0.35, 0.7, 1, 0.55, 0.85, 0.45, 0.75];
  const active = state === "listening" || state === "speaking" || state === "interrupted";
  return (
    <div className="flex h-14 items-center gap-[6px]">
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-[5px] origin-center rounded-full transition-all duration-300",
            state === "speaking"
              ? "bg-accent-foreground/85"
              : state === "interrupted"
                ? "bg-warn"
                : "bg-accent-foreground/80",
          )}
          style={{
            height: `${h * 100}%`,
            animation: active ? `bar ${0.7 + i * 0.11}s ease-in-out infinite` : undefined,
            transform: active ? undefined : "scaleY(0.18)",
          }}
        />
      ))}
    </div>
  );
}

export function VoiceOrb({
  state,
  onClick,
  size = "lg",
}: {
  state: VoiceState;
  onClick?: () => void;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "size-56 sm:size-64 lg:size-72" : "size-40";

  const surface: Record<VoiceState, string> = {
    idle: "bg-primary text-primary-foreground",
    listening: "bg-accent text-accent-foreground",
    thinking: "bg-surface text-foreground border border-border-strong",
    speaking: "bg-accent text-accent-foreground",
    interrupted: "bg-warn text-primary-foreground",
    completed: "bg-secondary text-foreground border border-border",
  };

  return (
    <div className="relative grid place-items-center">
      {/* halo rings */}
      {(state === "listening" || state === "speaking") && (
        <>
          <span
            className={cn(
              "absolute rounded-full",
              dim,
              state === "speaking" ? "bg-accent/15" : "bg-accent/20",
            )}
            style={{ animation: "ring-out 2.6s ease-out infinite" }}
          />
          <span
            className={cn("absolute rounded-full bg-accent/12", dim)}
            style={{ animation: "ring-out 2.6s ease-out 1.3s infinite" }}
          />
        </>
      )}
      {state === "interrupted" && (
        <span
          className={cn("absolute rounded-full bg-warn/25", dim)}
          style={{ animation: "ring-out 1.4s ease-out infinite" }}
        />
      )}

      <button
        type="button"
        onClick={onClick}
        aria-label={voiceCopy[state].label}
        className={cn(
          "relative grid place-items-center rounded-full transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
          dim,
          surface[state],
          state === "idle" && "shadow-[var(--shadow-lift)] hover:scale-[1.02]",
          (state === "speaking" || state === "listening") && "shadow-[var(--shadow-orb)]",
        )}
        style={{
          animation:
            state === "listening"
              ? "orb-listen 1.5s ease-in-out infinite"
              : state === "idle" || state === "speaking"
                ? "orb-pulse 3.4s ease-in-out infinite"
                : undefined,
        }}
      >
        {state === "idle" && (
          <svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
          </svg>
        )}
        {(state === "listening" || state === "speaking" || state === "interrupted") && (
          <Bars state={state} />
        )}
        {state === "thinking" && (
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-2.5 rounded-full bg-muted-foreground"
                style={{ animation: `orb-pulse 1.1s ease-in-out ${i * 0.18}s infinite` }}
              />
            ))}
          </div>
        )}
        {state === "completed" && (
          <svg viewBox="0 0 24 24" className="size-12 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12.5 10 17.5 19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
