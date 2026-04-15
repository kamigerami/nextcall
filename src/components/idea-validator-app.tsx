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

function artifactLabel(mode: Mode, result: ResultState | null) {
  if (mode === "initial" && result?.mode === "initial") {
    return result.data.test.artifact_type.replace("_", " ");
  }

  return "hook pack";
}

function testBody(result: ResultState) {
  if (result.mode === "initial") {
    return `${result.data.test.what_to_do}\n\nSuccess looks like: ${result.data.test.success_condition}`;
  }

  return result.data.next_step;
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.75),_transparent_38%),linear-gradient(135deg,_#f2f0ea_0%,_#ddd8cf_45%,_#c6c0b7_100%)] text-[#111111]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-6 py-6 sm:px-8 lg:grid lg:grid-cols-[0.95fr_1.2fr] lg:gap-10 lg:px-10 lg:py-10">
        <section className="flex flex-col justify-between border-b border-black/10 pb-10 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
          <div className="space-y-10">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-black/45">
                nextcall
              </p>
              <div className="space-y-4">
                <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.06em] text-black sm:text-6xl">
                  Stop guessing.
                  <span className="block text-black/40">Test the sharpest angle next.</span>
                </h1>
                <p className="max-w-lg text-base leading-7 text-black/62 sm:text-lg">
                  This is not a chat app. Put the idea in, get one hard call, one test,
                  and one artifact you can actually send.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Verdict", "A blunt read on whether the idea has real signal."],
                ["Best angle", "The single frame worth pushing first."],
                ["Test this", "A concrete move built for speed, not theater."],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="border border-black/10 bg-white/55 px-4 py-4 backdrop-blur"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                    {title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-black/65">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 border-t border-black/10 pt-6 text-sm text-black/55">
            <p>Weak ideas get called weak. Broad ideas get forced narrower.</p>
            <p className="mt-2">If the output feels bland, the product is failing.</p>
          </div>
        </section>

        <section className="flex min-h-full flex-col">
          <div className="border border-black/10 bg-[#fbfaf7]/90 shadow-[0_24px_80px_rgba(17,17,17,0.08)] backdrop-blur">
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
                        : "border-black/10 bg-white text-black/55 hover:border-black/25 hover:text-black"
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
                    {state.mode === "initial" ? "Idea" : "Original idea"}
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
                        ? "Software for landlords to handle move-out inspections."
                        : "Tool for accounting firms to chase missing client documents before monthly close."
                    }
                    className="mt-3 min-h-36 w-full resize-none border border-black/10 bg-white px-4 py-4 text-base leading-7 outline-none transition focus:border-black/30"
                    maxLength={500}
                  />
                  <span className="mt-2 block text-xs text-black/45">
                    Keep it concrete. Buyer, pain, or workflow beats manifesto.
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
                    className="inline-flex h-12 items-center justify-center bg-black px-6 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/40"
                  >
                    {isPending ? "Working..." : "Make the call"}
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

          <div className="mt-6 flex-1 border border-black/10 bg-white/82 shadow-[0_30px_90px_rgba(17,17,17,0.07)] backdrop-blur">
            {state.latestResult ? (
              <div className="grid gap-0">
                <ResultBlock
                  label="Verdict"
                  primary={
                    state.latestResult.mode === "initial"
                      ? state.latestResult.data.assessment.verdict
                      : state.resultSignal === "strong"
                        ? "double down"
                        : state.resultSignal === "some"
                          ? "refine"
                          : "failed angle"
                  }
                  body={
                    state.latestResult.mode === "initial"
                      ? state.latestResult.data.assessment.reason
                      : state.latestResult.data.analysis
                  }
                />
                <ResultBlock
                  label="Best angle"
                  primary={
                    state.latestResult.mode === "initial"
                      ? state.latestResult.data.best_angle.title
                      : state.latestResult.data.new_angle
                  }
                  body={
                    state.latestResult.mode === "initial"
                      ? state.latestResult.data.best_angle.description
                      : "Sharper than the last frame, and built to retest fast."
                  }
                />
                <ResultBlock
                  label="Test this"
                  primary={
                    state.latestResult.mode === "initial"
                      ? state.latestResult.data.next_step.instruction
                      : "Run this narrower check"
                  }
                  body={testBody(state.latestResult)}
                />
                <ResultBlock
                  label="Use this artifact"
                  primary={artifactLabel(state.mode, state.latestResult)}
                  body={artifactText}
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
                      className="border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/55 transition hover:border-black/25 hover:text-black"
                    >
                      {copied ? `Copied ${copied}` : "Copy"}
                    </button>
                  }
                />

                <div className="grid gap-0 border-t border-black/10 lg:grid-cols-[1fr_0.95fr]">
                  <div className="border-b border-black/10 px-5 py-5 sm:px-7 lg:border-b-0 lg:border-r">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                      Hooks
                    </p>
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
                  </div>

                  <div className="px-5 py-5 sm:px-7">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                      Secondary context
                    </p>
                    {state.latestResult.mode === "initial" ? (
                      <div className="mt-4 space-y-5">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-black/35">
                            Other frames
                          </p>
                          <ul className="mt-3 space-y-2 text-sm leading-6 text-black/65">
                            {state.latestResult.data.other_angles.map((angle) => (
                              <li key={angle}>{angle}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-black/35">
                            Why this
                          </p>
                          <p className="mt-3 text-sm leading-6 text-black/65">
                            {state.latestResult.data.next_step.why}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 max-w-md text-sm leading-6 text-black/65">
                        The point of the second loop is not more ideas. It is a cleaner
                        read on what the market reacted to.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col justify-between px-5 py-6 sm:px-7">
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
                    Working surface
                  </p>
                  <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-black">
                    Put one idea in. Get one hard recommendation back.
                  </h2>
                  <p className="max-w-2xl text-base leading-7 text-black/55">
                    The goal is not inspiration. The goal is the next real test you can run
                    without turning this into a chat session.
                  </p>
                </div>
                <div className="grid gap-4 border-t border-black/10 pt-6 sm:grid-cols-3">
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

function ResultBlock({
  label,
  primary,
  body,
  action,
}: {
  label: string;
  primary: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="border-t border-black/10 first:border-t-0">
      <div className="grid gap-6 px-5 py-5 sm:px-7 lg:grid-cols-[190px_1fr_auto] lg:items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
            {label}
          </p>
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-[-0.04em] text-black">{primary}</p>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-black/65">
            {body}
          </p>
        </div>
        <div>{action}</div>
      </div>
    </section>
  );
}
