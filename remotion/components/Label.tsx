import type { CSSProperties } from "react";

import { theme, typeScale } from "../styles/theme";

export function Label({
  children,
  style,
}: {
  children: string;
  style?: CSSProperties;
}) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: typeScale.label,
        fontWeight: 700,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: theme.subtle,
        ...style,
      }}
    >
      {children}
    </p>
  );
}
