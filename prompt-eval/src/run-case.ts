import { readFile } from "node:fs/promises";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import {
  InitialResponseSchema,
  IterationResponseSchema,
} from "../../src/lib/schemas";
import {
  SYSTEM_PROMPT,
  buildInitialPrompt,
  buildIterationPrompt,
  buildRepairPrompt,
} from "../../src/lib/prompts";
import { validateAnalyzeRequest } from "../../src/lib/validation";

import { evaluateDeterministically, evaluateRejectedCase } from "./deterministic-eval";
import type {
  EvalRequest,
  EvalResponse,
  JudgeResult,
  PromptAttempt,
  PromptCase,
  PromptCaseResult,
} from "./types";

const JudgeResultSchema = z.object({
  pass: z.boolean(),
  scores: z.object({
    usefulness: z.number().min(1).max(5),
    specificity: z.number().min(1).max(5),
    decisiveness: z.number().min(1).max(5),
    actionability: z.number().min(1).max(5),
    genericness_reversed: z.number().min(1).max(5),
    trust_to_act: z.number().min(1).max(5),
  }),
  reason: z.string(),
  biggest_problem: z.string(),
  one_fix: z.string(),
});

type RunCaseOptions = {
  client: OpenAI;
  modelName: string;
  judgeModelName: string | null;
  runJudge: boolean;
  judgePromptPath: string;
};

function schemaForRequest(input: EvalRequest) {
  return input.mode === "initial" ? InitialResponseSchema : IterationResponseSchema;
}

function schemaNameForRequest(input: EvalRequest) {
  return input.mode === "initial" ? "initial_validation" : "iteration_validation";
}

function promptForRequest(input: EvalRequest) {
  return input.mode === "initial" ? buildInitialPrompt(input) : buildIterationPrompt(input);
}

async function generateAttempt(
  client: OpenAI,
  modelName: string,
  input: EvalRequest,
  stage: PromptAttempt["stage"],
  repairTags: string[] = [],
): Promise<PromptAttempt> {
  const schema = schemaForRequest(input);
  const prompt = promptForRequest(input);
  const schemaName = schemaNameForRequest(input);

  try {
    const response = await client.responses.parse({
      model: modelName,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        ...(repairTags.length
          ? [{ role: "system" as const, content: buildRepairPrompt(repairTags) }]
          : []),
        { role: "user", content: prompt },
      ],
      text: {
        format: zodTextFormat(schema, schemaName),
      },
    });

    return {
      stage,
      rawOutputText: response.output_text ?? "",
      parsedOutput: (response.output_parsed as EvalResponse | null) ?? null,
      deterministic: null,
      ...(response.output_parsed ? {} : { error: "No parsed output returned." }),
    };
  } catch (error) {
    return {
      stage,
      rawOutputText: "",
      parsedOutput: null,
      deterministic: null,
      error: error instanceof Error ? error.message : "Unknown model error",
    };
  }
}

async function judgeOutput(
  client: OpenAI,
  judgeModelName: string,
  judgePromptPath: string,
  testCase: PromptCase,
  output: EvalResponse,
): Promise<JudgeResult | null> {
  const judgePrompt = await readFile(judgePromptPath, "utf8");

  try {
    const response = await client.responses.parse({
      model: judgeModelName,
      input: [
        { role: "system", content: judgePrompt },
        {
          role: "user",
          content: JSON.stringify(
            {
              case: {
                id: testCase.id,
                mode: testCase.mode,
                input: testCase.input,
                expectations: testCase.expectations,
              },
              output,
            },
            null,
            2,
          ),
        },
      ],
      text: {
        format: zodTextFormat(JudgeResultSchema, "judge_result"),
      },
    });

    return (response.output_parsed as JudgeResult | null) ?? null;
  } catch {
    return null;
  }
}

export async function runCase(
  testCase: PromptCase,
  options: RunCaseOptions,
): Promise<PromptCaseResult> {
  const attempts: PromptAttempt[] = [];
  const validated = validateAnalyzeRequest(testCase.input);

  if (!validated.ok) {
    const deterministic = evaluateRejectedCase(testCase, validated.message);

    return {
      id: testCase.id,
      mode: testCase.mode,
      input: testCase.input,
      expectations: testCase.expectations,
      rejectedBeforeModel: true,
      validationError: validated.message,
      attempts,
      finalOutput: null,
      deterministic,
      judge: null,
      pass: deterministic.pass,
      notes: ["Rejected before model execution."],
    };
  }

  const firstAttempt = await generateAttempt(
    options.client,
    options.modelName,
    validated.data,
    "initial",
  );
  if (firstAttempt.parsedOutput) {
    firstAttempt.deterministic = evaluateDeterministically(
      testCase,
      firstAttempt.parsedOutput,
    );
  }
  attempts.push(firstAttempt);

  let finalAttempt = firstAttempt;

  if (
    firstAttempt.parsedOutput &&
    firstAttempt.deterministic &&
    !firstAttempt.deterministic.pass
  ) {
    const secondAttempt = await generateAttempt(
      options.client,
      options.modelName,
      validated.data,
      "repair",
      firstAttempt.deterministic.tags,
    );

    if (secondAttempt.parsedOutput) {
      secondAttempt.deterministic = evaluateDeterministically(
        testCase,
        secondAttempt.parsedOutput,
      );
    }

    attempts.push(secondAttempt);
    finalAttempt = secondAttempt;
  }

  const deterministic =
    finalAttempt.deterministic ??
    evaluateRejectedCase(testCase, finalAttempt.error ?? "Model did not return output.");

  const judge =
    options.runJudge &&
    options.judgeModelName &&
    finalAttempt.parsedOutput &&
    deterministic.tags[0] !== "SCHEMA_INVALID"
      ? await judgeOutput(
          options.client,
          options.judgeModelName,
          options.judgePromptPath,
          testCase,
          finalAttempt.parsedOutput,
        )
      : null;

  const pass = deterministic.pass && (judge ? judge.pass : true);
  const notes: string[] = [];

  if (judge && !judge.pass) {
    notes.push(`Judge failed: ${judge.biggest_problem}`);
  }

  if (!deterministic.pass) {
    notes.push(...deterministic.reasons);
  }

  return {
    id: testCase.id,
    mode: testCase.mode,
    input: testCase.input,
    expectations: testCase.expectations,
    rejectedBeforeModel: false,
    attempts,
    finalOutput: finalAttempt.parsedOutput,
    deterministic,
    judge,
    pass,
    notes,
  };
}
