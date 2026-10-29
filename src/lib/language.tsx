/**
 * Learner language profile — frontend prototype only (no backend yet).
 *
 * Conceptual data model this UI is shaped around:
 *
 *   learner_profile: { user_id, active_language, languages: LanguageCode[] }
 *   memory_entry:    { user_id, language, memory_type, concept, timestamp }
 *
 * Every progress / memory / practice surface reads from the ACTIVE language,
 * and each language keeps its own history — switching never discards anything.
 *
 * Interface copy is always English. Target-language text only ever appears as
 * quoted example utterances, always with an English gloss.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import englishImg from "@/assets/lang-english.jpg";
import spanishImg from "@/assets/lang-spanish.jpg";
import frenchImg from "@/assets/lang-french.jpg";
import hindiImg from "@/assets/lang-hindi.jpg";

export type LanguageCode = "en" | "es" | "fr" | "hi";

export type MemoryType = "strength" | "mistake" | "interest" | "pattern";

export type MemoryEntry = {
  memory_type: MemoryType;
  concept: string;
  detail: string;
  timestamp: string;
  count?: number;
};

export type LanguageProfile = {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  image: string;
  learners: string;
  /** Mascot greeting in the target language + English gloss. */
  greeting: { native: string; gloss: string };
  bubbles: {
    idle: { native: string; gloss: string };
    listening: { native: string; gloss: string };
    speaking: { native: string; gloss: string };
  };
  topic: string;
  focus: string;
  /** A real learner slip and its correction, in the target language. */
  mistake: { said: string; fixed: string; gloss: string };
  transcript: { who: "Lingo" | "You"; text: string; gloss?: string }[];
  stats: {
    level: number;
    xp: number;
    next: number;
    streak: number;
    conversations: number;
    minutes: string;
    confidence: number;
    vocabulary: number;
    grammar: number;
    trend: number[];
  };
  memory: MemoryEntry[];
  lastSession: { topic: string; when: string };
};

