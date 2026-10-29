const RIME_TTS_URL = "https://coda.api.rime.ai/";
const RIME_AUDIO_TYPE = "audio/webm;codecs=opus";
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

export async function synthesizeRimeVoiceTest(
  text: string,
  language: keyof typeof RIME_VOICES,
): Promise<RimeVoiceTestResult> {
  const apiKey = getRimeApiKey();

  if (!apiKey) {
    throw new Error("Missing RIME_API_KEY on the server.");
  }

  const response = await fetch(RIME_TTS_URL, {
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

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Rime rejected the server credentials. Check RIME_API_KEY.");
    }
    if (response.status === 429) {
      throw new Error("Rime is temporarily rate limited. Wait a moment and retry.");
    }
    throw new Error(`Rime TTS is temporarily unavailable (HTTP ${response.status}).`);
  }

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
