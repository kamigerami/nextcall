# Historical Plan: Build The Decision Loop v1

This file is the original implementation plan for the first version of the product.

It is no longer the best source of truth for the current system.

For the live architecture and deployment model, see:

- `README.md`
- `ARCHITECTURE.md`
- `AGENTS.md`

**Summary**
- Build a public, single-screen `Next.js` App Router app that helps founders answer one question: what should I test next?
- Keep the product as a strict two-step loop:
  1. `initial` idea validation
  2. `iteration` after real-world feedback
- Build in this order:
  1. prompt + schema
  2. brutal test suite
  3. UI polish
- The core v1 question is: will strangers trust the output enough to copy the artifact and run the loop again?

**Implementation Changes**
- UI:
  - One page, two modes: `Validate idea` and `Refine after test`
  - No transcript, no chat framing, no raw JSON, no dashboard language
  - The result hierarchy must be visually explicit in this order:
    - `Verdict`
    - `Best angle`
    - `Test this`
    - `Use this artifact`
  - Everything else is secondary
  - Use `localStorage` only for:
    - current mode
    - latest inputs
    - latest result payload
- API:
  - One route: `POST /api/analyze`
  - Discriminated input contract on `mode`
  - Normalize the `test` shape so the frontend never has to infer artifact type:
    - `what_to_do`
    - `where`
    - `artifact_type`
    - `artifact_text`
  - Constrain `artifact_type` to:
    - `post`
    - `dm`
    - `email`
    - `outreach_script`
- File layout:
  - `schemas.ts`
  - `prompts.ts`
  - `app/api/analyze/route.ts`
  - `rate-limit.ts`
  - `quality-gate.ts`
- Prompt behavior:
  - Use `gpt-5.4-mini` with Structured Outputs
  - Encode these explicit rules:
    - `If your answer could apply to 1000 startup ideas, it is too generic.`
    - `Do not simply rewrite the idea more cleanly. Sharpen it or reject it.`
    - `If the input is novel but pain is weak, do not overpraise it.`
    - `Do not penalize boring ideas if the pain is recurring and tied to budget or deadlines.`
    - `A realistic test is better than an impressive one.`
    - `Hooks must not be near-duplicates of each other.`
    - `At least one hook should emphasize pain, one should emphasize consequence, and one should create tension.`
    - `If hooks sound like ad copy, reject and rewrite them.`
  - The model must always make a call or reject cleanly
  - Keep exact output counts for v1:
    - `initial`: exactly 2 `other_angles`, exactly 5 `hooks`
    - `iteration`: exactly 3 `hooks`
- Input validation before model call:
  - Reject empty, ultra-short, placeholder, buzzword-soup, and truly unusable wall-of-text inputs
  - Hard max lengths:
    - `idea`: 500 chars max
    - `notes`: 500 chars max
  - Minimum useful input heuristic:
    - allow short but concrete inputs
    - reject only when the idea has no usable clue about buyer, pain, workflow, or willingness to pay
  - Wall-of-text handling:
    - reject if over 500 chars
    - treat newline-heavy formatting as a signal, not an automatic failure
    - reject when the input is long plus generic plus missing concrete buyer or pain
  - Tighten iteration handling:
    - if `result = none` and `previous_angle` is weak, require meaningful `notes`
  - Use deterministic errors:
    - `Too vague. Name the buyer, pain, or price.`
    - `Too broad. Narrow to one user and one outcome.`
    - `Not enough context. Say what you tested and what happened.`
    - `This reads like buzzwords, not a problem. Make it concrete.`
- Server-side quality gate:
  - Keep it simple and debuggable
  - Generate once, then score:
    - generic?
    - too broad?
    - test unrealistic?
    - angle not sharper?
    - hooks sound like ad copy or startup clichés?
    - output mirrors the input instead of sharpening it?
  - Return internal failure tags for debugging:
    - `GENERIC_ANGLE`
    - `BROAD_IDEA`
    - `BAD_HOOKS`
    - `UNREALISTIC_TEST`
    - `MIRRORED_IDEA`
  - If weak, regenerate once with stricter instruction
  - If still weak, fail with:
    - `No usable answer. Make the idea more concrete: who it is for, what pain it solves, or what someone would pay for.`
- Access and protection:
  - Public, no auth
  - Upstash Redis rate limit at `8 requests / 10 minutes / IP`
- Visuals:
  - Run `npx getdesign@latest add vercel`
  - Use the generated `DESIGN.md` only as visual scaffolding
  - Keep the interface sharp, sparse, and clearly non-chat-like

**Behavior Rules**
- The model must pick one strongest angle, not list equal options.
- Weak, broad, overdone, or buzzword-heavy ideas should be called out directly.
- Novelty alone is not a positive signal.
- Boring B2B ideas should score well if the pain is recurring, operational, and budget-linked.
- Iteration mode must interpret the signal:
  - `none`: the angle likely failed; narrow harder
  - `some`: there is signal, but framing is weak; refine
  - `strong`: double down and get more specific

**Test Plan**
- Functional:
  - Validate schema parsing, deterministic rejection, max-length enforcement, heuristic minimum-useful-input checks, and `none`-mode notes validation
  - Validate `artifact_type` enum enforcement
  - Validate `400`, `429`, and model failure behavior
  - Validate `localStorage` continuity across refresh without storing history
  - Validate copy actions for hooks and the normalized artifact
- Product QA:
  - Run the 20 supplied brutal test cases as the acceptance suite
  - Treat generic hooks, fake confidence, weak rejection, bland iteration logic, mirrored wording, and ad-copy hooks as blockers
  - Manually score outputs for usefulness, specificity, decisiveness, and actionability; keep originality secondary
  - Add a required QA checkbox:
    - `Would I post/send this as-is? Yes / No`
- Product metrics for v1:
  - submit-to-result completion rate
  - result-to-copy-artifact completion rate
  - percent of sessions that start a second run
  - time from first submission to first iteration submission
  - distribution of `none` / `some` / `strong` in iteration mode
- Success bar:
  - users know what to test next without reading long prose
  - the artifact is concrete enough to send without rewriting
  - the second run feels obvious
- Kill condition:
  - if fewer than 15–20% of result viewers start a second run after a fair amount of traffic, kill or rethink the product

**Assumptions**
- v1 is testing whether strangers trust the loop enough to act, not building a moat yet.
- No auth, no database persistence, no saved projects, no agent workflow, no memory layer.
- `localStorage` is included only to prevent cheap-feeling refresh loss.
- Prompt quality iteration remains active after implementation; structurally correct but emotionally dead output is the main risk to watch.
