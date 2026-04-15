import type {
  AnalyzeRequest,
  InitialResponse,
  IterationResponse,
} from "../../src/lib/schemas";

export type EvalRequest = AnalyzeRequest;
export type EvalResponse = InitialResponse | IterationResponse;

export type PromptCaseExpectation = {
  expectedVerdictOneOf?: Array<"weak" | "promising" | "unclear">;
  expectedError?: string;
  allowB2BPositiveBias?: boolean;
  mustAvoidMirroring?: boolean;
  mustCallTooBroad?: boolean;
  mustCallVagueTechnicalIdea?: boolean;
  mustDoubleDown?: boolean;
  mustFlagAsOverdone?: boolean;
  mustFlagCommodity?: boolean;
  mustFlagCrowdedness?: boolean;
  mustNotOverpraiseNovelty?: boolean;
  mustNotSoundOptimistic?: boolean;
  mustRefineNotCelebrate?: boolean;
  mustRejectBuzzwordSoup?: boolean;
  mustRejectLazyFraming?: boolean;
  mustRespectNicheIfPainIsReal?: boolean;
  mustTriggerAdCopySensitivity?: boolean;
  mustInterpretFailure?: boolean;
  shouldDoubleDown?: boolean;
  shouldEmphasizeOperationalPain?: boolean;
  shouldGetMoreSpecific?: boolean;
  shouldGuideNotPraise?: boolean;
  shouldNarrowHarder?: boolean;
  shouldNarrowToSpecificPain?: boolean;
  shouldNotBeRejectedAsWallOfText?: boolean;
  shouldNotInventConfidence?: boolean;
  shouldPushTowardSharperProblem?: boolean;
  shouldRecognizeEmotionalAndOperationalPain?: boolean;
  shouldRecognizeRevenuePain?: boolean;
  shouldRefineNotCelebrate?: boolean;
  shouldRejectBeforeModel?: boolean;
  shouldRewardBoringB2B?: boolean;
  shouldRewardRecurringOperationalPain?: boolean;
  shouldSharpenEmotionalOrOperationalAngle?: boolean;
  shouldSuggestHumanArtifact?: boolean;
  shouldSuggestPracticalTesting?: boolean;
};

export type PromptCase = {
  id: string;
  mode: EvalRequest["mode"];
  input: EvalRequest;
  expectations: PromptCaseExpectation;
};

export type DeterministicTag =
  | "SCHEMA_INVALID"
  | "COUNT_INVALID"
  | "DUPLICATE_HOOKS"
  | "AD_COPY_HOOKS"
  | "MIRRORED_IDEA"
  | "GENERIC_ANGLE"
  | "UNREALISTIC_TEST"
  | "BAD_ITERATION_LOGIC"
  | "GENERIC_ARTIFACT"
  | "LANGUAGE_GLITCH"
  | "INCOMPLETE_OUTPUT"
  | "EXPECTATION_MISMATCH"
  | "EXPECTED_REJECTION"
  | "PRE_MODEL_REJECTION";

export type DeterministicEvaluation = {
  pass: boolean;
  blocker: boolean;
  tags: DeterministicTag[];
  reasons: string[];
  expectedRejection: boolean;
  unexpectedRejection: boolean;
};

export type JudgeScores = {
  usefulness: number;
  specificity: number;
  decisiveness: number;
  actionability: number;
  genericness_reversed: number;
  trust_to_act: number;
};

export type JudgeResult = {
  pass: boolean;
  scores: JudgeScores;
  reason: string;
  biggest_problem: string;
  one_fix: string;
};

export type PromptAttempt = {
  stage: "initial" | "repair";
  rawOutputText: string;
  parsedOutput: EvalResponse | null;
  deterministic: DeterministicEvaluation | null;
  error?: string;
};

export type PromptCaseResult = {
  id: string;
  mode: PromptCase["mode"];
  input: EvalRequest;
  expectations: PromptCaseExpectation;
  rejectedBeforeModel: boolean;
  validationError?: string;
  attempts: PromptAttempt[];
  finalOutput: EvalResponse | null;
  deterministic: DeterministicEvaluation;
  judge: JudgeResult | null;
  pass: boolean;
  notes: string[];
};

export type EvalSummary = {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  schemaFailures: number;
  genericFailures: number;
  mirroredIdeaFailures: number;
  badHooksFailures: number;
  unrealisticTestFailures: number;
  weakIterationFailures: number;
  blockerCounts: Record<string, number>;
  overallPass: boolean;
};

export type EvalReport = {
  metadata: {
    generatedAt: string;
    model: string;
    judgeModel: string | null;
    runJudge: boolean;
    caseFilter: string | null;
  };
  summary: EvalSummary;
  results: PromptCaseResult[];
};
