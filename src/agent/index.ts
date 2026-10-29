import {
  Agent,
  AgentSession,
  WorkerOptions,
  cli,
  defineAgent,
  inference,
} from "@livekit/agents";
import * as rime from "@livekit/agents-plugin-rime";
import { fileURLToPath } from "node:url";

export default defineAgent({
  entry: async (ctx) => {
    const session = new AgentSession({
      stt: new inference.STT({
        model: "deepgram/nova-3",
        language: "en",
      }),

      llm: new inference.LLM({
        model: "google/gemini-2.5-flash",
      }),

      tts: new rime.TTS({
        modelId: "coda",
        speaker: "astra",
        apiKey: process.env["RIME_API_KEY"]!,
      }),
    });

    const agent = new Agent({
      instructions:
        "You are Lingo, a friendly AI language tutor. Speak naturally and keep responses concise. Help the learner practice conversational language.",
    });

    await session.start({
      agent,
      room: ctx.room,
    });

    await session.generateReply({
      instructions: "Greet the learner and ask them about their day.",
    });
  },
});

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
  }),
);