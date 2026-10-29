import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tutorRequestSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  language: z.enum(["en", "es", "fr", "hi"]),
  level: z.enum(["Beginner", "Elementary", "Intermediate", "Advanced"]),
  topic: z.string().trim().min(1).max(120),
  goal: z.string().trim().min(1).max(120),
  history: z
    .array(
      z.object({
        role: z.enum(["learner", "tutor"]),
        text: z.string().trim().min(1).max(2000),
      }),
    )
    .max(20),
});

const reviewRequestSchema = z.object({
  language: z.enum(["en", "es", "fr", "hi"]),
  level: z.enum(["Beginner", "Elementary", "Intermediate", "Advanced"]),
  topic: z.string().trim().min(1).max(120),
  goal: z.string().trim().min(1).max(120),
  turns: z
    .array(
      z.object({
        role: z.enum(["learner", "tutor"]),
        text: z.string().trim().min(1).max(2000),
      }),
    )
    .min(2)
    .max(40),
});

export const getTutorResponse = createServerFn({
  method: "POST",
})
  .validator((data: unknown) => tutorRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const serverModule = await import("../server/llm.server");

    return await serverModule.generateTutorResponse(data);
  });

export const getSessionReview = createServerFn({
  method: "POST",
})
  .validator((data: unknown) => reviewRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const serverModule = await import("../server/llm.server");
    return await serverModule.generateSessionReview(data);
  });
