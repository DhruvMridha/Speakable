import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge, buttonClass, Eyebrow } from "@/components/lingo/kit";
import { VoiceOrb } from "@/components/lingo/voice-orb";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Speakable — Learn to speak any language, not just memorize it" },
      {
        name: "description",
        content:
          "Practise spoken English, Spanish, French or Hindi with a voice tutor, useful corrections, and session notes saved on your device.",
      },
      {
        property: "og:title",
        content: "Speakable — Learn to speak any language, not just memorize it",
      },
      {
        property: "og:description",
        content:
          "Practise spoken English, Spanish, French or Hindi with a voice tutor, useful corrections, and session notes saved on your device.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-primary">
            <span className="block size-2.5 rounded-full bg-accent" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Speakable</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/demo" className={buttonClass("ghost", "sm") + " hidden sm:inline-flex"}>
            See how it works
          </Link>
          <Link to="/onboarding" className={buttonClass("primary", "sm")}>
            Start speaking
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-16">
        <div className="animate-[rise_0.6s_cubic-bezier(0.22,1,0.36,1)_both]">
          <Badge tone="accent">Voice-first AI tutor</Badge>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["English", "🇬🇧"],
              ["Spanish", "🇪🇸"],
              ["French", "🇫🇷"],
              ["Hindi", "🇮🇳"],
            ].map(([n, f]) => (
              <span
                key={n}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium"
              >
                <span className="text-sm leading-none">{f}</span>
                {n}
              </span>
            ))}
          </div>
          <h1 className="mt-6 font-display text-[2.75rem] leading-[1.03] font-semibold text-balance-tight sm:text-6xl lg:text-[4.25rem]">
            Learn to speak.
            <br />
            <span className="text-muted-foreground">Not just to memorize.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            Practise real conversations in English, Spanish, French or Hindi with an AI tutor that
            responds to what you say and helps you keep learning.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/onboarding" className={buttonClass("primary", "lg")}>
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
              </svg>
              Start speaking
            </Link>
            <Link to="/demo" className={buttonClass("outline", "lg")}>
              See how it works
            </Link>
          </div>

          <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
            {[
              ["Practises", "through conversation"],
              ["Responds", "in your target language"],
              ["Keeps", "your session notes"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-display text-base font-semibold">{k}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="relative mx-auto flex max-w-md flex-col items-center rounded-[2.5rem] border border-border bg-surface px-8 py-14">
            <Eyebrow>Example tutor reply</Eyebrow>
            <div className="mt-10">
              <VoiceOrb state="speaking" />
            </div>
            <p className="mt-10 font-display text-lg">Lingo is speaking…</p>
            <p className="mt-2 max-w-xs text-center text-sm text-muted-foreground">
              “What do you enjoy most about travelling?”
            </p>

            <div className="mt-10 w-full rounded-2xl border border-border bg-card p-4">
              <Eyebrow>Example session setup</Eyebrow>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Spanish", "Travel", "Intermediate", "Speaking"].map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:grid-cols-3">
          {[
            {
              t: "Four languages, one tutor",
              d: "English, Spanish, French or Hindi — each with its own progress and memory.",
            },
            {
              t: "Useful session feedback",
              d: "Review corrections and phrases supported by the actual conversation transcript.",
            },
            {
              t: "Feedback that encourages",
              d: "Gentle corrections after the conversation — never mid-sentence, never an exam.",
            },
          ].map((f, i) => (
            <div key={f.t}>
              <span className="font-display text-sm text-accent">0{i + 1}</span>
              <h3 className="mt-3 text-xl font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Speakable — voice practice and session feedback in every supported language.</span>
        <Link to="/home" className="hover:text-foreground">
          Enter the product →
        </Link>
      </footer>
    </div>
  );
}
