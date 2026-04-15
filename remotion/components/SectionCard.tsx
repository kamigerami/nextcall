import type { CSSProperties, ReactNode } from "react";

import { layout, theme } from "../styles/theme";

export function SectionCard({
  children,
  width = "100%",
  style,
}: {
  children: ReactNode;
  width?: number | string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        border: `1px solid ${theme.border}`,
        borderRadius: layout.radius,
        backgroundColor: theme.panel,
        padding: "34px 38px",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
