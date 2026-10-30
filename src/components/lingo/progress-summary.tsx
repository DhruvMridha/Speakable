import { useEffect, useState } from "react";
import { BookOpen, Flame, Mic, Sparkles, Target } from "lucide-react";
import { Card, Eyebrow } from "@/components/lingo/kit";
import {
  ALL_BADGES,
  calculateSessionXp,
  computeEarnedBadgeIds,
  computeStreak,
  levelFromXp,
  readGamification,
  xpForLevel,
  type GamificationState,
  type PracticeSession,
} from "@/lib/sessions";

const BADGE_ICONS = {
  mic: Mic,
  flame: Flame,
  book: BookOpen,
  target: Target,
} as const;

const DEFAULT_STATE: GamificationState = {
  totalXp: 0,
  awardedSessionIds: [],
  practiceDays: [],
  dailyGoalMinutes: 5,
};

export function ProgressSummary({
  sessions,
  featuredSessionId,
}: {
  sessions: PracticeSession[];
  featuredSessionId?: string;
}) {
  const [state, setState] = useState(DEFAULT_STATE);

  useEffect(() => {
    setState(readGamification());
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todaySeconds = sessions
    .filter((session) => session.endedAt.startsWith(today))
    .reduce((sum, session) => {
      const start = Date.parse(session.startedAt);
      const end = Date.parse(session.endedAt);
      return (
        sum +
        (Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, (end - start) / 1000) : 0)
      );
    }, 0);
  const todayMinutes = Math.floor(todaySeconds / 60);
  const goalMinutes = state.dailyGoalMinutes;
  const goalProgress = goalMinutes > 0 ? Math.min(100, (todayMinutes / goalMinutes) * 100) : 0;
  const level = levelFromXp(state.totalXp);
  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const levelProgress =
    nextLevelXp > levelStartXp
      ? Math.min(100, ((state.totalXp - levelStartXp) / (nextLevelXp - levelStartXp)) * 100)
      : 100;
  const featuredSession =
    featuredSessionId && state.awardedSessionIds.includes(featuredSessionId)
      ? sessions.find((session) => session.id === featuredSessionId)
      : undefined;
  const earnedBadges = computeEarnedBadgeIds(sessions, state);
  const streak = computeStreak(state.practiceDays);

  return (
    <Card className="mt-7 overflow-hidden border-accent/20 bg-gradient-to-br from-accent-soft/70 via-card to-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow>Your progress</Eyebrow>
          <div className="mt-2 flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-5 text-accent" />
            <h2 className="font-display text-2xl font-semibold">{state.totalXp} XP</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Level {level} · {Math.max(0, nextLevelXp - state.totalXp)} XP to level {level + 1}
          </p>
        </div>
        {featuredSession ? (
          <span className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
            +{calculateSessionXp(featuredSession)} XP earned
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target aria-hidden="true" className="size-4 text-accent" />
              <p className="text-sm font-medium">Daily speaking goal</p>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {todayMinutes}/{goalMinutes} min
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-label="Daily speaking goal"
            aria-valuemin={0}
            aria-valuemax={goalMinutes}
            aria-valuenow={Math.min(todayMinutes, goalMinutes)}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {goalProgress >= 100
              ? "Daily goal complete. Great work!"
              : `${goalMinutes} minutes a day builds a habit.`}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/80 p-4">
          <span className="grid size-10 place-items-center rounded-full bg-warn-soft text-warn">
            <Flame aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="font-display text-xl font-semibold tabular-nums">
              {streak} day{streak === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-muted-foreground">Practice streak</p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Achievements</h3>
          <span className="text-xs text-muted-foreground">
            {earnedBadges.size} of {ALL_BADGES.length} unlocked
          </span>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_BADGES.map((badge) => {
            const Icon = BADGE_ICONS[badge.icon];
            const earned = earnedBadges.has(badge.id);
            return (
              <li
                key={badge.id}
                className={`flex items-center gap-2 rounded-xl border p-3 ${
                  earned
                    ? "border-accent/30 bg-accent-soft/40"
                    : "border-border bg-card/60 opacity-60"
                }`}
                title={badge.hint}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0 text-accent" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{badge.name}</span>
                  <span className="block truncate text-[0.68rem] text-muted-foreground">
                    {earned ? "Unlocked" : badge.hint}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
        <div className="h-full rounded-full bg-primary" style={{ width: `${levelProgress}%` }} />
      </div>
      <p className="mt-1 text-right text-xs text-muted-foreground">
        {state.totalXp - levelStartXp}/{nextLevelXp - levelStartXp} XP to level {level + 1}
      </p>
    </Card>
  );
}
