import {
  InitialResponseSchema,
  IterationResponseSchema,
  type InitialResponse,
  type IterationResponse,
} from "../../src/lib/schemas";
import { evaluateInitialQuality, evaluateIterationQuality } from "../../src/lib/quality-gate";

import type {
  DeterministicEvaluation,
  DeterministicTag,
  PromptCase,
} from "./types";
import { keywordTokens, normalizeText, overlapRatio, sentenceCount, unique } from "./utils";

const BLOCKER_TAGS = new Set<DeterministicTag>([
  "SCHEMA_INVALID",
  "AD_COPY_HOOKS",
  "MIRRORED_IDEA",
  "UNREALISTIC_TEST",
  "BAD_ITERATION_LOGIC",
  "LANGUAGE_GLITCH",
  "INCOMPLETE_OUTPUT",
  "PRE_MODEL_REJECTION",
]);

const BANNED_HOOK_PHRASES = [
  "revolutionize",
  "transform your workflow",
  "unlock productivity",
  "streamline operations",
  "cutting edge",
  "next gen",
  "innovative platform",
  "scalable ai",
  "seamlessly",
];

const GENERIC_ANGLE_PATTERNS = [
  "improve productivity",
  "help teams collaborate",
  "optimize workflows",
  "save time with ai",
  "simplify operations",
  "better productivity",
];

const UNREALISTIC_TEST_PATTERNS = [
  "run a full ad campaign",
  "build mvp first",
  "build an mvp first",
  "create a full product demo",
  "talk to 100 customers",
  "launch on product hunt",
];

const OPTIMISTIC_PATTERNS = [
  "great sign",
  "strong signal",
  "very promising",
  "clear demand",
  "people clearly want this",
];

const FAILURE_PATTERNS = ["generic", "crowded", "overdone", "familiar", "too broad", "failed"];
const PRACTICAL_PATTERNS = ["dm", "email", "outreach", "talk to", "message", "ask", "interview"];
const EMOTIONAL_PATTERNS = ["stress", "fight", "chaos", "tension", "argue", "texting"];
const OPERATIONAL_PATTERNS = [
  "monthly close",
  "deadline",
  "compliance",
  "inspection",
  "damage",
  "document",
  "revenue",
  "reminder",
  "certificate",
  "pricing bug",
  "safety",
];

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

function addTag(
  tags: Set<DeterministicTag>,
  reasons: string[],
  tag: DeterministicTag,
  reason: string,
) {
  tags.add(tag);
  reasons.push(reason);
}

function normalizedHooks(hooks: string[]) {
  return hooks.map((hook) => normalizeText(hook));
}

function hasNearDuplicateHooks(hooks: string[]) {
  const normalized = normalizedHooks(hooks);

  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      if (normalized[i] === normalized[j]) {
        return true;
      }

      const first = unique(keywordTokens(normalized[i]));
      const second = unique(keywordTokens(normalized[j]));
      if (!first.length || !second.length) {
        continue;
      }

      const shared = first.filter((token) => second.includes(token)).length;
      const similarity = shared / Math.max(first.length, second.length);
      if (similarity >= 0.8) {
        return true;
      }
    }
  }

  return false;
}

function containsBannedPhrase(value: string) {
  const lowered = normalizeText(value);
  return BANNED_HOOK_PHRASES.some((phrase) => lowered.includes(phrase));
}

