import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eyebrow } from "@/components/lingo/kit";
import { getSessionDuration, readPracticeSessions, type PracticeSession } from "@/lib/sessions";

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "Session history — Speakyy" }] }),
  component: History,
});

function History() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  useEffect(() => setSessions(readPracticeSessions()), []);

  const totalSeconds = sessions.reduce((sum, session) => sum + getSessionDuration(session), 0);
  const minutes = Math.floor(totalSeconds / 60);

  return (
    <div className="mx-auto max-w-4xl animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both] px-5 py-10 sm:px-8 lg:py-14">
      <Eyebrow>Saved on this device</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Your conversations</h1>
      <p className="mt-3 text-muted-foreground">
        {sessions.length} saved {sessions.length === 1 ? "session" : "sessions"} · {minutes} min
        recorded. Sessions are stored in this browser, not synced to an account.
      </p>

      {sessions.length > 0 ? (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {sessions.map((session) => {
            const duration = getSessionDuration(session);
            const date = new Date(session.endedAt);
            return (
              <li
                key={session.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-medium">{session.topic}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {session.languageName} · {date.toLocaleDateString()} ·{" "}
                    {Math.floor(duration / 60)} min {duration % 60} sec ·{" "}
                    {session.turns.filter((turn) => turn.role === "tutor").length} completed turns
                  </p>
                </div>
                <Link
                  to="/feedback"
                  search={{ sessionId: session.id }}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                >
                  Review
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-border px-5 py-8">
          <h2 className="font-display text-lg font-semibold">No saved sessions yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Finish a practice conversation to see its transcript and feedback here.
          </p>
          <Link
            to="/practice"
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
          >
            Start practising
          </Link>
        </div>
      )}
    </div>
  );
}
