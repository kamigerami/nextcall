import {
  AnalyzeRequestSchema,
  type AnalyzeRequest,
  type IterationRequest,
} from "@/lib/schemas";

export const MAX_IDEA_LENGTH = 500;
export const MAX_NOTES_LENGTH = 500;
const MIN_IDEA_LENGTH = 10;

const PLACEHOLDER_PATTERNS = [
  /^idea$/i,
  /^test$/i,
  /^startup idea$/i,
  /^something$/i,
  /^todo$/i,
  /^n\/a$/i,
  /^asdf/i,
];

const GENERIC_BUZZWORDS = [
  "ai-powered",
  "ai powered",
  "platform",
  "intelligent",
  "workflow",
  "optimization",
  "synergy",
  "seamless",
  "scalable",
  "revolutionary",
  "disruptive",
  "innovative",
  "solution",
  "empower",
  "productivity",
];

const SIGNAL_PATTERNS = {
  buyer:
    /\b(parents?|landlords?|tenants?|studios?|firms?|developers?|managers?|owners?|property managers?|subcontractors?|accountants?|recruiters?|agencies?|teachers?|students?|operators?)\b/i,
  pain:
    /\b(pain|waste|chaos|manual|slow|late|miss|forgot|forget|urgent|problem|expiry|risk|compliance|chasing|coordination|pickup|inspection|inventory|close|notes|friction)\b/i,
  workflow:
    /\b(handle|manage|track|coordinate|summari[sz](?:e|es|ed|ing)?|chase|inspect|reorder|schedule|collect|review|send|close|onboard|approve|turn(?:s|ed|ing)?|convert|repurpose|edit|clip(?:s|ped|ping)?|video(?:s)?)\b/i,
  value:
    /\b(pay|price|budget|revenue|cost|invoice|deadline|fine|monthly close|renewal)\b/i,
};

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function countMatches(input: string, terms: string[]) {
  return terms.reduce(
    (count, term) => count + (input.includes(term) ? 1 : 0),
    0,
  );
}

export function hasUsefulIdeaSignal(input: string) {
  const normalized = normalize(input);

  return Object.values(SIGNAL_PATTERNS).some((pattern) => pattern.test(normalized));
}

function isPlaceholder(input: string) {
  const normalized = normalize(input);
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isBuzzwordSoup(input: string) {
  const lowered = normalize(input).toLowerCase();
  const hasConcreteBuyer = SIGNAL_PATTERNS.buyer.test(lowered);
  const hasConcretePain = SIGNAL_PATTERNS.pain.test(lowered);
  const hasConcreteValue = SIGNAL_PATTERNS.value.test(lowered);

  return (
    countMatches(lowered, GENERIC_BUZZWORDS) >= 3 &&
    !(hasConcreteBuyer || hasConcretePain || hasConcreteValue)
  );
}

function isManifesto(input: string) {
  return input.length > 350 && input.split("\n").length >= 5;
}

function isWeakAngle(previousAngle: string) {
  const lowered = normalize(previousAngle).toLowerCase();
  return (
    lowered.length < 24 ||
    /better productivity|more efficient|save time|better workflow|improve operations/.test(
      lowered,
    )
  );
}

export function validateAnalyzeRequest(
  payload: unknown,
): { ok: true; data: AnalyzeRequest } | { ok: false; message: string } {
  const parsed = AnalyzeRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Too vague. Name the buyer, pain, or price.",
    };
  }

  const data = parsed.data;
  const idea = normalize(data.idea);

  if (data.mode === "iteration") {
    const iterationValidation = validateIterationRequest({
      ...data,
      idea,
    });

    if (!iterationValidation.ok) {
      return iterationValidation;
    }
  }

  if (idea.length < MIN_IDEA_LENGTH || isPlaceholder(idea)) {
    return {
      ok: false,
      message: "Too vague. Name the buyer, pain, or price.",
    };
  }

  if (idea.length > MAX_IDEA_LENGTH) {
    return {
      ok: false,
      message: "Too broad. Narrow to one user and one outcome.",
    };
  }

  if (isBuzzwordSoup(idea)) {
    return {
      ok: false,
      message: "This reads like buzzwords, not a problem. Make it concrete.",
    };
  }

  if (!hasUsefulIdeaSignal(idea)) {
    return {
      ok: false,
      message: "Too vague. Name the buyer, pain, or price.",
    };
  }

  if (isManifesto(data.idea) && !SIGNAL_PATTERNS.buyer.test(idea) && !SIGNAL_PATTERNS.pain.test(idea)) {
    return {
      ok: false,
      message: "Too broad. Narrow to one user and one outcome.",
    };
  }

  return {
    ok: true,
    data: {
      ...data,
      idea,
    },
  };
}

function validateIterationRequest(
  data: IterationRequest,
): { ok: true; data: IterationRequest } | { ok: false; message: string } {
  const previousAngle = normalize(data.previous_angle);
  const notes = normalize(data.notes ?? "");

  if (!previousAngle || previousAngle.length < 10) {
    return {
      ok: false,
      message: "Not enough context. Say what you tested and what happened.",
    };
  }

  if (notes.length > MAX_NOTES_LENGTH) {
    return {
      ok: false,
      message: "Too broad. Narrow to one user and one outcome.",
    };
  }

  if (data.result === "none" && isWeakAngle(previousAngle) && notes.length < 20) {
    return {
      ok: false,
      message: "Not enough context. Say what you tested and what happened.",
    };
  }

  return {
    ok: true,
    data: {
      ...data,
      idea: normalize(data.idea),
      previous_angle: previousAngle,
      notes,
    },
  };
}
