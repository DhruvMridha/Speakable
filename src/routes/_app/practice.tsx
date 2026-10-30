import { getTutorResponse, getSessionReview } from "@/lib/llm.functions";
import {
  type ConversationTurn,
  type LearnerLevel,
  type PracticeSession,
  type SessionReview,
  awardSessionXp,
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
      { title: "Practice — Speakable" },
      { name: "description", content: "Practise a real conversation with your language tutor." },
    ],
  }),
  component: Practice,
});

type RecognitionResultEvent = Event & {
  results: {
    length: number;
    [index: number]: { isFinal: boolean; [index: number]: { transcript: string } };
  };
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
const END_OF_TURN_FINAL_MS = 450;
const END_OF_TURN_INTERIM_MS = 750;

function logTutorPerformance(
  requestId: string,
  stage: string,
  elapsedMs?: number,
  details: Record<string, number | string | boolean> = {},
) {
  console.info(
    JSON.stringify({
      component: "tutor-performance",
      layer: "browser",
      requestId,
      stage,
      ...(elapsedMs === undefined ? {} : { elapsedMs: Math.round(elapsedMs) }),
      ...details,
    }),
  );
}

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
  const audioUrlRef = useRef<string | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const latestTutorTextRef = useRef("");
  const failedTranscriptRef = useRef<string | null>(null);
  const turnsRef = useRef<ConversationTurn[]>([]);
  const busyRef = useRef(false);
  const endedRef = useRef(false);
  const mountedRef = useRef(true);
  const recognitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (recognitionTimerRef.current !== null) {
        window.clearTimeout(recognitionTimerRef.current);
      }
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      ttsAbortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
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

  const playLatestReply = async (
    retry = false,
    requestId = crypto.randomUUID(),
    turnSpeechAt = performance.now(),
  ) => {
    if (muted) {
      setStatus("Tutor audio is muted. Turn mute off to listen.");
      return;
    }
    const reply = latestTutorTextRef.current;
    if (!reply) return;

    const ttsStartedAt = performance.now();
    try {
      setError("");
      setStatus(retry ? "Retrying tutor audio…" : "Preparing tutor audio…");
      ttsAbortRef.current?.abort();
      const abortController = new AbortController();
      ttsAbortRef.current = abortController;
      audioRef.current?.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      logTutorPerformance(requestId, "rime-request-start", ttsStartedAt);
      const response = await fetch("/api/tutor-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: reply.slice(0, 1000),
          language: language.code,
          requestId,
        }),
        signal: abortController.signal,
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(
          typeof payload?.error === "string" ? payload.error : "Tutor audio is unavailable.",
        );
      }
      if (!response.body) throw new Error("Tutor audio stream was empty.");
      logTutorPerformance(requestId, "rime-response-headers", performance.now() - ttsStartedAt);

      const audio = new Audio();
      const audioMime = response.headers.get("content-type") ?? "audio/webm;codecs=opus";
      audioRef.current = audio;

      audio.onended = () => {
        if (!mountedRef.current) return;
        setIsSpeaking(false);
        setMascotState("idle");
        setStatus("Your turn. Tap the microphone when you are ready.");
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };
      audio.onerror = () => {
        if (!mountedRef.current) return;
        const mediaError = audio.error;
        logTutorPerformance(requestId, "audio-element-error", performance.now() - ttsStartedAt, {
          mediaErrorCode: mediaError?.code ?? 0,
          mediaErrorMessage: mediaError?.message ?? "No browser media error detail",
          mimeType: audioMime,
        });
        setIsSpeaking(false);
        setMascotState("idle");
        setError(
          mediaError
            ? `Tutor audio could not be decoded (media error ${mediaError.code}). Please retry audio.`
            : "Tutor audio could not be played. Please retry audio.",
        );
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };
      audio.onplaying = () => {
        if (!mountedRef.current) return;
        logTutorPerformance(requestId, "tutor-audio-playing", performance.now() - ttsStartedAt);
        logTutorPerformance(
          requestId,
          "tutor-total-response-latency",
          performance.now() - turnSpeechAt,
          { startBasis: "last-browser-recognition-event; not a microphone VAD timestamp" },
        );
        setIsSpeaking(true);
        setMascotState("speaking");
        setStatus("Listening to your tutor…");
      };

      const audioBlob = await response.blob();
      if (audioBlob.size === 0) throw new Error("Rime returned an empty audio stream.");
      logTutorPerformance(requestId, "audio-buffer-ready", performance.now() - ttsStartedAt, {
        streamingPlayback: false,
        byteLength: audioBlob.size,
        mimeType: audioBlob.type || audioMime,
      });
      const blobUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = blobUrl;
      audio.src = blobUrl;
      await audio.play();
      if (ttsAbortRef.current === abortController) ttsAbortRef.current = null;
    } catch (reason) {
      if (!mountedRef.current) return;
      logTutorPerformance(requestId, "rime-request-failed", performance.now() - ttsStartedAt);
      ttsAbortRef.current?.abort();
      ttsAbortRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      setIsSpeaking(false);
      setMascotState("idle");
      if (reason instanceof Error && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "Tutor audio failed.");
    }
  };

  const handleTranscript = async (
    rawText: string,
    retry = false,
    requestId = crypto.randomUUID(),
    lastSpeechEventAt = performance.now(),
  ) => {
    const text = rawText.trim();
    if (!text) {
      setStatus("No speech was recognized. Please try again.");
      setMascotState("idle");
      return;
    }

    const priorTurns = retry ? turnsRef.current.slice(0, -1) : turnsRef.current;
    if (!retry) addTurn("learner", text);
    busyRef.current = true;
    setIsBusy(true);
    setError("");
    setMascotState("thinking");
    setStatus("Working on your reply…");
    const geminiStartedAt = performance.now();
    try {
      logTutorPerformance(requestId, "gemini-request-start", geminiStartedAt);
      const response = await withTimeout(
        getTutorResponse({
          data: {
            requestId,
            text,
            language: language.code,
            level,
            topic: topic.trim() || language.topic,
            goal,
            history: priorTurns
              .slice(-8)
              .map(({ role, text: turnText }) => ({ role, text: turnText })),
          },
        }),
        27_000,
      );
      logTutorPerformance(
        requestId,
        "gemini-response-complete",
        performance.now() - geminiStartedAt,
      );
      if (!mountedRef.current || endedRef.current) return;
      failedTranscriptRef.current = null;
      latestTutorTextRef.current = response.speech;
      addTurn("tutor", response.speech, response.explanation ?? undefined);
      setStatus("Tutor reply ready.");
      setMascotState("idle");
      await playLatestReply(false, requestId, lastSpeechEventAt);
    } catch (reason) {
      if (!mountedRef.current || endedRef.current) return;
      const message = reason instanceof Error ? reason.message : "Tutor response failed.";
      logTutorPerformance(requestId, "gemini-request-failed", performance.now() - geminiStartedAt);
      failedTranscriptRef.current = text;
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
    recognition.interimResults = true;
    let transcript = "";
    let transcriptIsFinal = false;
    let lastSpeechEventAt = performance.now();
    let submitted = false;
    const requestId = crypto.randomUUID();
    const submitTranscript = () => {
      if (submitted || endedRef.current || !mountedRef.current) return;
      submitted = true;
      if (recognitionTimerRef.current !== null) {
        window.clearTimeout(recognitionTimerRef.current);
        recognitionTimerRef.current = null;
      }
      if (transcript.trim()) {
        const detectedAt = performance.now();
        logTutorPerformance(requestId, "user-speech-stop-estimate", undefined, {
          basis: "last-browser-recognition-event; Web Speech API has no mic VAD timestamp",
        });
        logTutorPerformance(
          requestId,
          "end-of-turn-detection-complete",
          detectedAt - lastSpeechEventAt,
          { transcriptIsFinal },
        );
        logTutorPerformance(requestId, "transcript-finalized", undefined, {
          finalResult: transcriptIsFinal,
          sinceLastRecognitionEventMs: Math.round(detectedAt - lastSpeechEventAt),
        });
        setIsListening(false);
        setStatus("Preparing your reply…");
        void handleTranscript(transcript, false, requestId, lastSpeechEventAt);
      }
    };
    recognition.onstart = () => {
      recognitionRef.current = recognition;
      logTutorPerformance(requestId, "speech-recognition-start");
      setStartedAt((current) => current ?? new Date().toISOString());
      setError("");
      setIsListening(true);
      setMascotState("listening");
      setStatus("Listening… speak naturally.");
    };
    recognition.onresult = (event) => {
      const results = Array.from({ length: event.results.length }, (_, index) => ({
        text: event.results[index]?.[0]?.transcript ?? "",
        isFinal: event.results[index]?.isFinal ?? false,
      }));
      transcript = results
        .map((result) => result.text)
        .join(" ")
        .trim();
      transcriptIsFinal = results.length > 0 && results.every((result) => result.isFinal);
      lastSpeechEventAt = performance.now();
      logTutorPerformance(requestId, "speech-transcript-update", undefined, {
        finalResult: transcriptIsFinal,
        resultCount: results.length,
      });
      if (recognitionTimerRef.current !== null) {
        window.clearTimeout(recognitionTimerRef.current);
      }
      recognitionTimerRef.current = window.setTimeout(
        () => {
          recognitionTimerRef.current = null;
          recognition.stop();
          submitTranscript();
        },
        transcriptIsFinal ? END_OF_TURN_FINAL_MS : END_OF_TURN_INTERIM_MS,
      );
    };
    recognition.onerror = (event) => {
      if (recognitionTimerRef.current !== null) {
        window.clearTimeout(recognitionTimerRef.current);
        recognitionTimerRef.current = null;
      }
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
      submitTranscript();
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
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.src = "";
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
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
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.src = "";
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
    awardSessionXp(session);
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
                ttsAbortRef.current?.abort();
                ttsAbortRef.current = null;
                audioRef.current?.pause();
                if (audioRef.current) audioRef.current.src = "";
                if (audioUrlRef.current) {
                  URL.revokeObjectURL(audioUrlRef.current);
                  audioUrlRef.current = null;
                }
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
            disabled={!isListening && !isSpeaking && !isBusy}
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
          {failedTranscriptRef.current ? (
            <button
              type="button"
              onClick={() => {
                const text = failedTranscriptRef.current;
                if (text) void handleTranscript(text, true);
              }}
              disabled={isBusy}
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              Retry tutor reply
            </button>
          ) : null}
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
