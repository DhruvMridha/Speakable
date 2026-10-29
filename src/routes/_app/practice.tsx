import { getTutorResponse, getSessionReview } from "@/lib/llm.functions";
import { getRimeVoiceTestAudio } from "@/lib/rime.functions";
import {
  type ConversationTurn,
  type LearnerLevel,
  type PracticeSession,
  type SessionReview,
  readPracticePreferences,
  savePracticePreferences,
  savePracticeSession,
} from "@/lib/sessions";
import { LANGUAGES, LANGUAGE_ORDER, useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";
import { LingoMascot, MascotWave, type MascotState } from "@/components/lingo/lingo-mascot";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mic, MicOff, RotateCcw, Volume2, VolumeX, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/_app/practice")({
  head: () => ({
    meta: [
      { title: "Practice — Speakyy" },
      { name: "description", content: "Practise a real conversation with your language tutor." },
    ],
  }),
  component: Practice,
});

type RecognitionResultEvent = Event & {
  results: { length: number; [index: number]: { [index: number]: { transcript: string } } };
};

type RecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionWindow = Window & {
  SpeechRecognition?: new () => RecognitionInstance;
  webkitSpeechRecognition?: new () => RecognitionInstance;
};

const LEVELS: LearnerLevel[] = ["Beginner", "Elementary", "Intermediate", "Advanced"];
const GOALS = [
  "Speak more confidently",
  "Build useful vocabulary",
  "Use grammar more accurately",
  "Improve pronunciation",
];

