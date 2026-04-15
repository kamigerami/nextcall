import type { CSSProperties } from "react";

import { theme, typeScale } from "../styles/theme";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function HeroText({
  lines,
  progresses,
  align = "center",
  colors,
  size = typeScale.hero,
  style,
}: {
  lines: string[];
  progresses: number[];
  align?: CSSProperties["textAlign"];
  colors?: string[];
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        textAlign: align,
        ...style,
      }}
    >
      {lines.map((line, index) => {
        const progress = clamp(progresses[index] ?? 1);

        return (
          <h1
            key={line}
            style={{
              margin: 0,
              opacity: progress,
              transform: `translateY(${(1 - progress) * 18}px)`,
              fontSize: size,
              lineHeight: 1.02,
              letterSpacing: "-0.075em",
              fontWeight: 760,
              color: colors?.[index] ?? theme.text,
            }}
          >
            {line}
          </h1>
        );
      })}
    </div>
  );
}