function hasNewSpecificity(source: string, candidate: string) {
  const sourceTokens = unique(keywordTokens(source));
  const candidateTokens = unique(keywordTokens(candidate));

  if (!candidateTokens.length) {
    return false;
  }

  const newTokens = candidateTokens.filter(
    (token) =>
      !sourceTokens.some(
        (sourceToken) =>
          sourceToken === token ||
          sourceToken.startsWith(token) ||
          token.startsWith(sourceToken),
      ),
  );

  return newTokens.length >= 2;
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

function isGenericArtifact(value: string) {
  const lowered = normalizeText(value);

  if (containsBannedPhrase(lowered)) {
    return true;
  }

  return (
    sentenceCount(value) <= 2 &&
    /\b(revolutionize|transform|unlock|seamless|innovative|scalable)\b/.test(lowered)
  );
}

function evaluateInitialExpectations(
  testCase: PromptCase,
  response: InitialResponse,
  tags: Set<DeterministicTag>,
  reasons: string[],
) {
  const { expectations } = testCase;
  const reasonText = normalizeText(response.assessment.reason);
  const angleText = `${response.best_angle.title} ${response.best_angle.description}`;
  const testText = `${response.test.what_to_do} ${response.test.artifact_text} ${response.test.success_condition}`;

  if (
    expectations.expectedVerdictOneOf &&
    !expectations.expectedVerdictOneOf.includes(response.assessment.verdict)
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      `Verdict ${response.assessment.verdict} did not match expected values.`,
    );
  }

  if (
    expectations.mustFlagAsOverdone &&
    !FAILURE_PATTERNS.some((pattern) => reasonText.includes(pattern))
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected the assessment to call the idea overdone or generic.",
    );
  }

  if (
    expectations.mustRejectBuzzwordSoup &&
    !/buzzword|generic|vague|unclear/.test(reasonText)
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected buzzword-heavy input to be called out explicitly.",
    );
  }

  if (
    expectations.mustFlagCrowdedness &&
    !/crowded|overdone|commodity|generic|familiar/.test(reasonText)
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected the output to mention crowdedness or commodity risk.",
    );
  }

  if (
    expectations.mustFlagCommodity &&
    !/commodity|commoditized|overdone|crowded|generic/.test(reasonText)
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected the output to call out commodity risk.",
    );
  }

  if (
    expectations.mustCallTooBroad &&
    !/broad|narrow|generic|vague/.test(reasonText)
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected the output to call the idea too broad.",
    );
  }

  if (
    expectations.mustCallVagueTechnicalIdea &&
    !/vague|broad|generic|unclear/.test(reasonText)
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected the technical idea to be treated as vague or broad.",
    );
  }

  if (
    expectations.mustRejectLazyFraming &&
    !/lazy|generic|broad|real pain|trust|scheduling|density|overdone/.test(
      `${reasonText} ${normalizeText(angleText)}`,
    )
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected the output to push past lazy framing.",
    );
  }

  if (
    expectations.mustNotOverpraiseNovelty &&
    /brilliant|amazing|clever|unique opportunity/.test(reasonText)
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Novelty was praised too strongly without enough pain evidence.",
    );
  }

  if (
    expectations.mustAvoidMirroring &&
    overlapRatio(testCase.input.idea, angleText) >= 0.5 &&
    !hasNewSpecificity(testCase.input.idea, angleText)
  ) {
    addTag(
      tags,
      reasons,
      "MIRRORED_IDEA",
      "Best angle is too close to the original idea wording.",
    );
  }

  if (
    expectations.shouldNarrowToSpecificPain &&
    !/pain|waste|risk|fight|chaos|revenue|deadline|dispute|context/.test(
      normalizeText(angleText),
    )
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected the best angle to narrow to a more specific pain.",
    );
  }

  if (
    expectations.shouldPushTowardSharperProblem &&
    !/problem|pain|buyer|outcome|narrow/.test(
      normalizeText(`${response.assessment.reason} ${response.next_step.instruction}`),
    )
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected the output to push toward a sharper problem definition.",
    );
  }

  if (
    expectations.shouldRewardRecurringOperationalPain &&
    !OPERATIONAL_PATTERNS.some((pattern) =>
      normalizeText(`${angleText} ${testText}`).includes(normalizeText(pattern)),
    )
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected stronger operational pain recognition.",
    );
  }

  if (
    expectations.shouldRewardBoringB2B &&
    response.assessment.verdict !== "promising"
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected boring but painful B2B idea to be recognized as promising.",
    );
  }

  if (
    expectations.shouldEmphasizeOperationalPain &&
    !OPERATIONAL_PATTERNS.some((pattern) =>
      normalizeText(`${angleText} ${response.test.what_to_do}`).includes(
        normalizeText(pattern),
      ),
    )
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected stronger operational framing.",
    );
  }

  if (
    expectations.shouldRecognizeEmotionalAndOperationalPain &&
    !(
      EMOTIONAL_PATTERNS.some((pattern) =>
        normalizeText(angleText).includes(normalizeText(pattern)),
      ) &&
      /pickup|school|coordinate|schedule|text/.test(normalizeText(testText))
    )
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected both emotional and operational pain to show up.",
    );
  }

  if (
    expectations.shouldSuggestHumanArtifact &&
    !["post", "dm", "email", "outreach_script"].includes(response.test.artifact_type)
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected a human-sendable artifact type.",
    );
  }

  if (
    expectations.shouldSuggestPracticalTesting &&
    !PRACTICAL_PATTERNS.some((pattern) =>
      normalizeText(testText).includes(normalizeText(pattern)),
    )
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected the test suggestion to stay practical and direct.",
    );
  }

  if (
    expectations.shouldRecognizeRevenuePain &&
    !/revenue|loss|pricing|bug|cost/.test(normalizeText(angleText))
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected revenue pain to be part of the framing.",
    );
  }

  if (
    expectations.mustRespectNicheIfPainIsReal &&
    response.assessment.verdict !== "promising"
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected niche but painful idea to be treated seriously.",
    );
  }

  if (
    expectations.shouldGuideNotPraise &&
    /great idea|very promising|strong idea/.test(reasonText)
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected guidance, not praise, for a vague idea.",
    );
  }

  if (
    expectations.shouldNotInventConfidence &&
    /promising|strong|clear winner/.test(reasonText) &&
    response.assessment.verdict === "promising"
  ) {
    addTag(
      tags,
      reasons,
      "EXPECTATION_MISMATCH",
      "Expected the output to avoid invented confidence.",
    );
  }
}

