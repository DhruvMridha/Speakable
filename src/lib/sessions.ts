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
