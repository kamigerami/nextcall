# nextcall

nextcall is a public, single-screen startup idea validator.

Its job is simple:

1. Take a startup idea.
2. Make one hard call on it.
3. Give one sharper angle.
4. Suggest one real-world test.
5. Tell the founder exactly what to do next.

This product is intentionally not a chat app.
It is not a brainstorming assistant.
It is not a generic founder copilot.

It is a strict decision loop:

1. `initial` mode: evaluate an idea before testing
2. `iteration` mode: evaluate what happened after a test

The whole product bet is that structured, blunt output is more useful than a pleasant wall of AI text.

## What The App Does

For an untested idea, the app returns:

- a verdict: `weak`, `promising`, or `unclear`
- one strongest angle
- a few supporting angles
- hooks that sound like real internal thoughts, not marketing
- one realistic test artifact
- an explicit success condition
- one clear next step

For a tested angle, the app returns:

- a read on what the result actually means
- a narrower next angle
- three sharper hooks
- one next test with a hard success threshold

The product should help a founder answer:

`What should I test next?`

## Product Rules

The app is designed around a few non-negotiable rules:

- weak ideas should be called weak
- vague ideas should be rejected cleanly
- boring B2B ideas should not be penalized if the pain is real
- novelty alone is not a positive signal
- every test should aim for evidence, not opinions
- every test should define what success looks like
- iteration after a failed test should narrow aggressively

If the output sounds like generic startup advice, the product is failing.

## Interface

The UI is a single page with two modes:

- `Validate idea`
- `Refine after test`

The result hierarchy is intentional:

1. `Verdict`
2. `Best angle`
3. `Test this`
4. `Use this artifact`

Everything else is secondary.

The client stores only lightweight continuity in `localStorage`:

- current mode
- latest inputs
- latest result payload

There is no auth, no saved projects, and no database-backed user history in v1.

## API Contract

The app exposes one route:

- `POST /api/analyze`

Input is a discriminated union on `mode`.

### Initial request

```json
{
  "mode": "initial",
  "idea": "Software for landlords to handle move-out inspections"
}
```

### Iteration request

```json
{
  "mode": "iteration",
  "idea": "AI tool that summarizes Slack conversations into action items",
  "previous_angle": "Stop losing action items in Slack",
  "result": "none",
  "notes": "Posted on LinkedIn, almost no reactions"
}
```

### Initial response shape

```json
{
  "assessment": {
    "verdict": "weak",
    "reason": "short, sharp explanation"
  },
  "best_angle": {
    "title": "one strong angle",
    "description": "why this is more concrete"
  },
  "other_angles": ["...", "..."],
  "hooks": ["...", "...", "...", "...", "..."],
  "test": {
    "what_to_do": "...",
    "where": ["..."],
    "artifact_type": "post",
    "artifact_text": "...",
    "success_condition": "explicit pass/fail rule"
  },
  "next_step": {
    "instruction": "...",
    "why": "..."
  }
}
```

### Iteration response shape

```json
{
  "analysis": "why it worked or failed",
  "new_angle": "more specific than before",
  "hooks": ["...", "...", "..."],
  "next_step": "must include a concrete next test and success threshold"
}
```

## Validation And Quality Gates

The app has two layers of protection before anything reaches the user.

### 1. Input validation

Requests are rejected before model inference if they are clearly unusable:

- empty
- ultra-short
- placeholder text
- buzzword soup
- weak iteration context
- wall-of-text with no real buyer/pain signal

This keeps the product cheap, fast, and deterministic.

### 2. Output quality gate

Even schema-valid model output can still be weak.

The quality gate checks for issues like:

- generic angle
- mirrored idea
- unrealistic test
- bad hooks
- incomplete output
- language glitches
- weak iteration logic

If the first model answer fails, the system regenerates once with a stricter repair prompt.
If it still fails, the API returns a deterministic product-style error instead of low-quality output.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Zod
- OpenAI Responses API with structured outputs
- Upstash Redis rate limiting
- Vitest for tests

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open the local URL printed by Next.js, usually [http://localhost:3000](http://localhost:3000).

### Required environment variables

```bash
OPENAI_API_KEY=...
```

### Optional environment variables

These enable production-style IP rate limiting:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Project Structure

Main product files:

- `src/app/page.tsx`
- `src/components/idea-validator-app.tsx`
- `src/app/api/analyze/route.ts`
- `src/lib/prompts.ts`
- `src/lib/schemas.ts`
- `src/lib/validation.ts`
- `src/lib/quality-gate.ts`
- `src/lib/rate-limit.ts`

Prompt evaluation harness:

- `prompt-eval/cases/prompt-cases.json`
- `prompt-eval/prompts/judge-prompt.md`
- `prompt-eval/src/eval.ts`
- `prompt-eval/src/run-case.ts`
- `prompt-eval/src/deterministic-eval.ts`
- `prompt-eval/src/report.ts`

## Prompt Evaluation Harness

The repo includes a prompt quality regression harness under `prompt-eval/`.

Its job is not unit testing in the usual sense.
Its job is to answer:

`Are the outputs still sharp, actionable, and better than generic chat output?`

It does that by:

- loading JSON cases
- calling the same production prompt system
- validating structured output
- applying deterministic quality checks
- optionally running a strict LLM judge
- writing JSON and Markdown reports

Run it with:

```bash
npm run eval:prompts
```

Useful variants:

```bash
PROMPT_EVAL_SKIP_JUDGE=1 npm run eval:prompts
PROMPT_EVAL_CASE=iteration-01 npm run eval:prompts
MODEL_NAME=gpt-5.4-mini npm run eval:prompts
```

Generated reports:

- `prompt-eval/reports/latest.json`
- `prompt-eval/reports/latest.md`

## Tests

Run the local test suite:

```bash
npm test
```

Lint the project:

```bash
npm run lint
```

Build the app:

```bash
npm run build
```

## What Good Output Feels Like

Good output should feel:

- blunt
- specific
- narrow
- testable
- useful immediately

It should not feel:

- chatty
- supportive for the sake of it
- polished like marketing
- clever but empty
- like a cleaned-up rewrite of the input

The product wins if a founder can copy the artifact, run the test, and come back for a second loop.