function Practice() {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [level, setLevel] = useState<LearnerLevel>("Intermediate");
  const [topic, setTopic] = useState(language.topic);
  const [goal, setGoal] = useState(GOALS[0]!);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState("Ready when you are. Tap the microphone to begin.");
  const [error, setError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const latestAudioRef = useRef<{ audioBase64: string; contentType: string } | null>(null);
  const latestTutorTextRef = useRef("");
  const turnsRef = useRef<ConversationTurn[]>([]);
  const busyRef = useRef(false);
  const endedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!startedAt) return;
    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000)));
    };
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  useEffect(() => {
    const preferences = readPracticePreferences(language.code, language.topic);
    setLevel(preferences.level);
    setTopic(preferences.topic);
    setGoal(preferences.goal);
  }, [language.code, language.topic]);

  const updatePreferences = (
    next: Partial<{ level: LearnerLevel; topic: string; goal: string }>,
  ) => {
    const preferences = {
      level: next.level ?? level,
      topic: next.topic ?? topic,
      goal: next.goal ?? goal,
    };
    if (next.level) setLevel(next.level);
    if (next.topic !== undefined) setTopic(next.topic);
    if (next.goal) setGoal(next.goal);
    savePracticePreferences(language.code, preferences);
  };

  const addTurn = (role: ConversationTurn["role"], text: string, explanation?: string) => {
    const turn = {
      id: crypto.randomUUID(),
      role,
      text,
      ...(explanation ? { explanation } : {}),
      createdAt: new Date().toISOString(),
    };
    const next = [...turnsRef.current, turn];
    turnsRef.current = next;
    setTurns(next);
  };

  const playLatestReply = async (retry = false) => {
    if (muted) {
      setStatus("Tutor audio is muted. Turn mute off to listen.");
      return;
    }
    const reply = latestTutorTextRef.current;
    if (!reply) return;

    try {
      setError("");
      setStatus(retry ? "Retrying tutor audio…" : "Preparing tutor audio…");
      let audioData = latestAudioRef.current;
      if (retry || !audioData) {
        const result = await getRimeVoiceTestAudio({
          data: { text: reply.slice(0, 1000), language: language.code },
        });
        audioData = result;
        latestAudioRef.current = result;
      }
      if (!audioData) throw new Error("Tutor audio is not available yet.");
      const audio = new Audio(`data:${audioData.contentType};base64,${audioData.audioBase64}`);
      audioRef.current?.pause();
      audioRef.current = audio;
      audio.onended = () => {
        if (!mountedRef.current) return;
        setIsSpeaking(false);
        setMascotState("idle");
        setStatus("Your turn. Tap the microphone when you are ready.");
      };
      audio.onerror = () => {
        if (!mountedRef.current) return;
        setIsSpeaking(false);
        setMascotState("idle");
        setError("Audio could not be played. Check your connection, then retry.");
      };
      await audio.play();
      setIsSpeaking(true);
      setMascotState("speaking");
      setStatus("Listening to your tutor…");
    } catch (reason) {
      if (!mountedRef.current) return;
      setIsSpeaking(false);
      setMascotState("idle");
      setError(reason instanceof Error ? reason.message : "Tutor audio failed.");
    }
  };

  const handleTranscript = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) {
      setStatus("No speech was recognized. Please try again.");
      setMascotState("idle");
      return;
    }

    const priorTurns = turnsRef.current;
    addTurn("learner", text);
    busyRef.current = true;
    setIsBusy(true);
    setError("");
    setMascotState("thinking");
    setStatus("Working on your reply…");
    try {
      const response = await withTimeout(
        getTutorResponse({
          data: {
            text,
            language: language.code,
            level,
            topic: topic.trim() || language.topic,
            goal,
            history: priorTurns
              .slice(-20)
              .map(({ role, text: turnText }) => ({ role, text: turnText })),
          },
        }),
        45_000,
      );
      if (!mountedRef.current || endedRef.current) return;
      latestTutorTextRef.current = response.speech;
      latestAudioRef.current = null;
      addTurn("tutor", response.speech, response.explanation ?? undefined);
      setStatus("Tutor reply ready.");
      setMascotState("idle");
      await playLatestReply();
    } catch (reason) {
      if (!mountedRef.current || endedRef.current) return;
      const message = reason instanceof Error ? reason.message : "Tutor response failed.";
      setError(message.includes("timed out") ? message : `Could not get a tutor reply: ${message}`);
      setStatus("Your transcript is saved in this session. Try again when ready.");
      setMascotState("confused");
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setIsBusy(false);
    }
  };

  const toggleMicrophone = () => {
    if (busyRef.current || endedRef.current) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setMascotState("idle");
      setStatus("Listening stopped.");
      return;
    }
    if (recognitionRef.current) return;

    if (isSpeaking) stopAudio();
    const browserWindow = window as RecognitionWindow;
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError(
        "Speech recognition is not supported in this browser. Try a current version of Chrome.",
      );
      return;
    }

    const recognition = new Recognition();
    recognition.lang = { en: "en-US", es: "es-ES", fr: "fr-FR", hi: "hi-IN" }[language.code];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      recognitionRef.current = recognition;
      setStartedAt((current) => current ?? new Date().toISOString());
      setError("");
      setIsListening(true);
      setMascotState("listening");
      setStatus("Listening… speak naturally.");
    };
    recognition.onresult = (event) => {
      const spoken = Array.from(
        { length: event.results.length },
        (_, index) => event.results[index]?.[0]?.transcript ?? "",
      )
        .join(" ")
        .trim();
      setIsListening(false);
      void handleTranscript(spoken);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      setMascotState("idle");
      const messages: Record<string, string> = {
        "not-allowed":
          "Microphone permission was denied. Allow microphone access in your browser settings.",
        "service-not-allowed": "Speech recognition is blocked by this browser or device.",
        "audio-capture": "No microphone was found. Connect a microphone and try again.",
        network: "Speech recognition needs a network connection. Check your connection and retry.",
        "no-speech": "No speech was recognized. Try speaking a little closer to the microphone.",
      };
      setError(
        messages[event.error] ?? `Speech recognition failed (${event.error}). Please try again.`,
      );
      setStatus("Microphone stopped.");
    };
    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    try {
      recognition.start();
    } catch {
      setError("The microphone could not start. Wait a moment and try again.");
    }
  };

  const stopAudio = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    audioRef.current?.pause();
    setIsListening(false);
    setIsSpeaking(false);
    setMascotState("idle");
    setStatus("Stopped.");
  };

  const endSession = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    audioRef.current?.pause();
    setIsListening(false);
    setIsSpeaking(false);
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const transcript = turnsRef.current;
    const session: PracticeSession = {
      id: sessionId,
      language: language.code,
      languageName: language.name,
      level,
      topic: topic.trim() || language.topic,
      goal,
      startedAt: startedAt ?? now,
      endedAt: now,
      turns: transcript,
      review: null,
      reviewError: null,
    };

    if (
      transcript.some((turn) => turn.role === "learner") &&
      transcript.some((turn) => turn.role === "tutor")
    ) {
      try {
        const review = (await withTimeout(
          getSessionReview({
            data: {
              language: language.code,
              level,
              topic: session.topic,
              goal,
              turns: transcript.slice(-40).map(({ role, text }) => ({ role, text })),
            },
          }),
          30_000,
        )) as SessionReview;
        session.review = review;
      } catch {
        session.reviewError = "AI feedback was unavailable. The actual transcript is still saved.";
      }
    }

    if (!savePracticeSession(session)) {
      endedRef.current = false;
      setError(
        "This browser could not save the session. Free some browser storage and try ending the session again.",
      );
      setStatus("Session results were not saved.");
      return;
    }
    await navigate({ to: "/feedback", search: { sessionId } });
  };

  const elapsed = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;
  const visualState = isListening ? "listening" : mascotState;

  return (
    <div className="relative flex min-h-[calc(100vh-61px)] flex-col lg:min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              isListening || isSpeaking ? "bg-accent" : "bg-border-strong",
            )}
          />
          <select
            aria-label="Practice language"
            value={language.code}
            disabled={startedAt !== null}
            onChange={(event) => setLanguage(event.target.value as typeof language.code)}
            className="max-w-[13rem] rounded-lg border border-border bg-card px-3 py-2 text-sm disabled:opacity-70"
          >
            {LANGUAGE_ORDER.map((code) => (
              <option key={code} value={code}>
                {LANGUAGES[code].name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 font-display text-sm tabular-nums text-muted-foreground">
          {language.flag} {language.name} · {elapsed}
        </div>
      </header>

      <section
        aria-label="Session settings"
        className="mx-auto grid w-full max-w-3xl gap-3 px-5 sm:grid-cols-3 sm:px-8"
      >
        <label className="grid gap-1 text-xs text-muted-foreground">
          Proficiency
          <select
            value={level}
            onChange={(event) => updatePreferences({ level: event.target.value as LearnerLevel })}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground"
          >
            {LEVELS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Topic
          <input
            value={topic}
            onChange={(event) => updatePreferences({ topic: event.target.value })}
            maxLength={120}
            className="min-w-0 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground"
          />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Session goal
          <select
            value={goal}
            onChange={(event) => updatePreferences({ goal: event.target.value })}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground"
          >
            {GOALS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      <main className="flex flex-1 flex-col items-center px-6 py-8">
        <button
          type="button"
          onClick={toggleMicrophone}
          disabled={isBusy}
          aria-label={isListening ? "Stop listening" : "Start speaking"}
          className="relative grid place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 disabled:cursor-wait"
        >
          {isListening && (
            <span
              className="absolute size-56 rounded-full bg-accent/16 sm:size-64"
              style={{ animation: "ring-out 2.6s ease-out infinite" }}
            />
          )}
          <LingoMascot state={visualState} className="relative size-56 sm:size-64 lg:size-72" />
        </button>
        <MascotWave state={visualState} className="mt-2" />
        <div role="status" aria-live="polite" className="mt-5 max-w-xl text-center">
          <h1 className="font-display text-xl font-semibold">
            {isListening
              ? "I'm listening…"
              : isBusy
                ? "Thinking…"
                : isSpeaking
                  ? "Your tutor is speaking…"
                  : "Your conversation"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{status}</p>
          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={toggleMicrophone}
            disabled={isBusy}
            aria-label={isListening ? "Stop listening" : "Microphone"}
            title={isListening ? "Stop listening" : "Start speaking"}
            className="grid size-11 place-items-center rounded-full bg-accent text-accent-foreground disabled:opacity-50"
          >
            {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setMuted((value) => !value);
              if (!muted) {
                audioRef.current?.pause();
                setIsSpeaking(false);
                setMascotState("idle");
                setStatus("Tutor audio muted.");
              }
            }}
            aria-label={muted ? "Unmute tutor" : "Mute tutor"}
            title={muted ? "Unmute tutor" : "Mute tutor"}
            className="grid size-11 place-items-center rounded-full border border-border bg-card"
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <button
            type="button"
            onClick={() => void playLatestReply()}
            disabled={!latestTutorTextRef.current || isBusy}
            aria-label="Replay tutor"
            title="Replay tutor"
            className="grid size-11 place-items-center rounded-full border border-border bg-card disabled:opacity-40"
          >
            <RotateCcw className="size-5" />
          </button>
          <button
            type="button"
            onClick={stopAudio}
            disabled={!isListening && !isSpeaking}
            aria-label="Stop audio or listening"
            title="Stop"
            className="grid size-11 place-items-center rounded-full border border-border bg-card disabled:opacity-40"
          >
            <Square className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => void playLatestReply(true)}
            disabled={!latestTutorTextRef.current || isBusy}
            className="rounded-full border border-border bg-card px-4 py-2.5 text-sm disabled:opacity-40"
          >
            Retry audio
          </button>
          <button
            type="button"
            onClick={() => void endSession()}
            className="rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground"
          >
            End session
          </button>
        </div>

        <ol aria-label="Conversation transcript" className="mt-9 w-full max-w-2xl space-y-3">
          {turns.map((turn) => (
            <li
              key={turn.id}
              className={cn(
                "rounded-xl border border-border px-4 py-3",
                turn.role === "tutor" ? "bg-surface" : "bg-card",
              )}
            >
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {turn.role === "learner" ? "You" : "Tutor"}
                {turn.role === "tutor" ? ` · ${language.name}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{turn.text}</p>
              {turn.role === "tutor" && turn.explanation ? (
                <p className="mt-2 border-t border-border pt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">In English: </span>
                  {turn.explanation}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timeoutId: number;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error("The request timed out. Please try again.")),
      milliseconds,
    );
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}
