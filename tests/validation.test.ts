import { describe, expect, it } from "vitest";

import { validateAnalyzeRequest } from "@/lib/validation";

describe("validateAnalyzeRequest", () => {
  it("rejects buzzword soup", () => {
    const result = validateAnalyzeRequest({
      mode: "initial",
      idea: "AI powered platform for scalable intelligent workflow optimization across teams",
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      message: "This reads like buzzwords, not a problem. Make it concrete.",
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

  it("rejects overly long ideas", () => {
    const result = validateAnalyzeRequest({
      mode: "initial",
      idea: "Landlord ".repeat(80),
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      message: "Too broad. Narrow to one user and one outcome.",
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
      message: "Not enough context. Say what you tested and what happened.",
    });
  });
});
