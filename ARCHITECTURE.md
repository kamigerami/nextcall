# Current Architecture

## Summary

NextPitch now has two distinct runtime surfaces:

- a public landing page used in production
- a private analyzer surface used in protected preview

The analyzer itself is still the same product: a strict two-step startup decision loop with structured output and no chat framing.

## Runtime Model

Configuration is resolved in [`src/lib/app-config.ts`](./src/lib/app-config.ts).

Environment variables:

- `APP_MODE=landing|full`
- `ANALYZE_ENABLED=true|false`
- `NEXT_PUBLIC_REQUEST_ACCESS_EMAIL=...` optional, defaults to `access@nextpitch.se`

Resolution rules:

- missing or invalid `APP_MODE` falls back to `landing`
- `ANALYZE_ENABLED` is only true when the env var is exactly `true`
- the public request-access email defaults to the branded inbox

## Surface Split

### `landing`

Rendered by [`src/components/landing-page.tsx`](./src/components/landing-page.tsx).

Purpose:

- explain what the product does
- show the demo video as the main proof layer
- present one example output excerpt
- make access request manual and explicit

Characteristics:

- no analyzer tabs
- no analyzer form
- no public product interaction beyond the CTA

### `full`

Rendered by [`src/components/idea-validator-app.tsx`](./src/components/idea-validator-app.tsx).

Purpose:

- run the real product loop
- preserve the current `initial` and `iteration` workflows

The top-level route switch lives in [`src/app/page.tsx`](./src/app/page.tsx). The analyzer is only imported in `full` mode so the landing path stays clean.

## API Access Control

The only product API route is [`src/app/api/analyze/route.ts`](./src/app/api/analyze/route.ts).

Guard order:

1. resolve runtime config
2. if `APP_MODE !== "full"`, return `404`
3. if `ANALYZE_ENABLED !== true`, return `503`
4. only then continue to rate limit, parse, validate, and call OpenAI

Blocked responses:

- include `x-nextpitch-blocked: true`
- log a reason code:
  - `blocked:mode`
  - `blocked:analyze_disabled`

This means production never reaches validation, rate limiting, or OpenAI model calls.

## Product Internals

Analyzer internals remain unchanged in structure:

- prompts: [`src/lib/prompts.ts`](./src/lib/prompts.ts)
- schemas: [`src/lib/schemas.ts`](./src/lib/schemas.ts)
- input validation: [`src/lib/validation.ts`](./src/lib/validation.ts)
- output quality gate: [`src/lib/quality-gate.ts`](./src/lib/quality-gate.ts)
- rate limiting: [`src/lib/rate-limit.ts`](./src/lib/rate-limit.ts)

The product loop is still:

1. `initial`
2. `iteration`

## Assets

The landing demo is served from:

- canonical render output: `out/nextpitch-demo.mp4`
- published web asset: `public/demo/nextpitch-demo.mp4`

The landing currently embeds the published asset directly in a native `<video>` element.

## Deployment Model

Recommended deployment split:

- production:
  - `APP_MODE=landing`
  - `ANALYZE_ENABLED=false`
- protected tester preview:
  - `APP_MODE=full`
  - `ANALYZE_ENABLED=true`
  - Vercel deployment protection enabled
  - share access via Vercel protection-bypass links

## Email Access Flow

The public CTA uses:

- `mailto:access@nextpitch.se`

Intended routing:

- branded inbox: `access@nextpitch.se`
- destination inbox: `kami.gerami@codelabs.se`

This routing depends on Cloudflare Email Routing for `nextpitch.se`. If it has not been configured yet, the code still points to the branded inbox, but the infrastructure should be treated as pending.

## Verification

Current focused checks:

- `npm run lint`
- `npm test`
- `npm run build`

Additional product checks:

- run prompt eval when changing prompts, schemas, validation, or quality-gate behavior
- verify the landing path does not show analyzer UI
- verify the public API path blocks before paid model work
