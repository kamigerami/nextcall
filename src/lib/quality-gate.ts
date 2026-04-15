import type {
  InitialRequest,
  InitialResponse,
  IterationRequest,
  IterationResponse,
} from "@/lib/schemas";

export const QUALITY_TAGS = [
  "GENERIC_ANGLE",
  "BROAD_IDEA",
  "BAD_HOOKS",
  "UNREALISTIC_TEST",
  "MIRRORED_IDEA",
  "LANGUAGE_GLITCH",
  "BAD_ITERATION_LOGIC",
  "INCOMPLETE_OUTPUT",
] as const;

export type QualityTag = (typeof QUALITY_TAGS)[number];

const GENERIC_PHRASES = [
  "revolutionize",
  "unlock productivity",
  "seamless",
  "at scale",
  "streamline",
  "transform",
  "innovative platform",
  "ai-powered solution",
];

const BAD_TEST_PATTERNS = [
  "build an mvp",
  "full gtm",
  "big ad campaign",
  "run ads",
  "create 20 assets",
];

const STARTUP_NOISE = new Set([
  "ai",
  "tool",
  "app",
  "platform",
  "software",
  "startup",
  "solution",
  "helps",
  "help",
  "that",
  "with",
  "for",
  "the",
  "and",
  "to",
  "of",
  "a",
  "an",
  "better",
  "more",
]);

const NON_LATIN_SCRIPT_PATTERN =
  /[\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u4E00-\u9FFF\u3040-\u30FF]/u;
const INCOMPLETE_ENDING_PATTERN = /(?:[,:;\-\/]|["'”“‘’(])\s*$/u;
const TRAILING_FRAGMENT_PATTERN =
  /\b(?:and|or|to|for|with|in|on|at|by|from|of|a|an|the|it|this|that|because|if|when|then|but|so|as|into|about|around|whether|who|what|why|how|re)\s*$/i;
const ROLE_PATTERN =
  /\b(pm|product managers?|ops|operator|operators|founders?|team leads?|engineering managers?|controllers?|accountants?|property managers?|parents?|studio owners?|subcontractors?|ecommerce teams?|creators?|marketers?|recruiters?|hr|admins?)\b/i;
const MOMENT_PATTERN =
  /\b(after|during|before|when|month[- ]end|close|deadline|standup|handoff|pickup|inspection|thread|threads|channel|channels|meeting|checkout|review)\b/i;
const FAILURE_EVENT_PATTERN =
  /\b(miss|missed|late|blamed|buried|dropped|forgot|forgotten|lost|delay|delayed|stalled|ignored|expired|confusion|wrong owner|no owner)\b/i;
const EVIDENCE_SIGNAL_PATTERN =
  /\b(last time|most recent|when did|yes\/no|reply yes|reply no|send me one|show me one|recent example|last happened)\b/i;
const VAGUE_TEST_PATTERN = /\b(ask if|see if|find out if|whether they|would they|is this painful)\b/i;
const SUCCESS_THRESHOLD_PATTERN =
  /\b(if|at least|fewer than|less than|more than|minimum|kill it|continue|proceed|stop|pass|fail)\b.*\b(\d+\/\d+|\d+ out of \d+|\d+)\b/i;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function keywords(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STARTUP_NOISE.has(token));
}

function fuzzyMatch(a: string, b: string) {
  if (a === b) {
    return true;
  }

  if (a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5)) {
    return true;
  }

  return a.startsWith(b) || b.startsWith(a);
}

function overlapRatio(a: string, b: string) {
  const source = keywords(a);
  const candidate = keywords(b);

  if (!source.length || !candidate.length) {
    return 0;
  }

  const shared = candidate.filter((token) =>
    source.some((sourceToken) => fuzzyMatch(sourceToken, token)),
  );

  return shared.length / candidate.length;
}

function hasNewSpecificity(source: string, candidate: string) {
  const sourceTokens = keywords(source);
  const candidateTokens = keywords(candidate);

  if (!candidateTokens.length) {
    return false;
  }

  const newTokens = candidateTokens.filter(
    (token) => !sourceTokens.some((sourceToken) => fuzzyMatch(sourceToken, token)),
  );

  return newTokens.length >= 2;
}

function hasGenericPhrase(value: string) {
  const lowered = normalize(value);
  return GENERIC_PHRASES.some((phrase) => lowered.includes(phrase));
}

function hooksAreWeak(hooks: string[]) {
  const normalizedHooks = hooks.map(normalize);
  const uniqueHooks = new Set(normalizedHooks);

  if (uniqueHooks.size !== hooks.length) {
    return true;
  }

  return normalizedHooks.some((hook) => hasGenericPhrase(hook));
}

function hasLanguageGlitch(values: string[]) {
  return values.some((value) => NON_LATIN_SCRIPT_PATTERN.test(value));
}

