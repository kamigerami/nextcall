import type { EvalReport, EvalSummary, PromptCaseResult } from "./types";
import { formatPercent } from "./utils";

const BLOCKER_TAGS = new Set([
  "SCHEMA_INVALID",
  "AD_COPY_HOOKS",
  "MIRRORED_IDEA",
  "UNREALISTIC_TEST",
  "BAD_ITERATION_LOGIC",
  "LANGUAGE_GLITCH",
  "INCOMPLETE_OUTPUT",
  "PRE_MODEL_REJECTION",
]);

function countTag(results: PromptCaseResult[], tag: string) {
  return results.filter((result) => result.deterministic.tags.includes(tag as never)).length;
}

export function buildSummary(results: PromptCaseResult[]): EvalSummary {
  const total = results.length;
  const passed = results.filter((result) => result.pass).length;
  const failed = total - passed;
  const passRate = total === 0 ? 0 : passed / total;
  const blockerCounts = results.reduce<Record<string, number>>((acc, result) => {
    result.deterministic.tags.forEach((tag) => {
      if (BLOCKER_TAGS.has(tag)) {
        acc[tag] = (acc[tag] ?? 0) + 1;
      }
    });
    return acc;
  }, {});

  return {
    total,
    passed,
    failed,
    passRate,
    schemaFailures: countTag(results, "SCHEMA_INVALID"),
    genericFailures:
      countTag(results, "GENERIC_ANGLE") + countTag(results, "GENERIC_ARTIFACT"),
    mirroredIdeaFailures: countTag(results, "MIRRORED_IDEA"),
    badHooksFailures:
      countTag(results, "BAD_HOOKS") +
      countTag(results, "DUPLICATE_HOOKS") +
      countTag(results, "AD_COPY_HOOKS") +
      countTag(results, "LANGUAGE_GLITCH") +
      countTag(results, "INCOMPLETE_OUTPUT"),
    unrealisticTestFailures: countTag(results, "UNREALISTIC_TEST"),
    weakIterationFailures: countTag(results, "BAD_ITERATION_LOGIC"),
    blockerCounts,
    overallPass: false,
  };
}

export function finalizeSummary(
  summary: EvalSummary,
  options: { passRateThreshold: number; blockerThreshold: number },
) {
  const blockerTotal = Object.values(summary.blockerCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  summary.overallPass =
    summary.schemaFailures === 0 &&
    blockerTotal <= options.blockerThreshold &&
    summary.passRate >= options.passRateThreshold;

  return summary;
}

function renderJudge(result: PromptCaseResult) {
  if (!result.judge) {
    return "Judge: skipped";
  }

  const { scores, reason, biggest_problem, one_fix } = result.judge;
  return [
    `Judge: ${result.judge.pass ? "pass" : "fail"}`,
    `Scores: usefulness ${scores.usefulness}, specificity ${scores.specificity}, decisiveness ${scores.decisiveness}, actionability ${scores.actionability}, genericness_reversed ${scores.genericness_reversed}, trust_to_act ${scores.trust_to_act}`,
    `Reason: ${reason}`,
    `Biggest problem: ${biggest_problem}`,
    `One fix: ${one_fix}`,
  ].join("\n");
}

export function buildMarkdownReport(report: EvalReport) {
  const lines: string[] = [];
  const { metadata, summary, results } = report;

  lines.push("# Prompt Eval Report");
  lines.push("");
  lines.push(`- Generated: ${metadata.generatedAt}`);
  lines.push(`- Model: ${metadata.model}`);
  lines.push(`- Judge model: ${metadata.judgeModel ?? "disabled"}`);
  lines.push(`- Judge enabled: ${metadata.runJudge ? "yes" : "no"}`);
  lines.push(`- Case filter: ${metadata.caseFilter ?? "all"}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("| --- | --- |");
  lines.push(`| Total tests | ${summary.total} |`);
  lines.push(`| Passed | ${summary.passed} |`);
  lines.push(`| Failed | ${summary.failed} |`);
  lines.push(`| Pass rate | ${formatPercent(summary.passRate)} |`);
  lines.push(`| Schema failures | ${summary.schemaFailures} |`);
  lines.push(`| Generic failures | ${summary.genericFailures} |`);
  lines.push(`| Mirrored idea failures | ${summary.mirroredIdeaFailures} |`);
  lines.push(`| Bad hooks failures | ${summary.badHooksFailures} |`);
  lines.push(`| Unrealistic test failures | ${summary.unrealisticTestFailures} |`);
  lines.push(`| Weak iteration failures | ${summary.weakIterationFailures} |`);
  lines.push(`| Overall pass | ${summary.overallPass ? "yes" : "no"} |`);
  lines.push("");
  lines.push("## Cases");
  lines.push("");

  for (const result of results) {
    lines.push(`### ${result.id} (${result.mode})`);
    lines.push("");
    lines.push(`- Final status: ${result.pass ? "pass" : "fail"}`);
    lines.push(`- Rejected before model: ${result.rejectedBeforeModel ? "yes" : "no"}`);
    lines.push(
      `- Expected rejection: ${result.deterministic.expectedRejection ? "yes" : "no"}`,
    );
    lines.push(
      `- Unexpected rejection: ${result.deterministic.unexpectedRejection ? "yes" : "no"}`,
    );
    lines.push(
      `- Deterministic tags: ${
        result.deterministic.tags.length ? result.deterministic.tags.join(", ") : "none"
      }`,
    );
    if (result.validationError) {
      lines.push(`- Validation error: ${result.validationError}`);
    }
    lines.push("");
    lines.push("Input:");
    lines.push("```json");
    lines.push(JSON.stringify(result.input, null, 2));
    lines.push("```");
    lines.push("");

    if (result.finalOutput) {
      lines.push("Output:");
      lines.push("```json");
      lines.push(JSON.stringify(result.finalOutput, null, 2));
      lines.push("```");
      lines.push("");
    }

    lines.push("Deterministic evaluation:");
    lines.push("```json");
    lines.push(JSON.stringify(result.deterministic, null, 2));
    lines.push("```");
    lines.push("");

    lines.push(renderJudge(result));
    lines.push("");

    if (result.notes.length) {
      lines.push("Notes:");
      for (const note of result.notes) {
        lines.push(`- ${note}`);
      }
      lines.push("");
    }

    if (result.attempts.length) {
      lines.push("Attempts:");
      for (const attempt of result.attempts) {
        lines.push(`- ${attempt.stage}: ${attempt.error ? `error - ${attempt.error}` : "ok"}`);
        if (attempt.rawOutputText) {
          lines.push("```text");
          lines.push(attempt.rawOutputText);
          lines.push("```");
        }
      }
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}
