import { describe, expect, it } from "vitest";

import {
  evaluateInitialQuality,
  evaluateIterationQuality,
} from "@/lib/quality-gate";

describe("quality gate", () => {
  it("flags mirrored initial ideas", () => {
    const tags = evaluateInitialQuality(
      {
        mode: "initial",
        idea: "AI tool that summarizes meetings",
      },
      {
        assessment: {
          verdict: "promising",
          reason: "Seems useful.",
        },
        best_angle: {
          title: "Meeting summaries",
          description: "Summarizes meetings.",
        },
        other_angles: ["Meeting automation", "AI for note taking"],
        hooks: [
          "Revolutionize meetings with AI.",
          "Revolutionize meetings with AI.",
          "Unlock productivity at scale.",
          "Transform your workflow now.",
          "Seamlessly automate notes.",
        ],
        test: {
          what_to_do: "Build an MVP and run ads.",
          where: ["LinkedIn"],
          artifact_type: "post",
          artifact_text: "Revolutionize your workflow with AI",
          success_condition: "If 5 out of 20 click the ad, continue.",
        },
        next_step: {
          instruction: "Start building.",
          why: "Because it feels promising.",
        },
      },
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "MIRRORED_IDEA",
        "BAD_HOOKS",
        "UNREALISTIC_TEST",
      ]),
    );
  });

  it("flags generic iteration hooks", () => {
    const tags = evaluateIterationQuality(
      {
        mode: "iteration",
        idea: "AI meeting summarizer",
        previous_angle: "Stop wasting time on meeting notes",
        result: "none",
        notes: "Almost no reactions",
      },
      {
        analysis: "Maybe the market needs more awareness.",
        new_angle: "Stop wasting time on meeting notes with AI",
        hooks: [
          "Transform your meetings.",
          "Transform your meetings.",
          "Unlock productivity with AI.",
        ],
        next_step: "Run a big ad campaign.",
      },
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "MIRRORED_IDEA",
        "BAD_HOOKS",
        "UNREALISTIC_TEST",
      ]),
    );
  });

  it("flags incomplete output fragments", () => {
    const tags = evaluateInitialQuality(
      {
        mode: "initial",
        idea: "Software for accounting firms to chase missing client documents before monthly close",
      },
      {
        assessment: {
          verdict: "promising",
          reason: "Clear recurring pain tied to deadlines and staff time",
        },
        best_angle: {
          title: "Month-end close delays from missing client docs",
          description: "Accounting teams lose hours chasing paperwork before every close.",
        },
        other_angles: ["Late client files stall the close", "Manual reminders burn accounting hours"],
        hooks: [
          "Still waiting on client docs at close?",
          "One missing file can drag the whole close.",
          "Your team should not spend hours nagging for files.",
          "Late documents create avoidable close chaos.",
          "The close is late because the client is late.",
        ],
        test: {
          what_to_do:
            "Email controllers and ask when missing documents last delayed the monthly close.",
          where: ["email"],
          artifact_type: "email",
          artifact_text:
            "Quick question: when did missing client documents last slow your monthly close?",
          success_condition:
            "If at least 5 out of 10 can describe a recent delay, continue.",
        },
        next_step: {
          instruction: "Talk to 10 accounting firms and confirm what it costs them in re-",
          why: "Recurring manual pain is a real wedge.",
        },
      },
    );

    expect(tags).toEqual(expect.arrayContaining(["INCOMPLETE_OUTPUT"]));
  });
});
