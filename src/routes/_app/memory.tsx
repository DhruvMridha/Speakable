import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Eyebrow } from "@/components/lingo/kit";
import { LanguageTabs } from "@/components/lingo/language-switcher";
import { useLanguage } from "@/lib/language";
import { readPracticeSessions, type PracticeSession } from "@/lib/sessions";

export const Route = createFileRoute("/_app/memory")({
  head: () => ({ meta: [{ title: "Learning notes — Speakable" }] }),
  component: Memory,
});

function Memory() {
  const { language } = useLanguage();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  useEffect(() => setSessions(readPracticeSessions()), []);
  const languageSessions = useMemo(
    () => sessions.filter((session) => session.language === language.code),
    [sessions, language.code],
  );
  const corrections = languageSessions.flatMap((session) => session.review?.corrections ?? []);
  const phrases = languageSessions.flatMap((session) => session.review?.phrases ?? []);
  const topics = [...new Set(languageSessions.map((session) => session.topic))];

  return (
    <div className="mx-auto max-w-5xl animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both] px-5 py-10 sm:px-8 lg:py-14">
      <Eyebrow>Learning notes · saved on this device</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
        What your {language.name} sessions recorded
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        These notes come from completed conversations and their AI reviews. Speakable does not infer
        long-term strengths or recurring patterns yet.
      </p>
      <LanguageTabs className="mt-6" />

      {languageSessions.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border px-5 py-8">
          <h2 className="font-display text-lg font-semibold">No session notes yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete a conversation with {language.name} feedback to build notes here.
          </p>
          <Link
            to="/practice"
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
          >
            Start practising
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="font-display text-xl font-semibold">Corrections from your sessions</h2>
            {corrections.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {corrections.map((item, index) => (
                  <li
                    key={`${item.heard}-${index}`}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      You said
                    </p>
                    <p className="mt-1">{item.heard}</p>
                    <p className="mt-3 text-xs font-semibold uppercase text-accent">Suggested</p>
                    <p className="mt-1">{item.suggested}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.explanation}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No corrections were recorded in reviewed sessions.
              </p>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">Phrases from your sessions</h2>
            {phrases.length > 0 ? (
              <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card px-4">
                {phrases.map((item, index) => (
                  <li key={`${item.phrase}-${index}`} className="py-3">
                    <p className="font-medium">{item.phrase}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.meaning}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No phrases were recorded in reviewed sessions.
              </p>
            )}

            <h2 className="mt-8 font-display text-xl font-semibold">Topics practised</h2>
            {topics.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <li key={topic} className="rounded-full border border-border px-3 py-1.5 text-sm">
                    {topic}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No topics recorded.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