function textLooksIncomplete(value: string, requirePunctuation = false) {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  if (INCOMPLETE_ENDING_PATTERN.test(trimmed) || TRAILING_FRAGMENT_PATTERN.test(trimmed)) {
    return true;
  }

  const quoteCount = (trimmed.match(/["“”]/g) ?? []).length;
  if (quoteCount % 2 === 1) {
    return true;
  }

  return requirePunctuation && trimmed.split(/\s+/).length >= 8 && !/[.!?]["'”’)]?$/.test(trimmed);
}

function hasIncompleteOutput(values: Array<{ value: string; requirePunctuation?: boolean }>) {
  return values.some(({ value, requirePunctuation }) =>
    textLooksIncomplete(value, requirePunctuation),
  );
}

export function evaluateInitialQuality(
  request: InitialRequest,
  response: InitialResponse,
): QualityTag[] {
  const tags = new Set<QualityTag>();
  const angleText = `${response.best_angle.title} ${response.best_angle.description}`;
  const mirroredScore = overlapRatio(request.idea, angleText);

  if (mirroredScore >= 0.5 && !hasNewSpecificity(request.idea, angleText)) {
    tags.add("MIRRORED_IDEA");
  }

  if (
    hasGenericPhrase(angleText) ||
    /\b(ai tool|app for|platform for|software for)\b/i.test(angleText)
  ) {
    tags.add("GENERIC_ANGLE");
  }

  if (
    /\b(everyone|all teams|all businesses|anyone)\b/i.test(angleText) ||
    response.assessment.reason.toLowerCase().includes("many possibilities")
  ) {
    tags.add("BROAD_IDEA");
  }

  if (hooksAreWeak(response.hooks)) {
    tags.add("BAD_HOOKS");
  }

  const testText = `${response.test.what_to_do} ${response.test.artifact_text}`.toLowerCase();
  if (BAD_TEST_PATTERNS.some((pattern) => testText.includes(pattern))) {
    tags.add("UNREALISTIC_TEST");
  }

  if (!SUCCESS_THRESHOLD_PATTERN.test(response.test.success_condition)) {
    tags.add("UNREALISTIC_TEST");
  }

  if (
    hasLanguageGlitch([
      response.best_angle.title,
      response.best_angle.description,
      ...response.hooks,
      response.test.artifact_text,
      response.next_step.instruction,
      response.next_step.why,
    ])
  ) {
    tags.add("LANGUAGE_GLITCH");
  }

  if (
    hasIncompleteOutput([
      { value: response.assessment.reason, requirePunctuation: true },
      { value: response.best_angle.description, requirePunctuation: true },
      { value: response.test.what_to_do, requirePunctuation: true },
      { value: response.test.artifact_text, requirePunctuation: true },
      { value: response.test.success_condition, requirePunctuation: true },
      { value: response.next_step.instruction, requirePunctuation: true },
      { value: response.next_step.why, requirePunctuation: true },
      ...response.hooks.map((hook) => ({ value: hook })),
    ])
  ) {
    tags.add("INCOMPLETE_OUTPUT");
  }

  return [...tags];
}

export function evaluateIterationQuality(
  request: IterationRequest,
  response: IterationResponse,
): QualityTag[] {
  const tags = new Set<QualityTag>();
  const mirroredScore = overlapRatio(request.previous_angle, response.new_angle);

  if (mirroredScore >= 0.5 && !hasNewSpecificity(request.previous_angle, response.new_angle)) {
    tags.add("MIRRORED_IDEA");
  }

  if (hasGenericPhrase(response.new_angle)) {
    tags.add("GENERIC_ANGLE");
  }

  if (/\banyone|everyone|all teams\b/i.test(response.new_angle)) {
    tags.add("BROAD_IDEA");
  }

  if (hooksAreWeak(response.hooks)) {
    tags.add("BAD_HOOKS");
  }

  if (BAD_TEST_PATTERNS.some((pattern) => response.next_step.toLowerCase().includes(pattern))) {
    tags.add("UNREALISTIC_TEST");
  }

  if (
    hasLanguageGlitch([
      response.analysis,
      response.new_angle,
      ...response.hooks,
      response.next_step,
    ])
  ) {
    tags.add("LANGUAGE_GLITCH");
  }

  if (
    hasIncompleteOutput([
      { value: response.analysis, requirePunctuation: true },
      { value: response.new_angle },
      { value: response.next_step, requirePunctuation: true },
      ...response.hooks.map((hook) => ({ value: hook })),
    ])
  ) {
    tags.add("INCOMPLETE_OUTPUT");
  }

  if (request.result === "none") {
    const scopeText = `${response.new_angle} ${response.next_step}`;
    const failureText = `${response.analysis} ${response.new_angle}`;

    if (
      !ROLE_PATTERN.test(scopeText) ||
      !MOMENT_PATTERN.test(scopeText) ||
      !FAILURE_EVENT_PATTERN.test(failureText)
    ) {
      tags.add("BAD_ITERATION_LOGIC");
    }

    if (VAGUE_TEST_PATTERN.test(response.next_step) && !EVIDENCE_SIGNAL_PATTERN.test(response.next_step)) {
      tags.add("BAD_ITERATION_LOGIC");
    }

    if (!SUCCESS_THRESHOLD_PATTERN.test(response.next_step)) {
      tags.add("BAD_ITERATION_LOGIC");
    }
  }

  return [...tags];
}
