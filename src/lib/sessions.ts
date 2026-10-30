export type PracticeLanguage = "en" | "es" | "fr" | "hi";
export type LearnerLevel = "Beginner" | "Elementary" | "Intermediate" | "Advanced";
export type ConversationTurn = {
  id: string;
  role: "learner" | "tutor";
  text: string;
  explanation?: string;
  createdAt: string;
};

export type SessionReview = {
  summary: string;
  corrections: { heard: string; suggested: string; explanation: string }[];
  phrases: { phrase: string; meaning: string }[];
  recommendation: string;
};

export type PracticeSession = {
  id: string;
  language: PracticeLanguage;
  languageName: string;
  level: LearnerLevel;
  topic: string;
  goal: string;
  startedAt: string;
  endedAt: string;
  turns: ConversationTurn[];
  review: SessionReview | null;
  reviewError: string | null;
};

const STORAGE_KEY = "speakyy.practice_sessions.v1";
const PREFERENCES_KEY = "speakyy.practice_preferences.v1";
const GAMIFICATION_KEY = "speakyy.gamification.v1";

// ---------------------------------------------------------------------------
// XP rules
// ---------------------------------------------------------------------------
/** XP awarded for a session based on how many completed tutor turns it had. */
export function calculateSessionXp(session: PracticeSession): number {
  const completedTurns = session.turns.filter((t) => t.role === "tutor").length;
  if (completedTurns === 0) return 0;
  // 10 XP per completed turn, capped at 150, bonus 20 for having AI review
  const base = Math.min(completedTurns * 10, 150);
  const reviewBonus = session.review ? 20 : 0;
  return base + reviewBonus;
}

/** XP required to reach a given level (starts at level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  // 100 XP for level 2, 150 for level 3, 200 for level 4, … (+50 per level)
  return Math.max(0, (level - 1) * 100 + Math.max(0, level - 2) * 50);
}

/** Derive level from total XP. */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

// ---------------------------------------------------------------------------
// Gamification store
// ---------------------------------------------------------------------------
export type GamificationState = {
  /** Total accumulated XP across all time. */
  totalXp: number;
  /** Session IDs that have already had XP awarded, so refreshing doesn't re-award. */
  awardedSessionIds: string[];
  /** ISO date strings (YYYY-MM-DD) of days when at least one session was completed. */
  practiceDays: string[];
  /** Daily goal target in minutes of speaking time. */
  dailyGoalMinutes: number;
};

const DEFAULT_GAMIFICATION: GamificationState = {
  totalXp: 0,
  awardedSessionIds: [],
  practiceDays: [],
  dailyGoalMinutes: 5,
};

export function readGamification(): GamificationState {
  try {
    const raw = window.localStorage.getItem(GAMIFICATION_KEY);
    if (!raw) return { ...DEFAULT_GAMIFICATION };
    const parsed = JSON.parse(raw) as Partial<GamificationState>;
    return {
      totalXp:
        typeof parsed.totalXp === "number" && Number.isFinite(parsed.totalXp)
          ? Math.max(0, parsed.totalXp)
          : 0,
      awardedSessionIds: Array.isArray(parsed.awardedSessionIds) ? parsed.awardedSessionIds : [],
      practiceDays: Array.isArray(parsed.practiceDays) ? parsed.practiceDays : [],
      dailyGoalMinutes:
        typeof parsed.dailyGoalMinutes === "number" &&
        Number.isFinite(parsed.dailyGoalMinutes) &&
        parsed.dailyGoalMinutes > 0
          ? parsed.dailyGoalMinutes
          : DEFAULT_GAMIFICATION.dailyGoalMinutes,
    };
  } catch {
    return { ...DEFAULT_GAMIFICATION };
  }
}

function writeGamification(state: GamificationState): void {
  try {
    window.localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(state));
  } catch {
    // storage quota — best effort
  }
}

/**
 * Award XP for a session. Safe to call multiple times — idempotent on the
 * same session ID. Returns the XP awarded (0 if already awarded).
 */
