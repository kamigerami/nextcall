import { z } from "zod";

export const ArtifactTypeSchema = z.enum([
  "post",
  "dm",
  "email",
  "outreach_script",
]);

export const InitialRequestSchema = z.object({
  mode: z.literal("initial"),
  idea: z.string().trim(),
});

export const IterationRequestSchema = z.object({
  mode: z.literal("iteration"),
  idea: z.string().trim(),
  previous_angle: z.string().trim(),
  result: z.enum(["none", "some", "strong"]),
  notes: z.string().trim().optional().default(""),
});

export const AnalyzeRequestSchema = z.discriminatedUnion("mode", [
  InitialRequestSchema,
  IterationRequestSchema,
]);

export const InitialResponseSchema = z.object({
  assessment: z.object({
    verdict: z.enum(["weak", "promising", "unclear"]),
    reason: z.string().min(1).max(320),
  }),
  best_angle: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(320),
  }),
  other_angles: z.array(z.string().min(1).max(120)).length(2),
  hooks: z.array(z.string().min(1).max(80)).length(5),
  test: z.object({
    what_to_do: z.string().min(1).max(320),
    where: z.array(z.string().min(1).max(40)).min(1).max(3),
    artifact_type: ArtifactTypeSchema,
    artifact_text: z.string().min(1).max(650),
    success_condition: z.string().min(1).max(220),
  }),
  next_step: z.object({
    instruction: z.string().min(1).max(220),
    why: z.string().min(1).max(280),
  }),
});

export const IterationResponseSchema = z.object({
  analysis: z.string().min(1).max(500),
  new_angle: z.string().min(1).max(280),
  hooks: z.array(z.string().min(1).max(80)).length(3),
  next_step: z.string().min(1).max(420),
});

export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;
export type InitialRequest = z.infer<typeof InitialRequestSchema>;
export type IterationRequest = z.infer<typeof IterationRequestSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type InitialResponse = z.infer<typeof InitialResponseSchema>;
export type IterationResponse = z.infer<typeof IterationResponseSchema>;
