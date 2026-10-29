import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/lingo/kit";
import { LANGUAGES, LANGUAGE_ORDER, useLanguage } from "@/lib/language";
import {
  DEFAULT_PRACTICE_GOAL,
  readPracticePreferences,
  savePracticePreferences,
  type LearnerLevel,
  type PracticePreferences,
} from "@/lib/sessions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Speakyy" }] }),
  component: Settings,
});

const LEVELS: LearnerLevel[] = ["Beginner", "Elementary", "Intermediate", "Advanced"];
const GOALS = [
  DEFAULT_PRACTICE_GOAL,
  "Build useful vocabulary",
  "Use grammar more accurately",
  "Improve pronunciation",
];

function Settings() {
  const { language, setLanguage } = useLanguage();
  const [preferences, setPreferences] = useState<PracticePreferences>({
    level: "Intermediate",
    topic: language.topic,
    goal: DEFAULT_PRACTICE_GOAL,
  });

  useEffect(() => {
    setPreferences(readPracticePreferences(language.code, language.topic));
  }, [language.code, language.topic]);

  const updatePreferences = (next: Partial<PracticePreferences>) => {
    const updated = { ...preferences, ...next };
    setPreferences(updated);
    savePracticePreferences(language.code, updated);
  };

  return (
    <div className="mx-auto max-w-3xl animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both] px-5 py-10 sm:px-8 lg:py-14">
      <Eyebrow>Learning setup</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Settings</h1>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Target language</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {LANGUAGE_ORDER.map((code) => {
            const option = LANGUAGES[code];
            const active = code === language.code;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={active}
                onClick={() => setLanguage(code)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left",
                  active ? "border-accent bg-surface" : "border-border hover:bg-secondary",
                )}
              >
                <span className="text-xl">{option.flag}</span>
                <span className="font-medium">{option.name}</span>
                {active && <span className="ml-auto text-xs font-medium text-accent">Active</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-9 border-t border-border pt-7">
        <h2 className="font-display text-xl font-semibold">{language.name} session defaults</h2>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Proficiency level
            <select
              value={preferences.level}
              onChange={(event) => updatePreferences({ level: event.target.value as LearnerLevel })}
              className="rounded-lg border border-border bg-card px-3 py-2.5 font-normal"
            >
              {LEVELS.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Conversation topic
            <input
              value={preferences.topic}
              maxLength={120}
              onChange={(event) => updatePreferences({ topic: event.target.value })}
              className="rounded-lg border border-border bg-card px-3 py-2.5 font-normal"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Session goal
            <select
              value={preferences.goal}
              onChange={(event) => updatePreferences({ goal: event.target.value })}
              className="rounded-lg border border-border bg-card px-3 py-2.5 font-normal"
            >
              {GOALS.map((goal) => (
                <option key={goal}>{goal}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        Preferences and session history are stored in this browser. Sign-in and cross-device sync
        are not configured.
      </p>
    </div>
  );
}
