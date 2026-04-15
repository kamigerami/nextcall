import type { CSSProperties, ReactNode } from "react";

import { layout, theme } from "../styles/theme";

function Tab({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        height: 42,
        padding: "0 18px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${active ? theme.activeBg : theme.border}`,
        borderRadius: 999,
        backgroundColor: active ? theme.activeBg : theme.white,
        color: active ? theme.activeText : theme.muted,
        fontSize: 15,
        fontWeight: 500,
        boxSizing: "border-box",
      }}
    >
      {label}
    </div>
  );
}

export function UiShell({
  children,
  activeTab,
  style,
  contentStyle,
  status = "READY",
  width = layout.shellWidth,
}: {
  children: ReactNode;
  activeTab: "Validate idea" | "Refine after test";
  style?: CSSProperties;
  contentStyle?: CSSProperties;
  status?: string;
  width?: number;
}) {
  return (
    <div
      style={{
        width,
        border: `1px solid ${theme.border}`,
        borderRadius: layout.radius,
        backgroundColor: theme.panelStrong,
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "18px 20px",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <Tab label="Validate idea" active={activeTab === "Validate idea"} />
        <Tab label="Refine after test" active={activeTab === "Refine after test"} />
        <div
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: theme.subtle,
          }}
        >
          {status}
        </div>
      </div>
      <div
        style={{
          padding: "28px 30px 30px",
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
