import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LingoMascot } from "@/components/lingo/lingo-mascot";
import { LanguageSwitcher } from "@/components/lingo/language-switcher";
import { Card, Eyebrow } from "@/components/lingo/kit";
import { useLanguage } from "@/lib/language";
import { getSessionDuration, readPracticeSessions, type PracticeSession } from "@/lib/sessions";

export const Route = createFileRoute("/_app/home")({
  head: () => ({ meta: [{ title: "Home — Speakyy" }] }),
  component: Home,
});

function Home() {
  const { language } = useLanguage();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  useEffect(() => setSessions(readPracticeSessions()), []);

  const languageSessions = useMemo(
    () => sessions.filter((session) => session.language === language.code),
    [sessions, language.code],
  );
  const totalSeconds = languageSessions.reduce(
    (total, session) => total + getSessionDuration(session),
    0,
  );
  const tutorTurns = languageSessions.reduce(
    (total, session) => total + session.turns.filter((turn) => turn.role === "tutor").length,
    0,
  );
  const latest = languageSessions[0];

  return (
    <div className="mx-auto max-w-5xl animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both] px-5 py-10 sm:px-8 lg:py-14">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Eyebrow>Your practice space</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Ready to speak?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Practising {language.name} {language.flag}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/settings"
            aria-label="Settings"
            className="grid size-10 place-items-center rounded-full border border-border bg-card text-sm font-medium"
          >
            S
          </Link>
        </div>
      </header>

      <Link
        to="/practice"
        className="group mt-7 flex flex-col gap-6 rounded-2xl bg-primary p-6 text-primary-foreground transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
            {language.name} conversation
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
            Start a practice session
          </h2>
          <p className="mt-2 max-w-lg text-sm opacity-75">
            Choose your level, topic, and learning goal before speaking with your tutor.
          </p>
          <span className="mt-5 inline-flex rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-medium text-primary">
            Start speaking
          </span>
        </div>
        <LingoMascot state="encouraging" className="size-32 shrink-0 sm:size-40" />
      </Link>

      <section className="mt-7" aria-label="Recorded practice totals">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Your recorded practice</h2>
          <span className="text-xs text-muted-foreground">Saved in this browser</span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric label="Sessions" value={String(languageSessions.length)} />
          <Metric label="Tutor replies" value={String(tutorTurns)} />
          <Metric label="Speaking time" value={`${Math.floor(totalSeconds / 60)} min`} />
        </div>
      </section>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Eyebrow>Recent session</Eyebrow>
            {latest ? (
              <>
                <h2 className="mt-2 font-display text-lg font-semibold">{latest.topic}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(latest.endedAt).toLocaleDateString()} ·{" "}
                  {Math.floor(getSessionDuration(latest) / 60)} min ·{" "}
                  {latest.turns.filter((turn) => turn.role === "tutor").length} completed turns
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Your completed sessions will appear here.
              </p>
            )}
          </div>
          {latest ? (
            <Link
              to="/feedback"
              search={{ sessionId: latest.id }}
              className="text-sm font-medium text-accent"
            >
              Review session
            </Link>
          ) : null}
        </div>
        <Link to="/history" className="mt-5 inline-flex text-sm font-medium text-accent">
          View session history →
        </Link>
      </Card>
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
