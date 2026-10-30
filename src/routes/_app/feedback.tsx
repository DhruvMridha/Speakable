import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge, Card, Eyebrow } from "@/components/lingo/kit";
import { ProgressSummary } from "@/components/lingo/progress-summary";
import {
  getPracticeSession,
  getSessionDuration,
  readPracticeSessions,
  type PracticeSession,
} from "@/lib/sessions";

export const Route = createFileRoute("/_app/feedback")({
  validateSearch: (search: Record<string, unknown>) => ({
    sessionId: typeof search["sessionId"] === "string" ? search["sessionId"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Session results — Speakyy" }] }),
  component: Feedback,
});

function Feedback() {
  const { sessionId } = Route.useSearch();
  const [session, setSession] = useState<PracticeSession>();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  useEffect(() => {
    setSession(getPracticeSession(sessionId));
    setSessions(readPracticeSessions());
  }, [sessionId]);

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <Eyebrow>Session results</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-semibold">No saved session found.</h1>
        <p className="mt-3 text-muted-foreground">
          This session may have been cleared from this browser.
        </p>
        <Link
          to="/practice"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground"
        >
          Start a session
        </Link>
      </div>
    );
  }

  const duration = getSessionDuration(session);
  const durationLabel =
    duration >= 60
      ? `${Math.floor(duration / 60)} min ${String(duration % 60).padStart(2, "0")} sec`
      : `${duration} sec`;
  const completedTurns = session.turns.filter((turn) => turn.role === "tutor").length;
  const review = session.review;

  return (
    <div className="mx-auto max-w-4xl animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both] px-5 py-10 sm:px-8 lg:py-14">
      <Card className="relative overflow-hidden border-primary/10 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        <div
          className="absolute -right-10 -top-12 size-48 rounded-full border-[24px] border-primary-foreground/5"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow className="text-primary-foreground/70">Session complete</Eyebrow>
            <Badge tone="neutral" className="bg-primary-foreground/10 text-primary-foreground">
              {new Date(session.endedAt).toLocaleString()}
            </Badge>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            A great step in your {session.languageName} journey
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/75">
            {session.topic} · {session.level} · {durationLabel} · {completedTurns} completed{" "}
            {completedTurns === 1 ? "turn" : "turns"}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-foreground/85">
            Your conversation has been saved. Review your tutor&apos;s feedback if available, then
            keep building the habit.
          </p>
        </div>
      </Card>

      <ProgressSummary sessions={sessions} featuredSessionId={session.id} />

      {review ? (
        <>
          <Card className="mt-7 bg-surface">
            <Eyebrow>Tutor feedback · based on this conversation</Eyebrow>
            <h2 className="mt-2 font-display text-xl font-semibold">Session summary</h2>
            <p className="mt-3 leading-relaxed">{review.summary}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Next practice:</span>{" "}
              {review.recommendation}
            </p>
          </Card>

          {review.corrections.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold">
                Corrections from this conversation
              </h2>
              <ul className="mt-4 space-y-3">
                {review.corrections.map((correction, index) => (
                  <li
                    key={`${correction.heard}-${index}`}
                    className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        You said
                      </p>
                      <p className="mt-1">{correction.heard}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-accent">Try</p>
                      <p className="mt-1">{correction.suggested}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{correction.explanation}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {review.phrases.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-semibold">Phrases worth keeping</h2>
              <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card px-4">
                {review.phrases.map((item, index) => (
                  <li key={`${item.phrase}-${index}`} className="py-3">
                    <p className="font-medium">{item.phrase}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.meaning}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <Card className="mt-7 border-warn/20 bg-warn-soft/30">
          <Eyebrow>Feedback not available this time</Eyebrow>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {session.reviewError ??
              "There was not enough completed conversation to generate a tutor review."}{" "}
            Your transcript is saved below, and no scores or feedback have been estimated.
          </p>
        </Card>
      )}

      <section id="transcript" className="mt-9 scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <Eyebrow>Saved conversation</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-semibold">Conversation transcript</h2>
          </div>
          <span className="text-sm text-muted-foreground">{session.turns.length} messages</span>
        </div>
        {session.turns.length > 0 ? (
          <ol className="mt-4 space-y-3">
            {session.turns.map((turn) => (
              <li key={turn.id} className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {turn.role === "learner" ? "You" : `Tutor · ${session.languageName}`}
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">{turn.text}</p>
                {turn.role === "tutor" && turn.explanation ? (
                  <p className="mt-2 border-t border-border pt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">In English: </span>
                    {turn.explanation}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 rounded-xl border border-border px-4 py-5 text-sm text-muted-foreground">
            No speech was transcribed in this session.
          </p>
        )}
      </section>

      <div className="mt-9 flex flex-wrap gap-3">
        <Link
          to="/practice"
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          Practise again
        </Link>
        <Link
          to="/history"
          className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
        >
          Session history
        </Link>
        <a
          href="#transcript"
          className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
        >
          Review transcript
        </a>
        <Link
          to="/home"
          className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
