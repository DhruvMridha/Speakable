const RIME_TTS_URL = "https://coda.api.rime.ai/";
const RIME_AUDIO_TYPE = "audio/mpeg";
const RIME_MODEL_ID = "coda";
const RIME_VOICES = {
  en: "astra",
  es: "lark",
  fr: "aurelie",
  hi: "nadi",
} as const;

type RimeVoiceTestResult = {
  audioBase64: string;
  contentType: string;
  sentence: string;
};

function getRimeApiKey() {
  return globalThis.process?.env?.["RIME_API_KEY"];
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

function logRimeTiming(
  requestId: string | undefined,
  stage: string,
  startedAt: number,
  extra = {},
) {
  console.info(
    JSON.stringify({
      component: "tutor-performance",
      provider: "rime",
      requestId,
      stage,
      elapsedMs: Math.round(performance.now() - startedAt),
      ...extra,
    }),
  );
}

async function requestRimeAudio(
  text: string,
  language: keyof typeof RIME_VOICES,
  requestId?: string,
) {
  const apiKey = getRimeApiKey();
  if (!apiKey) {
    throw new Error("Missing RIME_API_KEY on the server.");
  }

  const startedAt = performance.now();
  logRimeTiming(requestId, "rime-request-start", startedAt);
  let response: Response;
  try {
    response = await fetch(RIME_TTS_URL, {
      method: "POST",
      headers: {
        Accept: RIME_AUDIO_TYPE,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        modelId: RIME_MODEL_ID,
        speaker: RIME_VOICES[language],
        lang: language,
        samplingRate: 24000,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    logRimeTiming(requestId, "rime-request-failed", startedAt, {
      networkError: true,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    throw error;
  }

  if (!response.ok) {
    logRimeTiming(requestId, "rime-request-failed", startedAt, { status: response.status });
    if (response.status === 401 || response.status === 403) {
      throw new Error("Rime rejected the server credentials. Check RIME_API_KEY.");
    }
    if (response.status === 429) {
      throw new Error("Rime is temporarily rate limited. Wait a moment and retry.");
    }
    throw new Error(`Rime TTS is temporarily unavailable (HTTP ${response.status}).`);
  }

  if (!response.body) {
    logRimeTiming(requestId, "rime-response-body-missing", startedAt);
    throw new Error("Rime TTS returned no audio stream.");
  }
  logRimeTiming(requestId, "rime-response-headers", startedAt);
  return { response, startedAt };
}

export async function streamRimeVoiceTest(
  text: string,
  language: keyof typeof RIME_VOICES,
  requestId: string,
): Promise<Response> {
  const { response, startedAt } = await requestRimeAudio(text, language, requestId);
  const reader = response.body!.getReader();
  let firstChunk = true;
  let bytes = 0;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          logRimeTiming(requestId, "rime-stream-complete", startedAt, { bytes });
          controller.close();
          return;
        }
        if (firstChunk) {
          firstChunk = false;
          logRimeTiming(requestId, "rime-first-audio-chunk", startedAt);
        }
        bytes += value.byteLength;
        controller.enqueue(value);
      } catch (error) {
        logRimeTiming(requestId, "rime-stream-failed", startedAt);
        controller.error(error);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  return new Response(body, {
    headers: {
      "content-type": response.headers.get("content-type") ?? RIME_AUDIO_TYPE,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function synthesizeRimeVoiceTest(
  text: string,
  language: keyof typeof RIME_VOICES,
): Promise<RimeVoiceTestResult> {
  const { response } = await requestRimeAudio(text, language);
  const audio = await response.arrayBuffer();

  if (audio.byteLength === 0) {
    throw new Error("Rime TTS returned an empty audio file.");
  }

  return {
    audioBase64: arrayBufferToBase64(audio),
    contentType: response.headers.get("content-type") ?? RIME_AUDIO_TYPE,
    sentence: text,
  };
}
