import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

type TutorRequest = {
  requestId?: string | undefined;
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
const GEMINI_MODEL = "gemini-3.8-flash";
const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";
const GEMINI_TUTOR_TIMEOUT_MS = 12_000;

function logGeminiTiming(
  requestId: string | undefined,
  stage: string,
  startedAt: number,
  extra = {},
) {
  console.info(
    JSON.stringify({
      component: "tutor-performance",
      provider: "gemini",
      requestId,
      stage,
      elapsedMs: Math.round(performance.now() - startedAt),
      ...extra,
    }),
  );
}

function createGeminiClient(apiKey: string, attempts = 2, timeout = 15_000) {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout,
      retryOptions: {
        attempts,
        initialDelay: 1,
        maxDelay: 5,
      },
    },
  });
}

function getGeminiStatus(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

type GeminiErrorDetails = {
  status?: number;
  code?: string;
  retryDelay?: string;
  quotaId?: string;
};

export function getGeminiErrorDetails(error: unknown): GeminiErrorDetails {
  const details: GeminiErrorDetails = {};
  const visit = (value: unknown, depth = 0): void => {
    if (depth > 10 || value == null) return;
    if (typeof value === "string") {
      try {
        visit(JSON.parse(value) as unknown, depth + 1);
      } catch {
        return;
      }
      return;
    }
    if (typeof value !== "object") return;

    const record = value as Record<string, unknown>;
    if (typeof record["status"] === "number") details.status = record["status"];
    if (typeof record["code"] === "number") details.status = record["code"];
    if (typeof record["code"] === "string" && /^[A-Z][A-Z0-9_]+$/.test(record["code"])) {
      details.code = record["code"];
    } else if (typeof record["status"] === "string" && /^[A-Z][A-Z0-9_]+$/.test(record["status"])) {
      details.code = record["status"];
    }
    if (typeof record["retryDelay"] === "string") details.retryDelay = record["retryDelay"];
    if (typeof record["quotaId"] === "string") details.quotaId = record["quotaId"];
    if (Array.isArray(record["details"])) {
      for (const item of record["details"]) visit(item, depth + 1);
    }
    if (record["error"] !== undefined) visit(record["error"], depth + 1);
    if (record["message"] !== undefined) visit(record["message"], depth + 1);
  };

  visit(error);
  if (details.status === undefined) {
    const status = getGeminiStatus(error);
    if (status !== undefined) details.status = status;
  }
  return details;
}

function isTransientGeminiError(error: unknown) {
  const { status, code } = getGeminiErrorDetails(error);
  return (
    (status !== undefined && (status === 429 || (status >= 500 && status <= 599))) ||
    code === "RESOURCE_EXHAUSTED"
  );
}

export function explainGeminiProviderError(error: unknown) {
  const providerError =
    typeof error === "object" && error !== null
      ? (error as { status?: unknown; code?: unknown })
      : undefined;
  const details = getGeminiErrorDetails(error);
  const status = details.status;
  const code = typeof providerError?.code === "string" ? providerError.code : "";

  if (
    status === 401 ||
    status === 403 ||
    code === "UNAUTHENTICATED" ||
    details.code === "UNAUTHENTICATED"
  ) {
    return "Gemini rejected the server credentials. Verify or replace the Cloudflare GEMINI_API_KEY secret.";
  }
  if (status === 429 || code === "RESOURCE_EXHAUSTED" || details.code === "RESOURCE_EXHAUSTED") {
    const retry = details.retryDelay
      ? ` Google reports a retry delay of ${details.retryDelay}.`
      : "";
    return `Gemini rate limit or quota reached for the configured model. Check the Google AI project quota and billing.${retry}`;
  }
  if (status === 400 || code === "INVALID_ARGUMENT") {
    return "Gemini rejected the request. Check the selected model and request configuration.";
  }
  if (status === 404 || code === "NOT_FOUND") {
    return "The configured Gemini model or API endpoint was not found. Check model availability for this key.";
  }
  if (status !== undefined && status >= 500) {
    return "Gemini is temporarily unavailable. Please retry in a moment.";
  }
  if (error instanceof TypeError) {
    return "The server could not reach Gemini. Check provider connectivity and retry.";
  }
  return "Gemini provider request failed. Check the Cloudflare Worker logs and server configuration.";
}

export async function generateTutorResponse(request: TutorRequest) {
  const apiKey = process.env["GEMINI_API_KEY"];

  if (!apiKey) {
    throw new Error("Gemini is not configured. Set GEMINI_API_KEY on the server.");
  }

  const client = createGeminiClient(apiKey, 1, GEMINI_TUTOR_TIMEOUT_MS);
  const requestStartedAt = performance.now();
  logGeminiTiming(request.requestId, "gemini-request-start", requestStartedAt, {
    model: GEMINI_MODEL,
  });
  const contents = `You are Lingo, a friendly ${languageNames[request.language]} conversation tutor.
The learner is practising ${languageNames[request.language]} at ${request.level} level.
Topic: ${request.topic}. Goal: ${request.goal}.
Recent turns:
${request.history
  .slice(-6)
  .map((turn) => `${turn.role === "learner" ? "Learner" : "Tutor"}: ${turn.text.slice(-300)}`)
  .join("\n")}
Learner: ${request.text}

Reply naturally in ${languageNames[request.language]} at the learner's level. Keep speech to 1–2 short sentences. Respond to what they said; gently model a correction only when clearly warranted. Ask one brief follow-up question when natural. Do not invent details. Return JSON: {"speech":"spoken reply in ${languageNames[request.language]}","explanation":"brief English correction explanation, or null"}.`;

  const generate = async (model: string) => {
    const modelStartedAt = performance.now();
    logGeminiTiming(request.requestId, "gemini-model-request-start", requestStartedAt, {
      model,
    });
    const chunks = await client.models.generateContentStream({
      model,
      config: { responseMimeType: "application/json", maxOutputTokens: 192 },
      contents,
    });
    let responseText = "";
    let firstChunk = true;
    for await (const chunk of chunks) {
      if (firstChunk) {
        firstChunk = false;
        logGeminiTiming(request.requestId, "gemini-first-response-chunk", modelStartedAt, {
          model,
        });
      }
      responseText += chunk.text ?? "";
    }
    if (firstChunk) {
      logGeminiTiming(request.requestId, "gemini-empty-stream", modelStartedAt, { model });
    }
    logGeminiTiming(request.requestId, "gemini-model-response-complete", modelStartedAt, {
      model,
    });
    return responseText;
  };

  const responseText = await generate(GEMINI_MODEL).catch(async (error: unknown) => {
    const details = getGeminiErrorDetails(error);
    const status = details.status;
    if (!isTransientGeminiError(error)) {
      console.error("Gemini tutor request failed", {
        status,
        code: details.code,
        quotaId: details.quotaId,
        retryDelay: details.retryDelay,
        model: GEMINI_MODEL,
      });
      logGeminiTiming(request.requestId, "gemini-request-failed", requestStartedAt, {
        status,
        code: details.code,
        model: GEMINI_MODEL,
      });
      throw new Error(explainGeminiProviderError(error));
    }

    console.warn("Gemini primary model unavailable; trying fallback", {
      status,
      code: details.code,
      quotaId: details.quotaId,
      retryDelay: details.retryDelay,
      primaryModel: GEMINI_MODEL,
      fallbackModel: GEMINI_FALLBACK_MODEL,
    });
    return generate(GEMINI_FALLBACK_MODEL).catch((fallbackError: unknown) => {
      const fallbackDetails = getGeminiErrorDetails(fallbackError);
      const fallbackStatus = fallbackDetails.status;
      console.error("Gemini fallback request failed", {
        status: fallbackStatus,
        code: fallbackDetails.code,
        quotaId: fallbackDetails.quotaId,
        retryDelay: fallbackDetails.retryDelay,
        model: GEMINI_FALLBACK_MODEL,
      });
      logGeminiTiming(request.requestId, "gemini-fallback-failed", requestStartedAt, {
        status: fallbackStatus,
        code: fallbackDetails.code,
      });
      throw new Error(explainGeminiProviderError(fallbackError));
    });
  });

  logGeminiTiming(request.requestId, "gemini-request-complete", requestStartedAt);
  const text = responseText.trim();
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

  const client = createGeminiClient(apiKey);
  const response = await client.models
    .generateContent({
      model: GEMINI_MODEL,
      config: { responseMimeType: "application/json" },
      contents: `Review this real ${languageNames[request.language]} practice conversation for a ${request.level} learner. Topic: ${request.topic}. Learning goal: ${request.goal}.
Only use evidence in the learner turns. Do not invent errors, vocabulary, achievements, scores, or improvement over time. Give corrections only for clear errors. Keep explanations and meanings in English. Return JSON with this shape: {"summary":"one concise factual sentence","corrections":[{"heard":"exact learner wording","suggested":"correction","explanation":"brief English explanation"}],"phrases":[{"phrase":"useful phrase actually present in the conversation","meaning":"brief English meaning"}],"recommendation":"one specific next-practice suggestion"}. Use empty arrays when there is no evidence for corrections or phrases.

Conversation:
${request.turns.map((turn) => `${turn.role === "learner" ? "Learner" : "Tutor"}: ${turn.text}`).join("\n")}`,
    })
    .catch((error: unknown) => {
      const message = explainGeminiProviderError(error);
      const status = getGeminiStatus(error);
      console.error("Gemini session review failed", { status });
      throw new Error(message);
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
