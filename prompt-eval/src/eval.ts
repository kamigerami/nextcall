import { loadEnvConfig } from "@next/env";
import OpenAI from "openai";

import type { EvalReport, PromptCase } from "./types";
import { buildMarkdownReport, buildSummary, finalizeSummary } from "./report";
import { runCase } from "./run-case";
import {
  projectPath,
  readJsonFile,
  writeJsonFile,
  writeTextFile,
} from "./utils";

const PASS_RATE_THRESHOLD = 0.8;
const BLOCKER_THRESHOLD = 0;

async function main() {
  loadEnvConfig(process.cwd());

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const modelName = process.env.MODEL_NAME || "gpt-5.4-mini";
  const runJudge = process.env.PROMPT_EVAL_SKIP_JUDGE !== "1";
  const judgeModelName = runJudge
    ? process.env.JUDGE_MODEL_NAME || process.env.MODEL_NAME || "gpt-5.4-mini"
    : null;
  const caseFilter = process.env.PROMPT_EVAL_CASE || null;

  const client = new OpenAI({ apiKey });
  const casesPath = projectPath("prompt-eval/cases/prompt-cases.json");
  const judgePromptPath = projectPath("prompt-eval/prompts/judge-prompt.md");
  const reportJsonPath = projectPath("prompt-eval/reports/latest.json");
  const reportMdPath = projectPath("prompt-eval/reports/latest.md");

  const allCases = await readJsonFile<PromptCase[]>(casesPath);
  const cases = caseFilter
    ? allCases.filter((testCase) => testCase.id === caseFilter)
    : allCases;

  if (!cases.length) {
    throw new Error(`No cases matched filter "${caseFilter}".`);
  }

  console.log(
    `Running prompt eval for ${cases.length} case(s) with model ${modelName}${runJudge ? ` and judge ${judgeModelName}` : " without judge"}.`,
  );

  const results = [];

  for (const testCase of cases) {
    console.log(`→ ${testCase.id}`);
    const result = await runCase(testCase, {
      client,
      modelName,
      judgeModelName,
      runJudge,
      judgePromptPath,
    });
    results.push(result);
    console.log(
      `  ${result.pass ? "PASS" : "FAIL"} | tags: ${
        result.deterministic.tags.length ? result.deterministic.tags.join(", ") : "none"
      }`,
    );
  }

  const summary = finalizeSummary(buildSummary(results), {
    passRateThreshold: PASS_RATE_THRESHOLD,
    blockerThreshold: BLOCKER_THRESHOLD,
  });

  const report: EvalReport = {
    metadata: {
      generatedAt: new Date().toISOString(),
      model: modelName,
      judgeModel: judgeModelName,
      runJudge,
      caseFilter,
    },
    summary,
    results,
  };

  const markdown = buildMarkdownReport(report);

  await writeJsonFile(reportJsonPath, report);
  await writeTextFile(reportMdPath, markdown);

  console.log("");
  console.log(`Pass rate: ${(summary.passRate * 100).toFixed(1)}%`);
  console.log(`Schema failures: ${summary.schemaFailures}`);
  console.log(`Generic failures: ${summary.genericFailures}`);
  console.log(`Mirrored failures: ${summary.mirroredIdeaFailures}`);
  console.log(`Bad hooks failures: ${summary.badHooksFailures}`);
  console.log(`Unrealistic test failures: ${summary.unrealisticTestFailures}`);
  console.log(`Weak iteration failures: ${summary.weakIterationFailures}`);
  console.log(`Report: ${reportJsonPath}`);
  console.log(`Markdown: ${reportMdPath}`);

  if (!summary.overallPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Prompt eval failed to run:", error);
  process.exitCode = 1;
});
