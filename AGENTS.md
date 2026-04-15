<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. Before making framework-level changes, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# nextcall Agent Guide

This repo is not building a generic AI app.
It is building a strict startup decision product.

If you change code here, protect the product behavior first.

## Product Definition

The full app helps founders decide what to test next.

The public site exists to explain the loop and gate access.

It is:

- a landing-first product in production
- a single-screen analyzer in preview/full mode
- a strict two-step loop
- structured output, not chat
- intentionally opinionated

It is not:

- a brainstorming assistant
- a founder copilot
- a general-purpose chat UI
- a feature ideation tool

## Core Product Loop

There are only two modes:

1. `initial`
   Evaluate an idea before it has been tested.
2. `iteration`
   Evaluate what happened after a test.

Every product decision should strengthen that loop.

## Public Vs Private Surface

The repo now has two top-level runtime surfaces:

1. `landing`
   Public production surface. Explains the product, shows the demo, and requests access.
2. `full`
   Private preview surface. Renders the actual analyzer loop.

Protect this split.

- production should feel like a serious landing page, not a half-hidden app
- preview should feel like the real product, not a marketing wrapper
- do not leak analyzer UI into `landing`
- do not let `POST /api/analyze` do paid work unless `APP_MODE=full` and `ANALYZE_ENABLED=true`

## Non-Negotiable Product Rules

When changing prompts, UI, validation, or evaluation, preserve these rules:

- always make one clear call or reject the input
- do not hedge
- do not present multiple equal options
- do not let the UI feel like chat
- do not reward novelty without real pain
- do not underrate boring B2B ideas with recurring operational pain
- do not let tests stay soft or opinion-based
- do not allow bland output just because it is schema-valid

If the output could apply to 1000 startup ideas, it is too generic.

## UI Rules

In `full` mode, the main result hierarchy must stay obvious:

1. `Verdict`
2. `Best angle`
3. `Test this`
4. `Use this artifact`

Everything else is secondary.

Do not introduce:

- transcript history
- assistant bubbles
- sidebars full of state
- dashboard chrome
- multi-step wizard sprawl

This app should feel like a decision surface, not a conversation.

In `landing` mode:

- do not render the analyzer interface
- do not render tabs like `Validate idea` / `Refine after test`
- do not imply the analyzer is publicly open
- keep the demo video as proof, not decoration
- keep the access flow manual and honest

## Prompt Rules

Prompt edits must preserve:

- blunt tone
- short, concrete language
- anti-generic behavior
- anti-mirroring behavior
- evidence-seeking tests
- explicit success conditions
- harder narrowing after `result = none`

For failed iterations, the system should narrow to:

- one role
- one moment
- one concrete failure event

Hooks should sound like internal frustration, not polished messaging.

## Validation Rules

Pre-model validation should reject:

- empty or placeholder input
- buzzword soup
- unusable vague requests
- weak iteration context

But do not reject valid weak ideas just because they are crowded or commoditized.
Those should reach the model and be called weak there.

## Quality Gate Rules

The quality gate exists because schema-valid output can still be bad.

Protect these checks:

- generic angle
- mirrored idea
- unrealistic or soft test
- weak hooks
- incomplete output
- language glitches
- weak iteration logic

If you loosen a rule, be sure you are removing false positives rather than allowing bland output through.

## Prompt Eval Harness

The harness under `prompt-eval/` is part of the product, not optional tooling.

Use it when changing:

- prompts
- schemas
- validation
- quality-gate logic
- output formatting that affects model behavior

Key command:

```bash
npm run eval:prompts
```

Useful focused command:

```bash
PROMPT_EVAL_CASE=iteration-01 npm run eval:prompts
```

Treat `iteration-01` as a north-star regression case because it exposes whether the app actually gets sharper after failed tests.

## Required Checks Before Finishing

At minimum, after meaningful changes run:

```bash
npm run lint
npm test
```

Run prompt eval when touching behavior:

```bash
npm run eval:prompts
```

If only one case matters for the change, run a focused case and say so explicitly.

Run a build when changing the top-level surface split, page composition, or deployment-facing config:

```bash
npm run build
```

## Editing Guidance

When working in this repo:

- keep changes small and product-driven
- prefer modifying existing prompt and validation logic over adding abstraction
- do not add persistence, auth, or new workflow layers unless explicitly asked
- do not add AI features that make the product broader
- do not add more output just because the model can
- do not add growth tooling, analytics products, or waitlist systems unless explicitly asked
- do not replace the manual access workflow with signup flows
- do not weaken the `landing` / `full` separation for convenience

If you are unsure between “more complete” and “more decisive,” pick “more decisive.”

## Files That Matter Most

Core product behavior:

- `src/lib/prompts.ts`
- `src/lib/schemas.ts`
- `src/lib/validation.ts`
- `src/lib/quality-gate.ts`
- `src/lib/app-config.ts`
- `src/app/api/analyze/route.ts`
- `src/components/landing-page.tsx`
- `src/components/idea-validator-app.tsx`
- `src/app/page.tsx`

Regression system:

- `prompt-eval/src/deterministic-eval.ts`
- `prompt-eval/src/run-case.ts`
- `prompt-eval/cases/prompt-cases.json`

If you change any of those, assume you are changing the product itself.

## Deployment Truth

Environment switches:

- `APP_MODE=landing|full`
- `ANALYZE_ENABLED=true|false`

Expected usage:

- production: `APP_MODE=landing`, `ANALYZE_ENABLED=false`
- protected tester preview: `APP_MODE=full`, `ANALYZE_ENABLED=true`

The branded access CTA points to `access@nextpitch.se`.
If external email routing is not yet configured, document that clearly rather than pretending it works.
