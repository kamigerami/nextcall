import { describe, expect, it } from "vitest";

import {
  ArtifactTypeSchema,
  InitialResponseSchema,
  IterationResponseSchema,
} from "@/lib/schemas";

describe("contracts", () => {
  it("keeps artifact types constrained", () => {
    expect(ArtifactTypeSchema.safeParse("post").success).toBe(true);
    expect(ArtifactTypeSchema.safeParse("thread").success).toBe(false);
  });

  it("enforces exact initial hook counts", () => {
    const result = InitialResponseSchema.safeParse({
      assessment: { verdict: "weak", reason: "Too broad." },
      best_angle: {
        title: "Landlords hate slow move-out inspections",
        description: "Specific operational pain beats generic property tech.",
      },
      other_angles: ["Angle one", "Angle two"],
      hooks: ["one", "two", "three", "four"],
      test: {
        what_to_do: "DM 10 property managers.",
        where: ["Email"],
        artifact_type: "email",
        artifact_text: "Quick question about move-out inspections...",
        success_condition: "If at least 5 out of 10 describe a recent example, continue.",
      },
      next_step: {
        instruction: "Test the ops angle first.",
        why: "The buyer and workflow are obvious.",
      },
    });

    expect(result.success).toBe(false);
  });

  it("enforces exact iteration hook counts", () => {
    const result = IterationResponseSchema.safeParse({
      analysis: "The angle is still too generic.",
      new_angle: "Remote teams lose decision context after meetings.",
      hooks: ["one", "two", "three"],
      next_step: "Retest with remote team leads.",
    });

    expect(result.success).toBe(true);
  });
});
