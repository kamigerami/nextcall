import { Composition } from "remotion";

import {
  DURATION_IN_FRAMES,
  FPS,
  HEIGHT,
  NextPitchDemo,
  WIDTH,
} from "./NextPitchDemo";

export function RemotionRoot() {
  return (
    <Composition
      id="NextPitchDemo"
      component={NextPitchDemo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
}
