"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import type {
  AnalyzeRequest,
  InitialResponse,
  IterationResponse,
} from "@/lib/schemas";

type Mode = AnalyzeRequest["mode"];
type ResultSignal = "none" | "some" | "strong";

type StoredState = {
  mode: Mode;
  initialIdea: string;
  iterationIdea: string;
  previousAngle: string;
  resultSignal: ResultSignal;
  notes: string;
  latestResult: ResultState | null;
};

type ResultState =
  | {
      mode: "initial";
      data: InitialResponse;
    }
  | {
      mode: "iteration";
      data: IterationResponse;
    };

const STORAGE_KEY = "idea-validator-v1";

const initialState: StoredState = {
  mode: "initial",
  initialIdea: "",
  iterationIdea: "",
  previousAngle: "",
  resultSignal: "none",
  notes: "",
  latestResult: null,
};

type VerdictTone = "danger" | "caution" | "success";

function artifactLabel(mode: Mode, result: ResultState | null) {
  if (mode === "initial" && result?.mode === "initial") {
    return result.data.test.artifact_type.replace("_", " ");
  }

  return "hook pack";
}

function artifactTitle(mode: Mode, result: ResultState | null) {
  const label = artifactLabel(mode, result);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function verdictState(
  result: ResultState,
  resultSignal: ResultSignal,
): { label: string; tone: VerdictTone } {
  if (result.mode === "initial") {
    switch (result.data.assessment.verdict) {
      case "weak":
        return { label: "WEAK", tone: "danger" };
      case "unclear":
        return { label: "UNCLEAR", tone: "caution" };
      default:
        return { label: "PROMISING", tone: "success" };
    }
  }

  switch (resultSignal) {
    case "none":
      return { label: "FAILED ANGLE", tone: "danger" };
    case "some":
      return { label: "REFINE", tone: "caution" };
    default:
      return { label: "DOUBLE DOWN", tone: "success" };
  }
}

function verdictToneClasses(tone: VerdictTone) {
  if (tone === "danger") {
    return "border-[#8d210d]/20 bg-[#fff1ec] text-[#7f1d0f]";
  }

  if (tone === "caution") {
    return "border-[#9b6a12]/20 bg-[#fff7e5] text-[#7a560f]";
  }

  return "border-[#1f6a43]/20 bg-[#eef9f2] text-[#185135]";
}

function formatArtifactText(text: string) {
  return text.trim();
}

function ResultPanel({
  label,
  title,
  description,
  action,
  tone = "default",
  descriptionClassName = "",
}: {
  label: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "default" | "feature";
  descriptionClassName?: string;
}) {
  return (
    <section
      className={`border-t border-black/10 px-5 py-5 first:border-t-0 sm:px-7 sm:py-6 ${
        tone === "feature" ? "bg-[#f8f0df]" : ""
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
            {label}
          </p>
          <div className="mt-3">{title}</div>
          {description ? (
            <div
              className={`mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-black/68 ${descriptionClassName}`}
            >
              {description}
            </div>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}

export function IdeaValidatorApp() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<StoredState>(initialState);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState;
        setState(parsed);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isHydrated, state]);

  const currentIdea =
    state.mode === "initial" ? state.initialIdea : state.iterationIdea;

  const artifactText = useMemo(() => {
    if (!state.latestResult) {
      return "";
    }

    if (state.latestResult.mode === "initial") {
      return state.latestResult.data.test.artifact_text;
    }

    return state.latestResult.data.hooks.join("\n");
  }, [state.latestResult]);

  const verdict = state.latestResult
    ? verdictState(state.latestResult, state.resultSignal)
    : null;

  function updateState(patch: Partial<StoredState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  async function handleCopy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const payload: AnalyzeRequest =
      state.mode === "initial"
        ? {
            mode: "initial",
            idea: state.initialIdea,
          }
        : {
            mode: "iteration",
            idea: state.iterationIdea,
            previous_angle: state.previousAngle,
            result: state.resultSignal,
            notes: state.notes,
          };

    startTransition(async () => {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Something broke.");
          return;
        }

        setState((current) => ({
          ...current,
          latestResult: {
            mode: current.mode,
            data,
          } as ResultState,
        }));
      } catch {
        setError("No usable answer. Make the idea more concrete and try again.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.62),_transparent_32%),linear-gradient(145deg,_#efe7d9_0%,_#ddd2bf_47%,_#cabda6_100%)] text-[#111111]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-5 py-5 sm:px-7 sm:py-7 lg:grid lg:grid-cols-[0.88fr_1.18fr] lg:gap-8 lg:px-9 lg:py-9">
        <section className="flex flex-col justify-between border-b border-black/12 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <div className="space-y-8">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-black/48">
                NextPitch
              </p>
              <div className="space-y-3">
                <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.07em] text-black sm:text-6xl">
                  Stop guessing.
                  <span className="block text-black/46">
                    Most ideas are not worth building.
                  </span>
                </h1>
                <p className="max-w-lg text-base leading-7 text-black/66 sm:text-lg">
                  NextPitch gives you one hard call, one angle to push, one test to run,
                  and one artifact you can send today.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Verdict", "A hard call. No hedging."],
                ["Best angle", "One frame worth pushing first."],
                ["Test this", "A concrete check with a real success bar."],
                ["Use this artifact", "Something you can copy and send as-is."],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="border border-black/12 bg-white/48 px-4 py-4 backdrop-blur"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                    {title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-black/65">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-black/12 pt-5 text-sm text-black/58">
            <p>Weak ideas get called weak. Broad ideas get forced narrower.</p>
            <p className="mt-2">If the answer sounds polite, the product is failing.</p>
          </div>
        </section>

        <section className="flex min-h-full flex-col">
          <div className="border border-black/12 bg-[#fbfaf7]/92 shadow-[0_18px_60px_rgba(17,17,17,0.07)] backdrop-blur">
            <div className="border-b border-black/10 px-5 py-4 sm:px-7">
              <div className="flex flex-wrap items-center gap-3">
                {(["initial", "iteration"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateState({ mode, latestResult: null })}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      state.mode === mode
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white text-black/60 hover:border-black/25 hover:text-black"
                    }`}
                  >
                    {mode === "initial" ? "Validate idea" : "Refine after test"}
                  </button>
                ))}
                <span className="ml-auto text-xs uppercase tracking-[0.26em] text-black/35">
                  {isPending ? "Analyzing" : "Ready"}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-7 sm:py-7">
              <div className="space-y-5">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                    {state.mode === "initial" ? "Paste the idea" : "Idea you tested"}
                  </span>
                  <textarea
                    id="idea"
                    name="idea"
                    value={currentIdea}
                    onChange={(event) =>
                      state.mode === "initial"
                        ? updateState({ initialIdea: event.target.value })
                        : updateState({ iterationIdea: event.target.value })
                    }
                    placeholder={
                      state.mode === "initial"
                        ? "Landlords keep missing chargeable damage at move-out because inspections are rushed and inconsistent."
                        : "Tool for accounting firms to chase missing client documents before monthly close."
                    }
                    className="mt-3 min-h-36 w-full resize-none border border-black/10 bg-white px-4 py-4 text-base leading-7 outline-none transition focus:border-black/30"
                    maxLength={500}
                  />
                  <span className="mt-2 block text-xs text-black/45">
                    Messy is fine. Paste the raw thought. Buyer, pain, or workflow beats manifesto.
                  </span>
                </label>

                {state.mode === "iteration" ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                        Previous angle
                      </span>
                      <input
                        id="previous-angle"
                        name="previous-angle"
                        value={state.previousAngle}
                        onChange={(event) =>
                          updateState({ previousAngle: event.target.value })
                        }
                        placeholder="Stop chasing clients for missing documents every month."
                        className="mt-3 h-13 w-full border border-black/10 bg-white px-4 text-base outline-none transition focus:border-black/30"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                        Result
                      </span>
                      <select
                        id="result-signal"
                        name="result-signal"
                        value={state.resultSignal}
                        onChange={(event) =>
                          updateState({
                            resultSignal: event.target.value as ResultSignal,
                          })
                        }
                        className="mt-3 h-13 w-full border border-black/10 bg-white px-4 text-base outline-none transition focus:border-black/30"
                      >
                        <option value="none">None</option>
                        <option value="some">Some</option>
                        <option value="strong">Strong</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                        Notes
                      </span>
                      <textarea
                        id="notes"
                        name="notes"
                        value={state.notes}
                        onChange={(event) => updateState({ notes: event.target.value })}
                        placeholder="Posted in a niche finance ops group. A few replies, but no urgency."
                        className="mt-3 min-h-28 w-full resize-none border border-black/10 bg-white px-4 py-4 text-base leading-7 outline-none transition focus:border-black/30"
                        maxLength={500}
                      />
                    </label>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-4">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex h-14 items-center justify-center bg-black px-7 text-[15px] font-semibold tracking-[0.08em] text-white uppercase transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/40"
                  >
                    {isPending ? "Working..." : "Make the call →"}
                  </button>
                  <p className="text-sm text-black/45">
                    500 char max. No fluff. No transcript.
                  </p>
                </div>

                {error ? (
                  <div className="border border-[#b83820]/20 bg-[#fff2ee] px-4 py-4 text-sm leading-6 text-[#8d210d]">
                    {error}
                  </div>
                ) : null}
              </div>
            </form>
          </div>

          <div className="mt-5 flex-1 border border-black/12 bg-white/84 shadow-[0_24px_70px_rgba(17,17,17,0.06)] backdrop-blur">
            {state.latestResult ? (
              <div className="grid gap-0">
                <ResultPanel
                  label="Verdict"
                  title={
                    <div className="space-y-4">
                      <div
                        className={`inline-flex items-center border px-4 py-3 text-[clamp(1.4rem,3vw,2.7rem)] font-semibold tracking-[-0.06em] ${verdict ? verdictToneClasses(verdict.tone) : ""}`}
                      >
                        {verdict?.label}
                      </div>
                    </div>
                  }
                  description={
                    state.latestResult.mode === "initial"
                      ? state.latestResult.data.assessment.reason
                      : state.latestResult.data.analysis
                  }
                />
                <ResultPanel
                  label="Best angle"
                  title={
                    <h2 className="max-w-3xl text-[clamp(1.8rem,3vw,2.5rem)] font-semibold tracking-[-0.05em] text-black">
                      {
                        state.latestResult.mode === "initial"
                          ? state.latestResult.data.best_angle.title
                          : state.latestResult.data.new_angle
                      }
                    </h2>
                  }
                  description={
                    state.latestResult.mode === "initial"
                      ? state.latestResult.data.best_angle.description
                      : "Sharper than the last frame. Narrow enough to retest fast."
                  }
                />
                <ResultPanel
                  label="Test this"
                  title={
                    <div className="space-y-4">
                      <h3 className="max-w-3xl text-[1.55rem] font-semibold tracking-[-0.04em] text-black">
                        {state.latestResult.mode === "initial"
                          ? state.latestResult.data.next_step.instruction
                          : "Run this narrower check"}
                      </h3>
                      <p className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-black/68">
                        {state.latestResult.mode === "initial"
                          ? state.latestResult.data.test.what_to_do
                          : state.latestResult.data.next_step}
                      </p>
                      {state.latestResult.mode === "initial" ? (
                        <div className="max-w-3xl border border-black/12 bg-[#f6f1e6] px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/40">
                            Success looks like
                          </p>
                          <p className="mt-3 text-sm leading-7 text-black/72">
                            {state.latestResult.data.test.success_condition}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  }
                />
                <ResultPanel
                  label="Use this artifact"
                  tone="feature"
                  title={
                    <div className="space-y-4">
                      <h3 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-black">
                        {artifactTitle(state.mode, state.latestResult)}
                      </h3>
                      <div className="max-w-4xl border border-black/12 bg-white px-4 py-4">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-black/78">
                          {formatArtifactText(artifactText)}
                        </p>
                      </div>
                    </div>
                  }
                  action={
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          state.latestResult?.mode === "initial"
                            ? state.latestResult.data.test.artifact_type
                            : "hooks",
                          artifactText,
                        )
                      }
                      className="inline-flex h-12 items-center justify-center border border-black bg-black px-5 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-black/86"
                    >
                      {copied ? `Copied ${copied}` : "Copy artifact"}
                    </button>
                  }
                />

                <details className="border-t border-black/10 px-5 py-5 sm:px-7">
                  <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.26em] text-black/40">
                    Show hooks
                  </summary>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {state.latestResult.data.hooks.map((hook) => (
                      <button
                        key={hook}
                        type="button"
                        onClick={() => handleCopy("hook", hook)}
                        className="border border-black/10 bg-[#f5f2eb] px-3 py-3 text-left text-sm leading-6 text-black transition hover:border-black/30"
                      >
                        {hook}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col justify-between px-5 py-6 sm:px-7">
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                    Working surface
                  </p>
                  <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-black">
                    Put one idea in. Get one hard call back.
                  </h2>
                  <p className="max-w-2xl text-base leading-7 text-black/55">
                    The goal is not inspiration. The goal is a verdict, a sharper angle,
                    and a test worth running without turning this into a chat session.
                  </p>
                </div>
                <div className="grid gap-3 border-t border-black/10 pt-5 sm:grid-cols-3">
                  {[
                    "Weak ideas get rejected cleanly.",
                    "Boring B2B pain still counts.",
                    "You should be able to copy the test artifact as-is.",
                  ].map((item) => (
                    <div key={item} className="text-sm leading-6 text-black/55">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
