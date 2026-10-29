import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge, Card, Eyebrow } from "@/components/lingo/kit";
import { StreakPill, XpChip } from "@/components/lingo/game";
import { LingoMascot } from "@/components/lingo/lingo-mascot";

export const Route = createFileRoute("/_app/demo")({
  head: () => ({
    meta: [
      { title: "How Speakyy practice could work — demo" },
      {
        name: "description",
        content:
          "A visual walkthrough: conversation → learner memory → personalized lesson → improvement.",
      },
      { property: "og:title", content: "How Speakyy practice could work — demo" },
      {
        property: "og:description",
        content: "Session 1 finds the mistake. Session 2 fixes it on purpose.",
      },
    ],
  }),
  component: Demo,
});

const flow = [
  { t: "Conversation", d: "You speak freely about your weekend." },
  { t: "Learner memory", d: "Recurring mistakes and interests are stored." },
  { t: "Personalized lesson", d: "The next conversation targets your weak spot." },
  { t: "Review", d: "Use evidence-based feedback to plan another practice session." },
];

function Demo() {
  return (
    <div className="mx-auto max-w-5xl animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both] px-5 py-10 sm:px-8 lg:py-14">
      <Eyebrow>Illustrative demo · example content, not saved learner activity</Eyebrow>
      <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
        How a learning loop could work.
      </h1>

      <div className="mt-9 grid gap-4 rounded-[2rem] border border-border bg-surface p-6 sm:p-8 lg:grid-cols-3">
        <div className="flex items-start gap-4">
          <LingoMascot state="confused" className="size-20 shrink-0" />
          <div>
            <p className="font-display text-lg font-semibold">“Almost!”</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You: “Yesterday I <span className="text-warn">go</span> to college.” Lingo: “Try
              ‘Yesterday I went to college.’”
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <LingoMascot state="correct" className="size-20 shrink-0" />
          <div>
            <p className="font-display text-lg font-semibold">“That's it!”</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You: “Yesterday I <span className="text-accent">went</span> to college.”
            </p>
            <XpChip
              amount={10}
              className="mt-3 animate-[xp-pop_0.6s_cubic-bezier(0.22,1,0.36,1)_both]"
            />
          </div>
        </div>
        <div className="flex items-start gap-4">
          <LingoMascot state="celebrating" className="size-20 shrink-0" />
          <div className="flex flex-wrap items-center gap-2">
            <StreakPill days={7} />
            <Badge tone="accent">Past tense improved</Badge>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="relative">
          <Badge>Session 1 · Monday</Badge>
          <p className="mt-6 text-sm text-muted-foreground">Student</p>
          <p className="mt-1 font-display text-2xl leading-snug">
            “Yesterday I <span className="text-warn">go</span> to college.”
          </p>
          <div className="mt-7 rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Lingo identifies
            </p>
            <p className="mt-2 font-display text-lg">Past tense</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Saved to your learner memory — not corrected mid-conversation.
            </p>
          </div>
        </Card>

        <Card className="relative bg-primary text-primary-foreground">
          <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            Session 2 · Thursday
          </span>
          <p className="mt-6 text-sm opacity-60">Lingo</p>
          <p className="mt-1 font-display text-2xl leading-snug">
            “Let's practice something you've struggled with before — tell me about your weekend.”
          </p>
          <div className="mt-7 rounded-2xl bg-primary-foreground/10 p-5">
            <p className="text-xs uppercase tracking-wider opacity-60">Result</p>
            <p className="mt-2 font-display text-lg">
              “Yesterday I <span className="text-accent">went</span> to college.”
            </p>
            <p className="mt-1 text-sm opacity-70">Past tense accuracy 61% → 84%</p>
          </div>
        </Card>
      </div>

      <div className="mt-10 rounded-[2rem] border border-border bg-surface p-7 sm:p-9">
        <Eyebrow>How it works</Eyebrow>
        <ol className="mt-7 grid gap-4 lg:grid-cols-4">
          {flow.map((f, i) => (
            <li key={f.t} className="relative rounded-2xl border border-border bg-card p-5">
              <span className="font-display text-sm text-accent">0{i + 1}</span>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
              {i < flow.length - 1 && (
                <span className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2 text-muted-foreground lg:-right-4 lg:bottom-auto lg:left-auto lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5 rotate-90 lg:rotate-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          This walkthrough uses fictional examples to show a possible product flow. Speakyy does not
          yet retain long-term learner memory or calculate improvement between sessions.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/practice"
          className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-medium text-accent-foreground"
        >
          Try practice
        </Link>
        <Link
          to="/memory"
          className="inline-flex h-12 items-center rounded-full border border-border-strong px-7 text-sm font-medium"
        >
          Show the memory screen
        </Link>
      </div>
    </div>
  );
}
