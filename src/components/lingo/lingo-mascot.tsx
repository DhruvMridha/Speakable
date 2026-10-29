import { cn } from "@/lib/utils";

/**
 * LINGO — the original mascot.
 * A stylised "spark sprout": a soft pebble-shaped body with a jade shell,
 * a single leaf-antenna, two large expressive eyes, mobile eyebrows and
 * little rounded arms. Same silhouette in every state — only the face,
 * arms and motion change.
 */

export type MascotState =
  | "idle"
  | "listening"
  | "speaking"
  | "thinking"
  | "confused"
  | "encouraging"
  | "correct"
  | "celebrating"
  | "streak"
  | "levelup"
  | "retry"
  | "interrupted";

type Expression = {
  /** eyelid closure 0 = wide open, 1 = closed */
  lid: number;
  pupil: [number, number];
  browL: { y: number; r: number };
  browR: { y: number; r: number };
  mouth: string;
  mouthFill?: boolean;
  cheeks?: boolean;
  armL: string;
  armR: string;
  tilt: number;
  bodyAnim?: string;
  sparkles?: boolean;
};

const M_SMILE_S = "M84 122 Q100 133 116 122";
const M_SMILE_L = "M80 118 Q100 140 120 118 Q100 128 80 118";
const M_O = "M100 126 m-11 0 a11 9 0 1 0 22 0 a11 9 0 1 0 -22 0";
const M_SMALL = "M92 124 Q100 130 108 124";
const M_WAVE = "M86 125 Q93 118 100 125 Q107 132 114 125";
const M_FLAT = "M89 126 H111";

const ARM_DOWN_L = "M52 108 Q40 118 44 132";
const ARM_DOWN_R = "M148 108 Q160 118 156 132";
const ARM_UP_L = "M52 104 Q36 96 34 80";
const ARM_UP_R = "M148 104 Q164 96 166 80";
const ARM_CHIN_R = "M148 108 Q136 124 118 128";
const ARM_OPEN_L = "M52 106 Q34 110 30 122";
const ARM_OPEN_R = "M148 106 Q166 110 170 122";

const expressions: Record<MascotState, Expression> = {
  idle: {
    lid: 0.06,
    pupil: [0, 0],
    browL: { y: 0, r: -4 },
    browR: { y: 0, r: 4 },
    mouth: M_SMILE_S,
    armL: ARM_DOWN_L,
    armR: ARM_DOWN_R,
    tilt: 0,
    bodyAnim: "mascot-breathe 4s ease-in-out infinite",
  },
  listening: {
    lid: 0,
    pupil: [1.5, -2],
    browL: { y: -4, r: -9 },
    browR: { y: -4, r: 9 },
    mouth: M_SMALL,
    armL: ARM_DOWN_L,
    armR: ARM_CHIN_R,
    tilt: -6,
    bodyAnim: "mascot-lean 2.4s ease-in-out infinite",
  },
  speaking: {
    lid: 0.05,
    pupil: [0, -1],
    browL: { y: -2, r: -6 },
    browR: { y: -2, r: 6 },
    mouth: M_O,
    mouthFill: true,
    armL: ARM_OPEN_L,
    armR: ARM_OPEN_R,
    tilt: 0,
    bodyAnim: "mascot-talk 0.62s ease-in-out infinite",
  },
  thinking: {
    lid: 0.3,
    pupil: [4, -3],
    browL: { y: -6, r: 12 },
    browR: { y: 1, r: 3 },
    mouth: M_WAVE,
    armL: ARM_DOWN_L,
    armR: ARM_CHIN_R,
    tilt: 7,
    bodyAnim: "mascot-breathe 2.6s ease-in-out infinite",
  },
  confused: {
    lid: 0.18,
    pupil: [-4, -2],
    browL: { y: -7, r: 16 },
    browR: { y: 2, r: -2 },
    mouth: M_WAVE,
    armL: ARM_DOWN_L,
    armR: ARM_CHIN_R,
    tilt: -8,
    bodyAnim: "mascot-lean 3s ease-in-out infinite",
  },
  encouraging: {
    lid: 0.1,
    pupil: [0, 1],
    browL: { y: -3, r: -10 },
    browR: { y: -3, r: 10 },
    mouth: M_SMILE_L,
    cheeks: true,
    armL: ARM_DOWN_L,
    armR: ARM_UP_R,
    tilt: 3,
    bodyAnim: "mascot-breathe 3.4s ease-in-out infinite",
  },
  correct: {
    lid: 0.55,
    pupil: [0, 0],
    browL: { y: -8, r: -12 },
    browR: { y: -8, r: 12 },
    mouth: M_SMILE_L,
    cheeks: true,
    armL: ARM_UP_L,
    armR: ARM_UP_R,
    tilt: 0,
    bodyAnim: "mascot-hop 0.9s ease-in-out infinite",
    sparkles: true,
  },
  celebrating: {
    lid: 0.6,
    pupil: [0, 0],
    browL: { y: -10, r: -14 },
    browR: { y: -10, r: 14 },
    mouth: M_SMILE_L,
    cheeks: true,
    armL: ARM_UP_L,
    armR: ARM_UP_R,
    tilt: 0,
    bodyAnim: "mascot-cheer 0.8s ease-in-out infinite",
    sparkles: true,
  },
  streak: {
    lid: 0.35,
    pupil: [0, -1],
    browL: { y: -7, r: -12 },
    browR: { y: -7, r: 12 },
    mouth: M_SMILE_L,
    cheeks: true,
    armL: ARM_DOWN_L,
    armR: ARM_UP_R,
    tilt: -3,
    bodyAnim: "mascot-hop 1.4s ease-in-out infinite",
    sparkles: true,
  },
  levelup: {
    lid: 0.15,
    pupil: [0, -3],
    browL: { y: -9, r: -8 },
    browR: { y: -9, r: 8 },
    mouth: M_O,
    mouthFill: true,
    armL: ARM_UP_L,
    armR: ARM_UP_R,
    tilt: 0,
    bodyAnim: "mascot-cheer 1.1s ease-in-out infinite",
    sparkles: true,
  },
  retry: {
    lid: 0.12,
    pupil: [0, 2],
    browL: { y: -2, r: 8 },
    browR: { y: -2, r: -8 },
    mouth: M_SMALL,
    armL: ARM_OPEN_L,
    armR: ARM_OPEN_R,
    tilt: 4,
    bodyAnim: "mascot-breathe 3s ease-in-out infinite",
  },
  interrupted: {
    lid: 0,
    pupil: [0, -3],
    browL: { y: -9, r: -2 },
    browR: { y: -9, r: 2 },
    mouth: M_FLAT,
    armL: ARM_OPEN_L,
    armR: ARM_OPEN_R,
    tilt: 0,
    bodyAnim: "mascot-startle 0.9s ease-in-out infinite",
  },
};

