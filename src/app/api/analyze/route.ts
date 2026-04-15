import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";

import { getAppConfig } from "@/lib/app-config";
import {
  AnalyzeRequestSchema,
  InitialResponseSchema,
  IterationResponseSchema,
  type AnalyzeRequest,
  type InitialResponse,
  type IterationResponse,
} from "@/lib/schemas";
import {
  MODEL_NAME,
  SYSTEM_PROMPT,
  buildInitialPrompt,
  buildIterationPrompt,
  buildRepairPrompt,
} from "@/lib/prompts";
import {
  evaluateInitialQuality,
  evaluateIterationQuality,
} from "@/lib/quality-gate";
import { getRequestIp, limitRequest } from "@/lib/rate-limit";
import { validateAnalyzeRequest } from "@/lib/validation";

const FAILURE_MESSAGE =
  "No usable answer. Make the idea more concrete: who it is for, what pain it solves, or what someone would pay for.";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type ParsedResponse = InitialResponse | IterationResponse;

function blockedResponse(
  status: 404 | 503,
  reason: "blocked:mode" | "blocked:analyze_disabled",
) {
  console.info(`analyze route blocked: ${reason}`);

  const response = NextResponse.json(
    {
      error:
        status === 404
          ? "Not found."
          : "Analyzer temporarily paused. Try again later.",
    },
    { status },
  );

  response.headers.set("x-nextpitch-blocked", "true");

  return response;
}

async function generateResponse(
  payload: AnalyzeRequest,
  retryTags: string[] = [],
): Promise<ParsedResponse> {
  if (!client) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const isInitial = payload.mode === "initial";
  const schema = isInitial ? InitialResponseSchema : IterationResponseSchema;
  const prompt = isInitial ? buildInitialPrompt(payload) : buildIterationPrompt(payload);
  const schemaName = isInitial ? "initial_validation" : "iteration_validation";
  const repairPrompt = retryTags.length ? buildRepairPrompt(retryTags) : "";

  const response = await client.responses.parse({
    model: MODEL_NAME,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      ...(repairPrompt ? [{ role: "system" as const, content: repairPrompt }] : []),
      { role: "user", content: prompt },
    ],
    text: {
      format: zodTextFormat(schema, schemaName),
    },
  });

  if (!response.output_parsed) {
    throw new Error("Model returned no parsed output");
  }

  return response.output_parsed as ParsedResponse;
}

export async function POST(request: Request) {
  const { appMode, analyzeEnabled } = getAppConfig();

  if (appMode !== "full") {
    return blockedResponse(404, "blocked:mode");
  }

  if (!analyzeEnabled) {
    return blockedResponse(503, "blocked:analyze_disabled");
  }

  const ip = getRequestIp(request.headers);
  const rateLimit = await limitRequest(ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many tries. Wait a bit, then test again." },
      { status: 429 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Too vague. Name the buyer, pain, or price." },
      { status: 400 },
    );
  }

  const validated = validateAnalyzeRequest(body);

  if (!validated.ok) {
    return NextResponse.json({ error: validated.message }, { status: 400 });
  }

  const payload = AnalyzeRequestSchema.parse(validated.data);

  try {
    const firstPass = await generateResponse(payload);

    if (payload.mode === "initial") {
      const issues = evaluateInitialQuality(payload, firstPass as InitialResponse);

      if (!issues.length) {
        return NextResponse.json(firstPass);
      }

      const secondPass = await generateResponse(payload, issues);
      const secondIssues = evaluateInitialQuality(payload, secondPass as InitialResponse);

      if (!secondIssues.length) {
        return NextResponse.json(secondPass);
      }
    } else {
      const issues = evaluateIterationQuality(payload, firstPass as IterationResponse);

      if (!issues.length) {
        return NextResponse.json(firstPass);
      }

      const secondPass = await generateResponse(payload, issues);
      const secondIssues = evaluateIterationQuality(
        payload,
        secondPass as IterationResponse,
      );

      if (!secondIssues.length) {
        return NextResponse.json(secondPass);
      }
    }

    return NextResponse.json({ error: FAILURE_MESSAGE }, { status: 422 });
  } catch (error) {
    console.error("analyze route failed", error);

    return NextResponse.json(
      {
        error: client
          ? FAILURE_MESSAGE
          : "Missing OPENAI_API_KEY. Add it to your environment before testing the app.",
      },
      { status: 500 },
    );
  }
}
