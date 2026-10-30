import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Eyebrow } from "@/components/lingo/kit";
import { ProgressSummary } from "@/components/lingo/progress-summary";
import { LanguageTabs } from "@/components/lingo/language-switcher";
import { useLanguage } from "@/lib/language";
import { getSessionDuration, readPracticeSessions, type PracticeSession } from "@/lib/sessions";

export const Route = createFileRoute("/_app/progress")({
  head: () => ({ meta: [{ title: "Progress — Speakable" }] }),
  component: Progress,
});

function Progress() {
  const { language } = useLanguage();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  useEffect(() => setSessions(readPracticeSessions()), []);

  const languageSessions = useMemo(
    () => sessions.filter((session) => session.language === language.code),
    [sessions, language.code],
  );
  const seconds = languageSessions.reduce(
    (total, session) => total + getSessionDuration(session),
    0,
  );
  const turns = languageSessions.reduce(
    (total, session) => total + session.turns.filter((turn) => turn.role === "tutor").length,
    0,
  );
  const corrections = languageSessions.flatMap((session) => session.review?.corrections ?? []);
  const phrases = languageSessions.flatMap((session) => session.review?.phrases ?? []);

  return (
    <div className="mx-auto max-w-5xl animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both] px-5 py-10 sm:px-8 lg:py-14">
      <Eyebrow>Recorded practice · this device only</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
        {language.name} practice
      </h1>
      <p className="mt-3 text-muted-foreground">
        Your XP, daily goal, streak, and achievements are based on saved practice on this device.
        Tutor feedback is shown only when it was actually generated for a session.
      </p>
      <LanguageTabs className="mt-6" />

      <ProgressSummary sessions={sessions} />

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <Metric label="Saved sessions" value={String(languageSessions.length)} />
        <Metric label="Completed tutor turns" value={String(turns)} />
        <Metric label="Recorded speaking time" value={`${Math.floor(seconds / 60)} min`} />
      </div>

      {languageSessions.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border px-5 py-8">
          <h2 className="font-display text-lg font-semibold">
            No {language.name} practice saved yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start a session and finish it to build a record of your practice here.
          </p>
          <Link
            to="/practice"
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
          >
            Start practising
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section>
            <h2 className="font-display text-xl font-semibold">Feedback recorded</h2>
            {corrections.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {corrections.slice(0, 10).map((correction, index) => (
                  <li
                    key={`${correction.heard}-${index}`}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Heard</p>
                    <p className="mt-1">{correction.heard}</p>
                    <p className="mt-2 text-sm text-accent">{correction.suggested}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{correction.explanation}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No corrections were recorded in these sessions.
              </p>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Phrases collected</h2>
            {phrases.length > 0 ? (
              <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card px-4">
                {phrases.slice(0, 15).map((phrase, index) => (
                  <li key={`${phrase.phrase}-${index}`} className="py-3">
                    <p className="font-medium">{phrase.phrase}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{phrase.meaning}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No phrases have been recorded yet.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
