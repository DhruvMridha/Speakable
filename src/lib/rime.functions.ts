import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getRimeVoiceTestAudio = createServerFn({
  method: "POST",
})
  .validator((data: unknown) =>
    z
      .object({
        text: z.string().trim().min(1).max(1000),
        language: z.enum(["en", "es", "fr", "hi"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const serverModule = await import("../server/rime.server");

    return await serverModule.synthesizeRimeVoiceTest(data.text, data.language);
  });