function evaluateIterationExpectations(
  testCase: PromptCase,
  response: IterationResponse,
  tags: Set<DeterministicTag>,
  reasons: string[],
) {
  const { expectations } = testCase;
  const analysis = normalizeText(response.analysis);
  const nextStep = normalizeText(response.next_step);
  const newAngle = normalizeText(response.new_angle);
  const previousAngle = normalizeText(
    testCase.input.mode === "iteration" ? testCase.input.previous_angle : "",
  );

  if (expectations.mustInterpretFailure && !FAILURE_PATTERNS.some((pattern) => analysis.includes(pattern))) {
    addTag(
      tags,
      reasons,
      "BAD_ITERATION_LOGIC",
      "Expected a clearer interpretation of failure.",
    );
  }

  if (
    expectations.mustNotSoundOptimistic &&
    OPTIMISTIC_PATTERNS.some((pattern) => analysis.includes(pattern))
  ) {
    addTag(
      tags,
      reasons,
      "BAD_ITERATION_LOGIC",
      "Failure case sounded too optimistic.",
    );
  }

  if (
    expectations.mustRefineNotCelebrate &&
    OPTIMISTIC_PATTERNS.some((pattern) => analysis.includes(pattern))
  ) {
    addTag(
      tags,
      reasons,
      "BAD_ITERATION_LOGIC",
      "Partial-signal case sounded celebratory instead of refined.",
    );
  }

  if (
    expectations.mustDoubleDown &&
    !/demo|interview|specific|narrow|double down|firm|buyer/.test(
      `${analysis} ${nextStep}`,
    )
  ) {
    addTag(
      tags,
      reasons,
      "BAD_ITERATION_LOGIC",
      "Strong-signal case did not clearly double down.",
    );
  }

  if (
    expectations.shouldNarrowHarder &&
    overlapRatio(previousAngle, newAngle) >= 0.5
  ) {
    addTag(
      tags,
      reasons,
      "BAD_ITERATION_LOGIC",
      "No-signal case did not narrow hard enough.",
    );
  }

  if (
    expectations.shouldSharpenEmotionalOrOperationalAngle &&
    !(
      EMOTIONAL_PATTERNS.some((pattern) => newAngle.includes(normalizeText(pattern))) ||
      OPERATIONAL_PATTERNS.some((pattern) => newAngle.includes(normalizeText(pattern)))
    )
  ) {
    addTag(
      tags,
      reasons,
      "BAD_ITERATION_LOGIC",
      "Expected sharper emotional or operational tension on iteration.",
    );
  }

  if (
    expectations.shouldGetMoreSpecific &&
    keywordTokens(response.new_angle).length <= keywordTokens(previousAngle).length
  ) {
    addTag(
      tags,
      reasons,
      "BAD_ITERATION_LOGIC",
      "Expected the new angle to get more specific.",
    );
  }
}

