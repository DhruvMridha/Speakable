import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Choice, Eyebrow } from "@/components/lingo/kit";
import { LanguageCard } from "@/components/lingo/language-switcher";
import { LANGUAGE_ORDER, useLanguage } from "@/lib/language";
import { DEFAULT_PRACTICE_GOAL, savePracticePreferences, type LearnerLevel } from "@/lib/sessions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your learner profile — Speakyy" },
      {
        name: "description",
        content:
          "Choose your language, tell Speakyy what you want to improve, your level and what you like talking about.",
      },
      { property: "og:title", content: "Set up your learner profile — Speakyy" },
      {
        property: "og:description",
        content: "Four short questions to personalize your practice sessions.",
      },
    ],
  }),
  component: Onboarding,
});

const steps = [
  {
    eyebrow: "Step 2 of 4",
    q: "What do you want to improve?",
    sub: "Pick as many as you like. You can change this later.",
    options: [
      { label: "Speaking", hint: "Talk longer without freezing" },
      { label: "Vocabulary", hint: "Find the right word faster" },
      { label: "Grammar", hint: "Tenses, articles, prepositions" },
      { label: "Pronunciation", hint: "Be understood the first time" },
      { label: "Confidence", hint: "Speak without overthinking" },
    ],
  },
  {
    eyebrow: "Step 3 of 4",
    q: "What's your current level?",
    sub: "An honest answer makes the first conversation feel right.",
    options: [
      { label: "Beginner", hint: "Short sentences, lots of pauses" },
      { label: "Elementary", hint: "Everyday topics, simple grammar" },
      { label: "Intermediate", hint: "Comfortable, but mistakes slip in" },
      { label: "Advanced", hint: "Fluent — polishing nuance" },
    ],
  },
  {
    eyebrow: "Step 4 of 4",
    q: "What do you like talking about?",
    sub: "Choose topics that make conversation practice interesting for you.",
    options: [
      { label: "Football" },
      { label: "Movies" },
      { label: "Music" },
      { label: "Technology" },
      { label: "Travel" },
      { label: "Gaming" },
    ],
  },
];

const TOTAL = steps.length + 1;
const LEVELS_FROM_ONBOARDING: LearnerLevel[] = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Advanced",
];

function Onboarding() {
  const { language, setLanguage } = useLanguage();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Record<number, string[]>>({
    1: ["Speaking"],
    2: ["Intermediate"],
    3: ["Football"],
  });
  const isLanguageStep = step === 0;
  const current = steps[step - 1];
  const single = step === 2;

  const toggle = (label: string) =>
    setPicked((p) => {
      const list = p[step] ?? [];
      if (single) return { ...p, [step]: [label] };
      return {
        ...p,
        [step]: list.includes(label) ? list.filter((l) => l !== label) : [...list, label],
      };
    });

  const finishOnboarding = () => {
    const level = picked[2]?.[0];
    const goalChoice = picked[1]?.[0];
    const goal =
      {
        Speaking: "Speak more confidently",
        Vocabulary: "Build useful vocabulary",
        Grammar: "Use grammar more accurately",
        Pronunciation: "Improve pronunciation",
        Confidence: "Speak more confidently",
      }[goalChoice ?? ""] ?? DEFAULT_PRACTICE_GOAL;
    savePracticePreferences(language.code, {
      level: LEVELS_FROM_ONBOARDING.includes(level as LearnerLevel)
        ? (level as LearnerLevel)
        : "Intermediate",
      topic: picked[3]?.[0] ?? language.topic,
      goal,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-7">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-primary">
            <span className="block size-2.5 rounded-full bg-accent" />
          </span>
          <span className="font-display text-lg font-semibold">Speakyy</span>
        </Link>
        <span className="text-sm text-muted-foreground">Takes 30 seconds</span>
      </header>

      <div className="mx-auto w-full max-w-2xl px-6">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-500",
                i <= step ? "bg-accent" : "bg-secondary",
              )}
            />
          ))}
        </div>
      </div>

      <main
        key={step}
        className="mx-auto w-full max-w-2xl flex-1 animate-[rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both] px-6 py-12"
      >
        {isLanguageStep ? (
          <>
            <Eyebrow>Step 1 of 4</Eyebrow>
            <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
              What do you want to learn?
            </h1>
            <p className="mt-3 text-muted-foreground">
              Your language shapes every conversation, and each one keeps its own progress and
              memory. You can add more later.
            </p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {LANGUAGE_ORDER.map((code) => (
                <LanguageCard
                  key={code}
                  code={code}
                  selected={language.code === code}
                  onSelect={() => setLanguage(code)}
                />
              ))}
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Speakyy's interface and reports are in English — only the conversation itself is in{" "}
              {language.name}.
            </p>
          </>
        ) : (
          current && (
            <>
              <Eyebrow>{current.eyebrow}</Eyebrow>
              <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">{current.q}</h1>
              <p className="mt-3 text-muted-foreground">{current.sub}</p>

              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {current.options.map((o) => (
                  <Choice
                    key={o.label}
                    label={o.label}
                    {...("hint" in o && o.hint ? { hint: o.hint as string } : {})}
                    selected={(picked[step] ?? []).includes(o.label)}
                    onClick={() => toggle(o.label)}
                  />
                ))}
              </div>
            </>
          )
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-6 py-5">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < TOTAL - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              {isLanguageStep ? `Continue with ${language.name} ${language.flag}` : "Continue"}
            </Button>
          ) : (
            <Link to="/home" className="contents">
              <Button variant="accent" onClick={finishOnboarding}>
                Meet your tutor
              </Button>
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