export const mascotLine: Record<MascotState, string> = {
  idle: "Ready when you are.",
  listening: "I'm all ears.",
  speaking: "Let me tell you something…",
  thinking: "Hmm, let me think.",
  confused: "Hmm — almost!",
  encouraging: "You've got this.",
  correct: "That's it!",
  celebrating: "Brilliant work!",
  streak: "Lingo is proud of you.",
  levelup: "Level up!",
  retry: "Say it again with me.",
  interrupted: "Go ahead — you first.",
};

function Eye({ cx, lid, pupil }: { cx: number; lid: number; pupil: [number, number] }) {
  const ry = 15 * (1 - lid);
  return (
    <g>
      {lid > 0.45 ? (
        <path
          d={`M${cx - 14} 92 Q${cx} ${92 - 12} ${cx + 14} 92`}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      ) : (
        <>
          <ellipse cx={cx} cy="90" rx="13" ry={Math.max(2.5, ry)} fill="var(--card)" />
          <circle cx={cx + pupil[0]} cy={90 + pupil[1]} r={Math.min(6.5, Math.max(3, ry * 0.45))} fill="var(--ink)" />
          <circle cx={cx + pupil[0] + 2.4} cy={90 + pupil[1] - 2.6} r="1.9" fill="var(--card)" />
        </>
      )}
    </g>
  );
}