function buildEvaluation(
  tags: Set<DeterministicTag>,
  reasons: string[],
  options: {
    expectedRejection?: boolean;
    unexpectedRejection?: boolean;
  } = {},
): DeterministicEvaluation {
  const uniqueTags = [...tags];
  const blocker = uniqueTags.some((tag) => BLOCKER_TAGS.has(tag));

  return {
    pass: uniqueTags.length === 0,
    blocker,
    tags: uniqueTags,
    reasons,
    expectedRejection: options.expectedRejection ?? false,
    unexpectedRejection: options.unexpectedRejection ?? false,
  };
}

export function evaluateRejectedCase(
  testCase: PromptCase,
  errorMessage: string,
): DeterministicEvaluation {
  const tags = new Set<DeterministicTag>();
  const reasons: string[] = [];

  if (testCase.expectations.shouldRejectBeforeModel) {
    tags.add("EXPECTED_REJECTION");
    reasons.push(`Expected rejection before model execution: ${errorMessage}`);

    if (testCase.expectations.expectedError && errorMessage !== testCase.expectations.expectedError) {
      addTag(
        tags,
        reasons,
        "EXPECTATION_MISMATCH",
        `Expected rejection message "${testCase.expectations.expectedError}" but got "${errorMessage}".`,
      );
    }
    return {
      pass: !tags.has("EXPECTATION_MISMATCH"),
      blocker: false,
      tags: [...tags],
      reasons,
      expectedRejection: true,
      unexpectedRejection: false,
    };
  } else {
    addTag(
      tags,
      reasons,
      "PRE_MODEL_REJECTION",
      `The case was rejected before model execution: ${errorMessage}`,
    );
  }

  return buildEvaluation(tags, reasons, { unexpectedRejection: true });
}

