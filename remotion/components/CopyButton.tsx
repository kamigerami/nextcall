import { theme } from "../styles/theme";

export function CopyButton({ copied }: { copied: boolean }) {
  return (
    <div
      style={{
        height: 48,
        minWidth: 124,
        padding: "0 18px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${copied ? theme.activeBg : theme.border}`,
        backgroundColor: copied ? theme.activeBg : theme.white,
        color: copied ? theme.activeText : theme.text,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        boxSizing: "border-box",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </div>
  );
}
