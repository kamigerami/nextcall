import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

import { ArtifactPanel } from "./components/ArtifactPanel";
import { BestAnglePanel } from "./components/BestAnglePanel";
import { ExampleCardsPanel } from "./components/ExampleCardsPanel";
import { Frame } from "./components/Frame";
import { HeroText } from "./components/HeroText";
import { InputPanel } from "./components/InputPanel";
import { IterationPanel } from "./components/IterationPanel";
import { Label } from "./components/Label";
import { TestPanel } from "./components/TestPanel";
import { UiShell } from "./components/UiShell";
import { VerdictPanel } from "./components/VerdictPanel";
import { theme, typeScale } from "./styles/theme";

const { fontFamily: sansFamily } = loadGeist("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const { fontFamily: monoFamily } = loadGeistMono("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const DURATION_IN_FRAMES = 1140;

const scenes = {
  hook: [0, 90],
  promise: [90, 180],
  input: [180, 300],
  verdict: [300, 390],
  angle: [390, 510],
  test: [510, 690],
  artifact: [690, 840],
  iteration: [840, 990],
  proof: [990, 1080],
  end: [1080, 1140],
} as const;

const clickFrames = [286, 764, 869];

const typedIdea =
  "Buyer: Solo freelancers\nPain: Chasing payments is annoying and inconsistent";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const progressBetween = (
  frame: number,
  start: number,
  end: number,
  easing: (input: number) => number = Easing.bezier(0.2, 0.8, 0.2, 1),
) =>
  clamp(
    interpolate(frame, [start, end], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing,
    }),
  );