export const LANGUAGES: Record<LanguageCode, LanguageProfile> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    region: "United Kingdom",
    image: englishImg,
    learners: "1.2M learners",
    greeting: { native: "Ready for today's conversation?", gloss: "" },
    bubbles: {
      idle: { native: "Ready for today's conversation?", gloss: "" },
      listening: { native: "Go on, I'm all ears.", gloss: "" },
      speaking: { native: "Tell me about your weekend.", gloss: "" },
    },
    topic: "Talking about football",
    focus: "Past tense",
    mistake: {
      said: "Yesterday I go to college.",
      fixed: "Yesterday I went to college.",
      gloss: "",
    },
    transcript: [
      { who: "Lingo", text: "Tell me about your weekend." },
      { who: "You", text: "I went to the stadium with my friends…" },
    ],
    stats: {
      level: 12,
      xp: 2480,
      next: 3000,
      streak: 7,
      conversations: 32,
      minutes: "3 h 41 m",
      confidence: 79,
      vocabulary: 68,
      grammar: 57,
      trend: [62, 65, 63, 70, 72, 74, 79],
    },
    memory: [
      {
        memory_type: "strength",
        concept: "Conversational confidence",
        detail: "You keep talking even when unsure.",
        timestamp: "2 days ago",
      },
      {
        memory_type: "strength",
        concept: "Vocabulary range",
        detail: "Topic words come easily in football and tech.",
        timestamp: "4 days ago",
      },
      {
        memory_type: "mistake",
        concept: "Past tense",
        detail: "“I go” instead of “I went”.",
        timestamp: "today",
        count: 5,
      },
      {
        memory_type: "mistake",
        concept: "Articles",
        detail: "Dropping “the” before nouns.",
        timestamp: "yesterday",
        count: 3,
      },
      {
        memory_type: "mistake",
        concept: "Prepositions",
        detail: "“in Monday” instead of “on Monday”.",
        timestamp: "3 days ago",
        count: 2,
      },
      {
        memory_type: "interest",
        concept: "Football",
        detail: "Most conversations start here.",
        timestamp: "ongoing",
      },
      {
        memory_type: "interest",
        concept: "Technology",
        detail: "You enjoy explaining how things work.",
        timestamp: "ongoing",
      },
      {
        memory_type: "pattern",
        concept: "Evening learner",
        detail: "You speak best after 8 PM.",
        timestamp: "this week",
      },
    ],
    lastSession: { topic: "Talking about football", when: "2 days ago" },
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    region: "Spain & Latin America",
    image: spanishImg,
    learners: "890k learners",
    greeting: {
      native: "¿Listo para la conversación de hoy?",
      gloss: "Ready for today's conversation?",
    },
    bubbles: {
      idle: {
        native: "¿Listo para la conversación de hoy?",
        gloss: "Ready for today's conversation?",
      },
      listening: { native: "Adelante, te escucho.", gloss: "Go on, I'm listening." },
      speaking: {
        native: "Cuéntame sobre tu fin de semana.",
        gloss: "Tell me about your weekend.",
      },
    },
    topic: "Ordering at a café",
    focus: "Preterite tense",
    mistake: {
      said: "Ayer yo voy al colegio.",
      fixed: "Ayer fui al colegio.",
      gloss: "Yesterday I went to school.",
    },
    transcript: [
      {
        who: "Lingo",
        text: "Cuéntame sobre tu fin de semana.",
        gloss: "Tell me about your weekend.",
      },
      {
        who: "You",
        text: "Fui al estadio con mis amigos…",
        gloss: "I went to the stadium with my friends…",
      },
    ],
    stats: {
      level: 6,
      xp: 1140,
      next: 1500,
      streak: 4,
      conversations: 14,
      minutes: "1 h 22 m",
      confidence: 61,
      vocabulary: 54,
      grammar: 48,
      trend: [38, 43, 45, 49, 53, 57, 61],
    },
    memory: [
      {
        memory_type: "strength",
        concept: "Pronunciation of rolled r",
        detail: "Clear and consistent since week two.",
        timestamp: "3 days ago",
      },
      {
        memory_type: "strength",
        concept: "Café & travel vocabulary",
        detail: "You order confidently without pausing.",
        timestamp: "yesterday",
      },
      {
        memory_type: "mistake",
        concept: "Preterite tense",
        detail: "Using present “voy” where “fui” is needed.",
        timestamp: "today",
        count: 6,
      },
      {
        memory_type: "mistake",
        concept: "Ser vs estar",
        detail: "“Soy cansado” instead of “estoy cansado”.",
        timestamp: "2 days ago",
        count: 4,
      },
      {
        memory_type: "mistake",
        concept: "Gendered articles",
        detail: "“El problema” often becomes “la problema”.",
        timestamp: "4 days ago",
        count: 2,
      },
      {
        memory_type: "interest",
        concept: "Food & cooking",
        detail: "Your favourite conversation starter.",
        timestamp: "ongoing",
      },
      {
        memory_type: "interest",
        concept: "Travel",
        detail: "Planning a trip to Seville.",
        timestamp: "ongoing",
      },
      {
        memory_type: "pattern",
        concept: "Short bursts",
        detail: "You do best in 5-minute sessions.",
        timestamp: "this week",
      },
    ],
    lastSession: { topic: "Ordering at a café", when: "yesterday" },
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    region: "France",
    image: frenchImg,
    learners: "640k learners",
    greeting: {
      native: "Prêt pour la conversation d'aujourd'hui ?",
      gloss: "Ready for today's conversation?",
    },
    bubbles: {
      idle: {
        native: "Prêt pour la conversation d'aujourd'hui ?",
        gloss: "Ready for today's conversation?",
      },
      listening: { native: "Vas-y, je t'écoute.", gloss: "Go on, I'm listening." },
      speaking: { native: "Parle-moi de ton week-end.", gloss: "Tell me about your weekend." },
    },
    topic: "Asking for directions",
    focus: "Passé composé",
    mistake: {
      said: "Hier je vais au cinéma.",
      fixed: "Hier je suis allé au cinéma.",
      gloss: "Yesterday I went to the cinema.",
    },
    transcript: [
      { who: "Lingo", text: "Parle-moi de ton week-end.", gloss: "Tell me about your weekend." },
      {
        who: "You",
        text: "Je suis allé au stade avec mes amis…",
        gloss: "I went to the stadium with my friends…",
      },
    ],
    stats: {
      level: 3,
      xp: 480,
      next: 800,
      streak: 2,
      conversations: 6,
      minutes: "38 m",
      confidence: 44,
      vocabulary: 39,
      grammar: 35,
      trend: [21, 25, 28, 31, 36, 40, 44],
    },
    memory: [
      {
        memory_type: "strength",
        concept: "Polite register",
        detail: "You use “vous” naturally with strangers.",
        timestamp: "2 days ago",
      },
      {
        memory_type: "strength",
        concept: "Listening comprehension",
        detail: "You rarely need a replay.",
        timestamp: "5 days ago",
      },
      {
        memory_type: "mistake",
        concept: "Passé composé",
        detail: "Choosing avoir where être is required.",
        timestamp: "today",
        count: 5,
      },
      {
        memory_type: "mistake",
        concept: "Nasal vowels",
        detail: "“vin” and “vain” still sound alike.",
        timestamp: "yesterday",
        count: 3,
      },
      {
        memory_type: "mistake",
        concept: "Adjective agreement",
        detail: "Missing the feminine “-e”.",
        timestamp: "3 days ago",
        count: 2,
      },
      {
        memory_type: "interest",
        concept: "Cinema",
        detail: "You talk about films every session.",
        timestamp: "ongoing",
      },
      {
        memory_type: "interest",
        concept: "Music",
        detail: "Chanson lyrics are your vocabulary source.",
        timestamp: "ongoing",
      },
      {
        memory_type: "pattern",
        concept: "Weekend learner",
        detail: "Most sessions land on Saturdays.",
        timestamp: "this month",
      },
    ],
    lastSession: { topic: "Asking for directions", when: "3 days ago" },
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    region: "India",
    image: hindiImg,
    learners: "410k learners",
    greeting: { native: "आज की बातचीत के लिए तैयार हो?", gloss: "Ready for today's conversation?" },
    bubbles: {
      idle: { native: "आज की बातचीत के लिए तैयार हो?", gloss: "Ready for today's conversation?" },
      listening: { native: "बोलो, मैं सुन रहा हूँ।", gloss: "Go on, I'm listening." },
      speaking: { native: "अपने वीकेंड के बारे में बताओ।", gloss: "Tell me about your weekend." },
    },
    topic: "At the market",
    focus: "Gender agreement",
    mistake: {
      said: "कल मैं कॉलेज जाता है।",
      fixed: "कल मैं कॉलेज गया।",
      gloss: "Yesterday I went to college.",
    },
    transcript: [
      { who: "Lingo", text: "अपने वीकेंड के बारे में बताओ।", gloss: "Tell me about your weekend." },
      {
        who: "You",
        text: "मैं दोस्तों के साथ स्टेडियम गया…",
        gloss: "I went to the stadium with my friends…",
      },
    ],
    stats: {
      level: 5,
      xp: 900,
      next: 1200,
      streak: 3,
      conversations: 11,
      minutes: "1 h 04 m",
      confidence: 57,
      vocabulary: 62,
      grammar: 41,
      trend: [30, 34, 39, 44, 48, 53, 57],
    },
    memory: [
      {
        memory_type: "strength",
        concept: "Everyday vocabulary",
        detail: "Market and family words come instantly.",
        timestamp: "yesterday",
      },
      {
        memory_type: "strength",
        concept: "Natural rhythm",
        detail: "Your sentence melody sounds native.",
        timestamp: "4 days ago",
      },
      {
        memory_type: "mistake",
        concept: "Gender agreement",
        detail: "“गया” vs “गई” mixed up.",
        timestamp: "today",
        count: 6,
      },
      {
        memory_type: "mistake",
        concept: "Postpositions",
        detail: "Dropping “को” after objects.",
        timestamp: "2 days ago",
        count: 3,
      },
      {
        memory_type: "mistake",
        concept: "Formal “आप”",
        detail: "Switching registers mid-sentence.",
        timestamp: "5 days ago",
        count: 2,
      },
      {
        memory_type: "interest",
        concept: "Cricket",
        detail: "Half your sessions end up here.",
        timestamp: "ongoing",
      },
      {
        memory_type: "interest",
        concept: "Bollywood",
        detail: "You learn phrases from film dialogue.",
        timestamp: "ongoing",
      },
      {
        memory_type: "pattern",
        concept: "Morning learner",
        detail: "Best accuracy before 10 AM.",
        timestamp: "this week",
      },
    ],
    lastSession: { topic: "At the market", when: "today" },
  },
};