export function LingoMascot({
  state = "idle",
  className,
  title,
}: {
  state?: MascotState;
  className?: string;
  title?: string;
}) {
  const e = expressions[state];
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={title ?? `Lingo mascot — ${state}`}
      className={cn("size-40 select-none", className)}
    >
      <defs>
        <clipPath id="lingo-body-clip">
          <path d="M100 26c34 0 60 26 60 62 0 40-24 66-60 66S40 128 40 88c0-36 26-62 60-62Z" />
        </clipPath>
      </defs>

      {/* ground shadow */}
      <ellipse cx="100" cy="168" rx="42" ry="7" fill="var(--ink)" opacity="0.09" />

      <g
        style={{
          transformOrigin: "100px 150px",
          transform: `rotate(${e.tilt}deg)`,
          animation: e.bodyAnim,
          transition: "transform 420ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* arms */}
        <g fill="none" stroke="var(--accent)" strokeWidth="9" strokeLinecap="round">
          <path d={e.armL} style={{ transition: "d 400ms ease" }} />
          <path d={e.armR} style={{ transition: "d 400ms ease" }} />
        </g>

        {/* leaf antenna */}
        <path d="M100 34 Q99 20 101 12" stroke="var(--accent)" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path
          d="M101 12c9-8 20-7 22-6 1 2-3 13-12 15-6 1-10-4-10-9Z"
          fill="var(--accent)"
          opacity="0.9"
        />

        {/* body */}
        <path
          d="M100 26c34 0 60 26 60 62 0 40-24 66-60 66S40 128 40 88c0-36 26-62 60-62Z"
          fill="var(--accent)"
        />
        <g clipPath="url(#lingo-body-clip)">
          <ellipse cx="100" cy="132" rx="46" ry="38" fill="var(--card)" opacity="0.22" />
          <ellipse cx="70" cy="58" rx="26" ry="18" fill="var(--card)" opacity="0.18" />
        </g>

        {/* face plate */}
        <ellipse cx="100" cy="98" rx="50" ry="44" fill="var(--card)" opacity="0.94" />

        {/* eyebrows */}
        <g stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" fill="none">
          <path
            d="M74 66 H92"
            style={{
              transformOrigin: "83px 66px",
              transform: `translateY(${e.browL.y}px) rotate(${e.browL.r}deg)`,
              transition: "transform 320ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />
          <path
            d="M108 66 H126"
            style={{
              transformOrigin: "117px 66px",
              transform: `translateY(${e.browR.y}px) rotate(${e.browR.r}deg)`,
              transition: "transform 320ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </g>

        {/* eyes */}
        <Eye cx={83} lid={e.lid} pupil={e.pupil} />
        <Eye cx={117} lid={e.lid} pupil={e.pupil} />

        {/* cheeks */}
        {e.cheeks && (
          <>
            <ellipse cx="70" cy="116" rx="8" ry="5" fill="var(--warn)" opacity="0.35" />
            <ellipse cx="130" cy="116" rx="8" ry="5" fill="var(--warn)" opacity="0.35" />
          </>
        )}

        {/* mouth */}
        <path
          d={e.mouth}
          fill={e.mouthFill ? "var(--ink)" : "none"}
          stroke="var(--ink)"
          strokeWidth={e.mouthFill ? 0 : 5}
          strokeLinecap="round"
          style={{
            transition: "d 260ms ease",
            animation: state === "speaking" ? "mascot-mouth 0.45s ease-in-out infinite" : undefined,
            transformOrigin: "100px 126px",
          }}
        />
      </g>

      {/* sparkles */}
      {e.sparkles && (
        <g fill="var(--accent)">
          {[
            [38, 52, 4],
            [166, 62, 3.4],
            [156, 26, 2.6],
            [30, 100, 2.6],
          ].map(([x, y, r], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              style={{ animation: `mascot-sparkle 1.5s ease-in-out ${i * 0.24}s infinite` }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

/** Mascot with an optional speech bubble and audio waveform for voice states. */
export function LingoAvatar({
  state = "idle",
  line,
  className,
  size = "md",
}: {
  state?: MascotState;
  line?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: "size-20", md: "size-32", lg: "size-52 sm:size-64" }[size];
  const active = state === "speaking" || state === "listening" || state === "interrupted";
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative grid place-items-center">
        {active && (
          <>
            <span
              className={cn(
                "absolute rounded-full",
                dims,
                state === "interrupted" ? "bg-warn/20" : "bg-accent/18",
              )}
              style={{ animation: "ring-out 2.6s ease-out infinite" }}
            />
            <span
              className={cn("absolute rounded-full bg-accent/12", dims)}
              style={{ animation: "ring-out 2.6s ease-out 1.3s infinite" }}
            />
          </>
        )}
        <LingoMascot state={state} className={cn(dims, "relative")} />
      </div>
      {line ? (
        <div className="relative mt-4 max-w-xs rounded-2xl border border-border bg-card px-4 py-2.5 text-center text-sm shadow-[var(--shadow-soft)]">
          <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-l border-t border-border bg-card" />
          {line}
        </div>
      ) : null}
    </div>
  );
}

/** Small waveform used beside the mascot while audio is flowing. */
export function MascotWave({ state, className }: { state: MascotState; className?: string }) {
  const heights = [0.4, 0.75, 1, 0.6, 0.9, 0.5, 0.8];
  const active = state === "speaking" || state === "listening" || state === "interrupted";
  return (
    <div className={cn("flex h-8 items-center gap-[5px]", className)}>
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-[4px] origin-center rounded-full transition-all duration-300",
            state === "interrupted" ? "bg-warn" : "bg-accent",
          )}
          style={{
            height: `${h * 100}%`,
            animation: active ? `bar ${0.7 + i * 0.11}s ease-in-out infinite` : undefined,
            transform: active ? undefined : "scaleY(0.16)",
            opacity: active ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}