export function evaluateDeterministically(
  testCase: PromptCase,
  output: unknown,
): DeterministicEvaluation {
  const tags = new Set<DeterministicTag>();
  const reasons: string[] = [];

  if (testCase.mode === "initial") {
    const parsed = InitialResponseSchema.safeParse(output);
    if (!parsed.success) {
      addTag(tags, reasons, "SCHEMA_INVALID", "Initial response failed schema validation.");
      return buildEvaluation(tags, reasons);
    }

    const response = parsed.data;
    const productionTags = evaluateInitialQuality(testCase.input, response);
    productionTags.forEach((tag) => {
      addTag(tags, reasons, tag as DeterministicTag, `Production quality gate flagged ${tag}.`);
    });

    if (response.other_angles.length !== 2 || response.hooks.length !== 5) {
      addTag(tags, reasons, "COUNT_INVALID", "Initial output counts are wrong.");
    }

    if (hasNearDuplicateHooks(response.hooks)) {
      addTag(tags, reasons, "DUPLICATE_HOOKS", "Hooks are duplicated or near-duplicated.");
    }

    if (response.hooks.some((hook) => containsBannedPhrase(hook))) {
      addTag(tags, reasons, "AD_COPY_HOOKS", "Hooks contain banned ad-copy phrases.");
    }

    if (isGenericArtifact(response.test.artifact_text)) {
      addTag(tags, reasons, "GENERIC_ARTIFACT", "Artifact reads like generic marketing copy.");
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
      addTag(tags, reasons, "LANGUAGE_GLITCH", "Output contains unexpected non-Latin text.");
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
      addTag(tags, reasons, "INCOMPLETE_OUTPUT", "Output contains truncated or unfinished text.");
    }

    const angleText = `${response.best_angle.title} ${response.best_angle.description}`;
    if (
      GENERIC_ANGLE_PATTERNS.some((pattern) =>
        normalizeText(angleText).includes(normalizeText(pattern)),
      )
    ) {
      addTag(tags, reasons, "GENERIC_ANGLE", "Best angle is too generic.");
    }

    const testText = `${response.test.what_to_do} ${response.test.artifact_text} ${response.test.success_condition}`;
    if (
      UNREALISTIC_TEST_PATTERNS.some((pattern) =>
        normalizeText(testText).includes(normalizeText(pattern)),
      )
    ) {
      addTag(tags, reasons, "UNREALISTIC_TEST", "Test suggestion is unrealistic for v1.");
    }

    if (!SUCCESS_THRESHOLD_PATTERN.test(response.test.success_condition)) {
      addTag(
        tags,
        reasons,
        "UNREALISTIC_TEST",
        "Initial test is missing an explicit success threshold.",
      );
    }

    evaluateInitialExpectations(testCase, response, tags, reasons);
  } else {
    const parsed = IterationResponseSchema.safeParse(output);
    if (!parsed.success) {
      addTag(tags, reasons, "SCHEMA_INVALID", "Iteration response failed schema validation.");
      return buildEvaluation(tags, reasons);
    }

    const response = parsed.data;
    const productionTags = evaluateIterationQuality(testCase.input, response);
    productionTags.forEach((tag) => {
      addTag(tags, reasons, tag as DeterministicTag, `Production quality gate flagged ${tag}.`);
    });

    if (response.hooks.length !== 3) {
      addTag(tags, reasons, "COUNT_INVALID", "Iteration hook count is wrong.");
    }

    if (hasNearDuplicateHooks(response.hooks)) {
      addTag(tags, reasons, "DUPLICATE_HOOKS", "Hooks are duplicated or near-duplicated.");
    }

    if (response.hooks.some((hook) => containsBannedPhrase(hook))) {
      addTag(tags, reasons, "AD_COPY_HOOKS", "Hooks contain banned ad-copy phrases.");
    }

    if (
      hasLanguageGlitch([
        response.analysis,
        response.new_angle,
        ...response.hooks,
        response.next_step,
      ])
    ) {
      addTag(tags, reasons, "LANGUAGE_GLITCH", "Output contains unexpected non-Latin text.");
    }

    if (
      hasIncompleteOutput([
        { value: response.analysis, requirePunctuation: true },
        { value: response.next_step, requirePunctuation: true },
        ...response.hooks.map((hook) => ({ value: hook })),
      ])
    ) {
      addTag(tags, reasons, "INCOMPLETE_OUTPUT", "Output contains truncated or unfinished text.");
    }

    if (
      GENERIC_ANGLE_PATTERNS.some((pattern) =>
        normalizeText(response.new_angle).includes(normalizeText(pattern)),
      )
    ) {
      addTag(tags, reasons, "GENERIC_ANGLE", "New angle is too generic.");
    }

    if (
      testCase.input.mode === "iteration" &&
      testCase.input.result === "none" &&
      OPTIMISTIC_PATTERNS.some((pattern) =>
        normalizeText(`${response.analysis} ${response.next_step}`).includes(
          normalizeText(pattern),
        ),
      )
    ) {
      addTag(tags, reasons, "BAD_ITERATION_LOGIC", "No-signal case sounded too optimistic.");
    }

    if (testCase.input.mode === "iteration" && testCase.input.result === "none") {
      const scopeText = `${response.new_angle} ${response.next_step}`;
      const failureText = `${response.analysis} ${response.new_angle}`;

      if (
        !ROLE_PATTERN.test(scopeText) ||
        !MOMENT_PATTERN.test(scopeText) ||
        !FAILURE_EVENT_PATTERN.test(failureText)
      ) {
        addTag(
          tags,
          reasons,
          "BAD_ITERATION_LOGIC",
          "No-signal case must narrow to one role, one moment, and one concrete failure event.",
        );
      }

      if (VAGUE_TEST_PATTERN.test(response.next_step) && !EVIDENCE_SIGNAL_PATTERN.test(response.next_step)) {
        addTag(
          tags,
          reasons,
          "BAD_ITERATION_LOGIC",
          "No-signal case should ask for a factual signal, not a vague opinion.",
        );
      }

      if (!SUCCESS_THRESHOLD_PATTERN.test(response.next_step)) {
        addTag(
          tags,
          reasons,
          "BAD_ITERATION_LOGIC",
          "Iteration test is missing an explicit success threshold.",
        );
      }
    }

    evaluateIterationExpectations(testCase, response, tags, reasons);
  }

  return buildEvaluation(tags, reasons);
}
