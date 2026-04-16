import { describe, expect, it } from "vitest";

import {
  BUZZWORD_SOUP_MESSAGE,
  IDEA_GUIDANCE_MESSAGE,
  NARROW_IDEA_MESSAGE,
  ITERATION_CONTEXT_MESSAGE,
  validateAnalyzeRequest,
} from "@/lib/validation";

describe("validateAnalyzeRequest", () => {
  it("rejects buzzword soup", () => {
    const result = validateAnalyzeRequest({
      mode: "initial",
      idea: "AI powered platform for scalable intelligent workflow optimization across teams",
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      message: BUZZWORD_SOUP_MESSAGE,
    });
  });

  it("accepts short but concrete inputs", () => {
    const result = validateAnalyzeRequest({
      mode: "initial",
      idea: "Software for landlords to handle move-out inspections",
    });

    expect(result.ok).toBe(true);
  });

  it("accepts valid but weak creator workflow ideas", () => {
    const result = validateAnalyzeRequest({
      mode: "initial",
      idea: "AI tool that turns YouTube videos into short clips automatically",
    });

    expect(result.ok).toBe(true);
  });

  it("accepts broad but interpretable category ideas", () => {
    const result = validateAnalyzeRequest({
      mode: "initial",
      idea: "google for second hand ad sales",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects meaningless short ideas with sharper guidance", () => {
    const result = validateAnalyzeRequest({
      mode: "initial",
      idea: "idea app",
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      message: IDEA_GUIDANCE_MESSAGE,
    });
  });

  it("rejects overly long ideas", () => {
    const result = validateAnalyzeRequest({
      mode: "initial",
      idea: "Landlord ".repeat(80),
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      message: NARROW_IDEA_MESSAGE,
    });
  });

  it("requires notes when no-result context is too weak", () => {
    const result = validateAnalyzeRequest({
      mode: "iteration",
      idea: "AI app",
      previous_angle: "Better productivity",
      result: "none",
      notes: "",
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      message: ITERATION_CONTEXT_MESSAGE,
    });
  });
});