export function awardSessionXp(session: PracticeSession): number {
  const state = readGamification();
  if (state.awardedSessionIds.includes(session.id)) return 0;

  const xp = calculateSessionXp(session);
  if (xp === 0) return 0;
  const day = session.endedAt.slice(0, 10); // YYYY-MM-DD

  const next: GamificationState = {
    ...state,
    totalXp: state.totalXp + xp,
    awardedSessionIds: [...state.awardedSessionIds, session.id].slice(-200),
    practiceDays: state.practiceDays.includes(day)
      ? state.practiceDays
      : [...state.practiceDays, day].sort(),
  };
  writeGamification(next);
  return xp;
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------
/** Current streak length in days (consecutive days up to today). */
export function computeStreak(practiceDays: string[]): number {
  if (practiceDays.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...new Set(practiceDays)].sort().reverse();
  const yesterdayDate = new Date(`${today}T00:00:00.000Z`);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let cursor = sorted[0]!;
  for (const day of sorted) {
    if (day === cursor) {
      streak++;
      const previousDate = new Date(`${cursor}T00:00:00.000Z`);
      previousDate.setUTCDate(previousDate.getUTCDate() - 1);
      cursor = previousDate.toISOString().slice(0, 10);
    } else if (day < cursor) {
      // gap — streak broken
      break;
    }
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Daily goal
// ---------------------------------------------------------------------------
/** Minutes of practice completed today (across all languages). */
export function todayPracticeMinutes(): number {
  const today = new Date().toISOString().slice(0, 10);
  const sessions = readPracticeSessions();
  const todaySeconds = sessions
    .filter((s) => s.endedAt.startsWith(today))
    .reduce((sum, s) => sum + getSessionDuration(s), 0);
  return Math.floor(todaySeconds / 60);
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
export type BadgeId =
  "first_session" | "streak_3" | "streak_7" | "ten_sessions" | "polyglot" | "level_5";

export type Badge = {
  id: BadgeId;
  name: string;
  hint: string;
  icon: "mic" | "flame" | "book" | "target";
};

export const ALL_BADGES: Badge[] = [
  {
    id: "first_session",
    name: "First Conversation",
    hint: "Complete your first session",
    icon: "mic",
  },
  { id: "streak_3", name: "3-Day Streak", hint: "Practise 3 days in a row", icon: "flame" },
  { id: "streak_7", name: "7-Day Streak", hint: "Practise 7 days in a row", icon: "flame" },
  { id: "ten_sessions", name: "10 Sessions", hint: "Complete 10 practice sessions", icon: "book" },
  { id: "polyglot", name: "Polyglot", hint: "Practise in 2 or more languages", icon: "target" },
  { id: "level_5", name: "Level 5", hint: "Reach level 5", icon: "target" },
];

export function computeEarnedBadgeIds(
  sessions: PracticeSession[],
  state: GamificationState,
): Set<BadgeId> {
  const earned = new Set<BadgeId>();
  const streak = computeStreak(state.practiceDays);
  const level = levelFromXp(state.totalXp);
  const completedSessions = sessions.filter((session) =>
    session.turns.some((turn) => turn.role === "tutor"),
  );
  const languages = new Set(completedSessions.map((session) => session.language));

  if (completedSessions.length >= 1) earned.add("first_session");
  if (streak >= 3) earned.add("streak_3");
  if (streak >= 7) earned.add("streak_7");
  if (completedSessions.length >= 10) earned.add("ten_sessions");
  if (languages.size >= 2) earned.add("polyglot");
  if (level >= 5) earned.add("level_5");
  return earned;
}

export type PracticePreferences = {
  level: LearnerLevel;
  topic: string;
  goal: string;
};

export const DEFAULT_PRACTICE_GOAL = "Speak more confidently";

export function readPracticePreferences(
  language: PracticeLanguage,
  fallbackTopic: string,
): PracticePreferences {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, Partial<PracticePreferences>>) : {};
    const saved = all[language];
    return {
      level: LEVELS.includes(saved?.level as LearnerLevel)
        ? (saved!.level as LearnerLevel)
        : "Intermediate",
      topic: typeof saved?.topic === "string" && saved.topic.trim() ? saved.topic : fallbackTopic,
      goal:
        typeof saved?.goal === "string" && saved.goal.trim() ? saved.goal : DEFAULT_PRACTICE_GOAL,
    };
  } catch {
    return { level: "Intermediate", topic: fallbackTopic, goal: DEFAULT_PRACTICE_GOAL };
  }
}

export function savePracticePreferences(
  language: PracticeLanguage,
  preferences: PracticePreferences,
) {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, PracticePreferences>) : {};
    all[language] = preferences;
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

export function readPracticeSessions(): PracticeSession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(isPracticeSession).sort((a, b) => b.endedAt.localeCompare(a.endedAt));
  } catch {
    return [];
  }
}

export function savePracticeSession(session: PracticeSession): boolean {
  try {
    const sessions = readPracticeSessions().filter((item) => item.id !== session.id);
    sessions.unshift(session);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 50)));
    return true;
  } catch {
    return false;
  }
}

export function getPracticeSession(id: string | undefined) {
  if (!id) return undefined;
  return readPracticeSessions().find((session) => session.id === id);
}

export function getSessionDuration(session: PracticeSession) {
  const start = Date.parse(session.startedAt);
  const end = Date.parse(session.endedAt);
  return Number.isFinite(start) && Number.isFinite(end)
    ? Math.max(0, Math.round((end - start) / 1000))
    : 0;
}

function isPracticeSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<PracticeSession>;
  return (
    typeof session.id === "string" &&
    ["en", "es", "fr", "hi"].includes(session.language ?? "") &&
    typeof session.languageName === "string" &&
    typeof session.topic === "string" &&
    typeof session.goal === "string" &&
    typeof session.startedAt === "string" &&
    typeof session.endedAt === "string" &&
    Array.isArray(session.turns)
  );
}

const LEVELS: LearnerLevel[] = ["Beginner", "Elementary", "Intermediate", "Advanced"];
