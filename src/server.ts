import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { z } from "zod";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function exposeRuntimeSecrets(bindings: unknown) {
  if (!bindings || typeof bindings !== "object") return;
  const runtimeBindings = bindings as Record<string, unknown>;
  for (const key of ["GEMINI_API_KEY", "RIME_API_KEY"] as const) {
    const value = runtimeBindings[key];
    if (typeof value === "string" && value.length > 0) {
      process.env[key] ??= value;
    }
  }
}

async function handleTutorAudioRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed.", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid audio request." }, { status: 400 });
  }

  const parsed = z
    .object({
      text: z.string().trim().min(1).max(1000),
      language: z.enum(["en", "es", "fr", "hi"]),
      requestId: z.string().regex(/^[\w-]{1,80}$/),
    })
    .safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid audio request." }, { status: 400 });
  }

  try {
    const rime = await import("./server/rime.server");
    return await rime.streamRimeVoiceTest(
      parsed.data.text,
      parsed.data.language,
      parsed.data.requestId,
    );
  } catch (error) {
    console.error("Rime streaming request failed", {
      requestId: parsed.data.requestId,
      message: error instanceof Error ? error.message : "Unknown Rime error",
    });
    const message =
      error instanceof Error && error.message.startsWith("Rime ")
        ? error.message
        : "Tutor audio is temporarily unavailable. Please retry.";
    return Response.json({ error: message }, { status: 502 });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      exposeRuntimeSecrets(env);
      if (new URL(request.url).pathname === "/api/tutor-audio") {
        return await handleTutorAudioRequest(request);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
