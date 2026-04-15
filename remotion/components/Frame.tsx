import type { CSSProperties, ReactNode } from "react";

import { layout } from "../styles/theme";

export function Frame({
  children,
  align = "center",
  justify = "center",
  maxWidth = layout.maxWidth,
  style,
}: {
  children: ReactNode;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  maxWidth?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: align,
        justifyContent: justify,
        padding: `${layout.framePaddingY}px ${layout.framePaddingX}px`,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
