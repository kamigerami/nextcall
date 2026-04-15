import { Cursor } from "./Cursor";
import { Label } from "./Label";
import { UiShell } from "./UiShell";
import { theme } from "../styles/theme";

const mix = (from: number, to: number, progress: number) =>
  from + (to - from) * Math.max(0, Math.min(1, progress));

export function InputPanel({
  typedText,
  cursorProgress,
  clickProgress,
}: {
  typedText: string;
  cursorProgress: number;
  clickProgress: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 1160,
      }}
    >
      <UiShell activeTab="Validate idea">
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <Label>Paste the idea</Label>
            <div
              style={{
                marginTop: 14,
                minHeight: 252,
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.white,
                padding: "18px 20px",
                boxSizing: "border-box",
              }}
            >
              <p
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  fontSize: 28,
                  lineHeight: 1.55,
                  letterSpacing: "-0.03em",
                  color: theme.text,
                }}
              >
                {typedText}
              </p>
            </div>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                lineHeight: 1.6,
                color: theme.muted,
              }}
            >
              Messy is fine. Buyer, pain, or workflow beats manifesto.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              paddingTop: 18,
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                height: 56,
                padding: "0 28px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.activeBg,
                color: theme.activeText,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxSizing: "border-box",
              }}
            >
              Make the call →
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: theme.muted,
              }}
            >
              500 char max. No fluff. No transcript.
            </p>
          </div>
        </div>
      </UiShell>

      <Cursor
        left={mix(804, 166, cursorProgress)}
        top={mix(352, 500, cursorProgress)}
        clickProgress={clickProgress}
      />
    </div>
  );
}
