import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  getPracticeSession,
  getSessionDuration,
  readPracticeSessions,
  readPracticePreferences,
  awardSessionXp,
  calculateSessionXp,
  computeEarnedBadgeIds,
  computeStreak,
  levelFromXp,
  readGamification,
  savePracticePreferences,
  savePracticeSession,
  xpForLevel,
} from "../src/lib/sessions.ts";
import { streamRimeVoiceTest, synthesizeRimeVoiceTest } from "../src/server/rime.server.ts";
import {
  explainGeminiProviderError,
  generateTutorResponse,
  getGeminiErrorDetails,
} from "../src/server/llm.server.ts";

const values = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  },
};

afterEach(() => values.clear());

function makeSession(id, startedAt, endedAt) {
  return {
    id,
    language: "es",
    languageName: "Spanish",
    level: "Intermediate",
    topic: "Travel",
    goal: "Speak more confidently",
    startedAt,
    endedAt,
    turns: [],
    review: null,
    reviewError: null,
  };
}

function addTutorTurns(session, count) {
  return {
    ...session,
    turns: Array.from({ length: count }, (_, index) => ({
      id: `turn-${index}`,
      role: "tutor",
      text: "Hello",
      createdAt: session.endedAt,
    })),
  };
}

test("saves and retrieves a session from browser storage", () => {
  const session = makeSession("session-1", "2026-10-29T10:00:00.000Z", "2026-10-29T10:02:30.000Z");
  assert.equal(savePracticeSession(session), true);
  assert.equal(getPracticeSession("session-1")?.topic, "Travel");
  assert.equal(readPracticeSessions().length, 1);
});

test("orders sessions newest first and replaces duplicate IDs", () => {
  const earlier = makeSession("same", "2026-10-29T10:00:00.000Z", "2026-10-29T10:01:00.000Z");
  const later = { ...earlier, topic: "Food", endedAt: "2026-10-29T11:00:00.000Z" };
  savePracticeSession(earlier);
  savePracticeSession(later);
  assert.equal(readPracticeSessions().length, 1);
  assert.equal(readPracticeSessions()[0].topic, "Food");
});

test("calculates duration from recorded timestamps", () => {
  const session = makeSession("session-2", "2026-10-29T10:00:00.000Z", "2026-10-29T10:01:42.000Z");
  assert.equal(getSessionDuration(session), 102);
  assert.equal(getSessionDuration({ ...session, startedAt: "invalid" }), 0);
});

test("persists practice defaults independently by language", () => {
  const preferences = { level: "Beginner", topic: "Food", goal: "Build useful vocabulary" };
  assert.equal(savePracticePreferences("fr", preferences), true);
  assert.deepEqual(readPracticePreferences("fr", "Fallback"), preferences);
  assert.equal(readPracticePreferences("es", "Travel").topic, "Travel");
});

test("awards XP once for completed sessions and gives no XP for empty sessions", () => {
  const session = addTutorTurns(
    makeSession("xp-session", "2026-10-29T10:00:00.000Z", "2026-10-29T10:02:30.000Z"),
    2,
  );
  assert.equal(
    calculateSessionXp({
      ...session,
      review: { summary: "Good", corrections: [], phrases: [], recommendation: "Continue" },
    }),
    40,
  );
  assert.equal(awardSessionXp(session), 20);
  assert.equal(awardSessionXp(session), 0);
  assert.equal(awardSessionXp(makeSession("empty-session", session.startedAt, session.endedAt)), 0);
  assert.equal(readGamification().totalXp, 20);
  assert.deepEqual(readGamification().practiceDays, ["2026-10-29"]);
});

test("derives levels and keeps a streak active through the previous day", () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date(`${today}T00:00:00.000Z`);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);
  assert.equal(levelFromXp(xpForLevel(3)), 3);
  assert.equal(computeStreak([yesterday]), 1);
  assert.equal(computeStreak([today, yesterday]), 2);
  assert.equal(computeStreak(["2000-01-01"]), 0);
});

test("unlocks achievement badges from completed saved sessions", () => {
  const session = addTutorTurns(
    makeSession("badge-session", "2026-10-29T10:00:00.000Z", "2026-10-29T10:02:30.000Z"),
    1,
  );
  const state = {
    totalXp: 0,
    awardedSessionIds: [],
    practiceDays: [],
    dailyGoalMinutes: 5,
  };
  assert.equal(computeEarnedBadgeIds([session], state).has("first_session"), true);
  assert.equal(
    computeEarnedBadgeIds([makeSession("empty", session.startedAt, session.endedAt)], state).has(
      "first_session",
    ),
    false,
  );
});

test("reports a clear error when the Rime server key is missing", async () => {
  const previous = process.env.RIME_API_KEY;
  delete process.env.RIME_API_KEY;
  try {
    await assert.rejects(
      synthesizeRimeVoiceTest("Bonjour", "fr"),
      /Missing RIME_API_KEY on the server\./,
    );
  } finally {
    if (previous === undefined) delete process.env.RIME_API_KEY;
    else process.env.RIME_API_KEY = previous;
  }
});

test("streams Rime audio without buffering it into base64 on the server", async () => {
  const previousKey = process.env.RIME_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.RIME_API_KEY = "test-rime-key";
  globalThis.fetch = async () =>
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(Uint8Array.from([1, 2, 3]));
          controller.enqueue(Uint8Array.from([4, 5]));
          controller.close();
        },
      }),
      { headers: { "content-type": "audio/webm;codecs=opus" } },
    );
  try {
    const response = await streamRimeVoiceTest("Hello", "en", "test-request-1");
    assert.equal(response.headers.get("content-type"), "audio/webm;codecs=opus");
    assert.deepEqual(
      new Uint8Array(await response.arrayBuffer()),
      Uint8Array.from([1, 2, 3, 4, 5]),
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.RIME_API_KEY;
    else process.env.RIME_API_KEY = previousKey;
  }
});

test("reports a clear error when the Gemini server key is missing", async () => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await assert.rejects(
      generateTutorResponse({
        text: "Hola",
        language: "es",
        level: "Beginner",
        topic: "Travel",
        goal: "Speak more confidently",
        history: [],
      }),
      /Gemini is not configured\. Set GEMINI_API_KEY on the server\./,
    );
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});

test("classifies Gemini authentication, quota, and provider errors safely", () => {
  assert.match(explainGeminiProviderError({ status: 403 }), /credentials/);
  assert.match(explainGeminiProviderError({ status: 429 }), /quota/);
  assert.match(explainGeminiProviderError({ status: 503 }), /temporarily unavailable/);
  assert.doesNotMatch(explainGeminiProviderError(new Error("private detail")), /private detail/);
});

test("classifies Gemini quota details nested in the SDK error message", () => {
  const error = new Error(
    JSON.stringify({
      error: {
        code: 400,
        message: JSON.stringify({
          error: {
            code: 429,
            status: "RESOURCE_EXHAUSTED",
            message: "Free-tier requests per day limit exceeded.",
            details: [
              {
                "@type": "type.googleapis.com/google.rpc.RetryInfo",
                retryDelay: "6518s",
              },
            ],
          },
        }),
      },
    }),
  );
  Object.assign(error, { status: 400 });
  assert.deepEqual(getGeminiErrorDetails(error), {
    status: 429,
    code: "RESOURCE_EXHAUSTED",
    retryDelay: "6518s",
  });
  assert.match(explainGeminiProviderError(error), /quota reached/);
  assert.match(explainGeminiProviderError(error), /6518s/);
});