export const LANGUAGE_ORDER: LanguageCode[] = ["en", "es", "fr", "hi"];

const STORAGE_KEY = "speakable.learner_profile";

type LearnerProfile = { user_id: string; active_language: LanguageCode; languages: LanguageCode[] };

const DEFAULT_PROFILE: LearnerProfile = {
  user_id: "demo-user",
  active_language: "es",
  languages: ["es", "en"],
};

type Ctx = {
  profile: LearnerProfile;
  language: LanguageProfile;
  /** Switching keeps every language's history intact. */
  setLanguage: (code: LanguageCode) => void;
  languages: LanguageProfile[];
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<LearnerProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const value = parsed as Partial<LearnerProfile>;
          const activeLanguage = LANGUAGE_ORDER.includes(value.active_language as LanguageCode)
            ? (value.active_language as LanguageCode)
            : DEFAULT_PROFILE.active_language;
          const languages = Array.isArray(value.languages)
            ? value.languages.filter((code): code is LanguageCode =>
                LANGUAGE_ORDER.includes(code as LanguageCode),
              )
            : DEFAULT_PROFILE.languages;
          setProfile({
            ...DEFAULT_PROFILE,
            active_language: activeLanguage,
            languages: languages.includes(activeLanguage)
              ? languages
              : [...languages, activeLanguage],
          });
        }
      }
    } catch {
      /* prototype storage is best-effort */
    }
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setProfile((p) => {
      // history for every language is preserved — we only add, never replace
      const next: LearnerProfile = {
        ...p,
        active_language: code,
        languages: p.languages.includes(code) ? p.languages : [...p.languages, code],
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      profile,
      language: LANGUAGES[profile.active_language],
      setLanguage,
      languages: profile.languages.map((c) => LANGUAGES[c]),
    }),
    [profile, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
