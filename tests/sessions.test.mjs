import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  getPracticeSession,
  getSessionDuration,
  readPracticeSessions,
  readPracticePreferences,
  savePracticePreferences,
  savePracticeSession,
} from "../src/lib/sessions.ts";
import { synthesizeRimeVoiceTest } from "../src/server/rime.server.ts";
import { generateTutorResponse } from "../src/server/llm.server.ts";

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