const entranceStyle = (frame: number, delay = 0) => {
  const progress = progressBetween(frame, delay, delay + 12);

  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * 16}px) scale(${0.992 + progress * 0.008})`,
  };
};

export function NextPitchDemo() {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: sansFamily,
      }}
    >
      <Audio
        src={staticFile("remotion/nextpitch-song.mp3")}
        volume={(f) =>
          interpolate(f, [0, 12, 1110, DURATION_IN_FRAMES - 1], [0, 0.18, 0.18, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {clickFrames.map((from) => (
        <Sequence key={from} from={from} durationInFrames={12} premountFor={8}>
          <Audio src={staticFile("remotion/click.wav")} volume={0.42} />
        </Sequence>
      ))}

      {inRange(frame, scenes.hook) ? <HookScene frame={frame - scenes.hook[0]} /> : null}
      {inRange(frame, scenes.promise) ? (
        <PromiseScene frame={frame - scenes.promise[0]} />
      ) : null}
      {inRange(frame, scenes.input) ? <InputScene frame={frame - scenes.input[0]} /> : null}
      {inRange(frame, scenes.verdict) ? (
        <VerdictScene frame={frame - scenes.verdict[0]} />
      ) : null}
      {inRange(frame, scenes.angle) ? <AngleScene frame={frame - scenes.angle[0]} /> : null}
      {inRange(frame, scenes.test) ? <TestScene frame={frame - scenes.test[0]} /> : null}
      {inRange(frame, scenes.artifact) ? (
        <ArtifactScene frame={frame - scenes.artifact[0]} />
      ) : null}
      {inRange(frame, scenes.iteration) ? (
        <IterationScene frame={frame - scenes.iteration[0]} />
      ) : null}
      {inRange(frame, scenes.proof) ? <ProofScene frame={frame - scenes.proof[0]} /> : null}
      {inRange(frame, scenes.end) ? <EndScene frame={frame - scenes.end[0]} /> : null}
    </AbsoluteFill>
  );
}

function HookScene({ frame }: { frame: number }) {
  const firstProgress = clamp(1 - progressBetween(frame, 34, 46, Easing.linear));
  const secondProgress = progressBetween(frame, 48, 62);

  return (
    <Frame align="center" justify="center">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        {frame < 46 ? (
          <HeroText lines={["Stop guessing."]} progresses={[firstProgress]} />
        ) : (
          <HeroText
            lines={["Most ideas are not worth building."]}
            progresses={[secondProgress]}
            style={{ maxWidth: 1080 }}
          />
        )}
      </div>
    </Frame>
  );
}

function PromiseScene({ frame }: { frame: number }) {
  const shellProgress = progressBetween(frame, 0, 12);
  const lineOne = progressBetween(frame, 10, 22);
  const lineTwo = progressBetween(frame, 24, 36);
  const lineThree = progressBetween(frame, 42, 56);

  return (
    <Frame align="center" justify="center">
      <div
        style={{
          ...entranceStyle(frame, 0),
          display: "flex",
          justifyContent: "center",
        }}
      >
        <UiShell
          activeTab="Validate idea"
          style={{
            transform: `scale(${0.992 + shellProgress * 0.008})`,
          }}
          contentStyle={{
            padding: "72px 72px 76px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <HeroText
              lines={["Put one idea in.", "Get one hard call back."]}
              progresses={[lineOne, lineTwo]}
              align="left"
              size={72}
              style={{ maxWidth: 760 }}
            />
            <p
              style={{
                margin: "10px 0 0",
                opacity: lineThree,
                transform: `translateY(${(1 - lineThree) * 12}px)`,
                fontSize: 22,
                lineHeight: 1.55,
                color: theme.muted,
              }}
            >
              No chat. No fluff. No transcript.
            </p>
          </div>
        </UiShell>
      </div>
    </Frame>
  );
}

function InputScene({ frame }: { frame: number }) {
  const typedLength = Math.floor(
    interpolate(frame, [8, 80], [0, typedIdea.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.linear,
    }),
  );
  const cursorProgress = progressBetween(frame, 82, 104, Easing.linear);
  const clickProgress = clamp(1 - progressBetween(frame, 104, 116, Easing.linear));

  return (
    <Frame align="center" justify="center">
      <div style={entranceStyle(frame, 0)}>
        <InputPanel
          typedText={typedIdea.slice(0, typedLength)}
          cursorProgress={cursorProgress}
          clickProgress={clickProgress}
        />
      </div>
    </Frame>
  );
}

function VerdictScene({ frame }: { frame: number }) {
  return (
    <Frame align="center" justify="center">
      <div style={entranceStyle(frame, 0)}>
        <VerdictPanel />
      </div>
    </Frame>
  );
}

function AngleScene({ frame }: { frame: number }) {
  return (
    <Frame align="center" justify="center">
      <div style={entranceStyle(frame, 0)}>
        <BestAnglePanel />
      </div>
    </Frame>
  );
}

function TestScene({ frame }: { frame: number }) {
  const successRevealProgress = progressBetween(frame, 42, 74);

  return (
    <Frame align="center" justify="center">
      <div style={entranceStyle(frame, 0)}>
        <TestPanel
          successRevealProgress={successRevealProgress}
          monoFamily={monoFamily}
        />
      </div>
    </Frame>
  );
}

function ArtifactScene({ frame }: { frame: number }) {
  const copied = frame >= 74;
  const visibleExamples =
    frame >= 130 ? 3 : frame >= 112 ? 2 : frame >= 96 ? 1 : 0;
  const clickProgress = clamp(1 - progressBetween(frame, 72, 84, Easing.linear));

  return (
    <Frame align="center" justify="center">
      <div style={entranceStyle(frame, 0)}>
        <ArtifactPanel
          copied={copied}
          visibleExamples={visibleExamples}
          clickProgress={clickProgress}
        />
      </div>
    </Frame>
  );
}

function IterationScene({ frame }: { frame: number }) {
  const analysisProgress = progressBetween(frame, 36, 52);
  const newAngleProgress = progressBetween(frame, 58, 76);
  const clickProgress = clamp(1 - progressBetween(frame, 20, 32, Easing.linear));

  return (
    <Frame align="center" justify="center">
      <div style={entranceStyle(frame, 0)}>
        <IterationPanel
          analysisProgress={analysisProgress}
          newAngleProgress={newAngleProgress}
          clickProgress={clickProgress}
        />
      </div>
    </Frame>
  );
}

function ProofScene({ frame }: { frame: number }) {
  return (
    <Frame align="center" justify="center">
      <div style={{ ...entranceStyle(frame, 0), width: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            width: "100%",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Label>Works on ugly real problems too</Label>
          </div>
          <ExampleCardsPanel
            revealProgress={[
              progressBetween(frame, 6, 20),
              progressBetween(frame, 20, 34),
              progressBetween(frame, 34, 48),
            ]}
          />
        </div>
      </div>
    </Frame>
  );
}

function EndScene({ frame }: { frame: number }) {
  const tagline = progressBetween(frame, 0, 12);
  const brand = progressBetween(frame, 12, 24);

  return (
    <Frame align="center" justify="center">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            opacity: tagline,
            transform: `translateY(${(1 - tagline) * 12}px)`,
            fontSize: 28,
            lineHeight: 1.5,
            color: theme.muted,
          }}
        >
          Know what to test next.
        </p>
        <h2
          style={{
            margin: 0,
            opacity: brand,
            transform: `translateY(${(1 - brand) * 12}px)`,
            fontSize: typeScale.title,
            lineHeight: 1,
            letterSpacing: "-0.08em",
            fontWeight: 760,
            color: theme.text,
          }}
        >
          NextPitch.se
        </h2>
      </div>
    </Frame>
  );
}

function inRange(frame: number, [start, end]: readonly [number, number]) {
  return frame >= start && frame < end;
}
