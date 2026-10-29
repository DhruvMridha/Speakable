import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

type TutorRequest = {
  text: string;
  language: "en" | "es" | "fr" | "hi";
  level: "Beginner" | "Elementary" | "Intermediate" | "Advanced";
  topic: string;
  goal: string;
  history: { role: "learner" | "tutor"; text: string }[];
};

type SessionReviewRequest = Omit<TutorRequest, "text" | "history"> & {
  turns: { role: "learner" | "tutor"; text: string }[];
};

const languageNames: Record<TutorRequest["language"], string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  hi: "Hindi",
};

const tutorReplySchema = z.object({
  speech: z.string().trim().min(1).max(1000),
  explanation: z.string().trim().max(500).nullable(),
});

export async function generateTutorResponse(request: TutorRequest) {
  const apiKey = process.env["GEMINI_API_KEY"];

  if (!apiKey) {
    throw new Error("Gemini is not configured. Set GEMINI_API_KEY on the server.");
  }

  const client = new GoogleGenAI({
    apiKey,
  });

  const response = await client.models
    .generateContent({
      model: "gemini-flash-latest",
      config: { responseMimeType: "application/json" },
      contents: `You are Lingo, a friendly ${languageNames[request.language]} conversation tutor.
The learner is practising ${languageNames[request.language]} at ${request.level} level.
Conversation topic: ${request.topic}.
Learning goal: ${request.goal}.

Conversation so far:
${request.history.map((turn) => `${turn.role === "learner" ? "Learner" : "Tutor"}: ${turn.text}`).join("\n")}
Learner: ${request.text}

Reply in ${languageNames[request.language]}, at the learner's level. Respond to what they actually said and keep the conversation natural. If there is a clear, useful language error, model the correction naturally in the spoken reply without shaming them. End with a relevant follow-up question when it fits. Do not invent a transcript or claim to have corrected something unless the learner's words support it. Return JSON with this shape: {"speech":"1–3 short sentences only in ${languageNames[request.language]}, suitable to say aloud","explanation":"optional brief English grammar explanation, or null when no explanation is useful"}. Keep all English explanation out of the speech field.`,
    })
    .catch(() => {
      throw new Error(
        "Gemini tutor service failed. Check server credentials and provider availability.",
      );
    });

  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty tutor response.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned an invalid tutor response. Please retry.");
  }
  return tutorReplySchema.parse(parsed);
}

export async function generateSessionReview(request: SessionReviewRequest) {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("Gemini is not configured. Set GEMINI_API_KEY on the server.");
  }

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models
    .generateContent({
      model: "gemini-flash-latest",
      config: { responseMimeType: "application/json" },
      contents: `Review this real ${languageNames[request.language]} practice conversation for a ${request.level} learner. Topic: ${request.topic}. Learning goal: ${request.goal}.
Only use evidence in the learner turns. Do not invent errors, vocabulary, achievements, scores, or improvement over time. Give corrections only for clear errors. Keep explanations and meanings in English. Return JSON with this shape: {"summary":"one concise factual sentence","corrections":[{"heard":"exact learner wording","suggested":"correction","explanation":"brief English explanation"}],"phrases":[{"phrase":"useful phrase actually present in the conversation","meaning":"brief English meaning"}],"recommendation":"one specific next-practice suggestion"}. Use empty arrays when there is no evidence for corrections or phrases.

Conversation:
${request.turns.map((turn) => `${turn.role === "learner" ? "Learner" : "Tutor"}: ${turn.text}`).join("\n")}`,
    })
    .catch(() => {
      throw new Error(
        "Gemini session review failed. Check server credentials and provider availability.",
      );
    });

  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty session review.");

  const review = JSON.parse(text) as unknown;
  const { z } = await import("zod");
  return z
    .object({
      summary: z.string().min(1).max(500),
      corrections: z
        .array(
          z.object({
            heard: z.string().min(1).max(300),
            suggested: z.string().min(1).max(300),
            explanation: z.string().min(1).max(500),
          }),
        )
        .max(20),
      phrases: z
        .array(
          z.object({
            phrase: z.string().min(1).max(200),
            meaning: z.string().min(1).max(300),
          }),
        )
        .max(20),
      recommendation: z.string().min(1).max(500),
    })
    .parse(review);
}
