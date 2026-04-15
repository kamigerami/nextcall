import { Cursor } from "./Cursor";
import { Label } from "./Label";
import { UiShell } from "./UiShell";
import { theme } from "../styles/theme";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function Field({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "active";
}) {
  return (
    <div
      style={{
        border: `1px solid ${theme.border}`,
        backgroundColor: tone === "active" ? theme.bg : theme.white,
        padding: "14px 16px 16px",
        boxSizing: "border-box",
      }}
    >
      <Label>{label}</Label>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 18,
          lineHeight: 1.5,
          color: tone === "active" ? theme.text : theme.muted,
        }}
      >
        {value}
      </p>
    </div>
  );
}

export function IterationPanel({
  analysisProgress,
  newAngleProgress,
  clickProgress,
}: {
  analysisProgress: number;
  newAngleProgress: number;
  clickProgress: number;
}) {
  const analysis = clamp(analysisProgress);
  const newAngle = clamp(newAngleProgress);

  return (
    <div
      style={{
        position: "relative",
        width: 1180,
      }}
    >
      <UiShell activeTab="Refine after test">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.92fr 1.08fr",
            gap: 22,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field
              label="Idea you tested"
              value="Tool for freelancers to recover overdue invoices without awkward follow-ups."
            />
            <Field
              label="Previous angle"
              value="Get freelancers paid without the awkward chase"
            />
            <Field label="Result" value="no response" tone="active" />
          </div>

          <div
            style={{
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.panel,
              padding: "24px 26px 26px",
              boxSizing: "border-box",
            }}
          >
            <Label>New call</Label>
            <h2
              style={{
                margin: "18px 0 0",
                opacity: analysis,
                transform: `translateY(${(1 - analysis) * 10}px)`,
                fontSize: 42,
                lineHeight: 1.05,
                letterSpacing: "-0.06em",
                fontWeight: 760,
                color: theme.text,
              }}
            >
              Angle failed. Too broad.
            </h2>
            <p
              style={{
                margin: "16px 0 0",
                opacity: newAngle,
                transform: `translateY(${(1 - newAngle) * 12}px)`,
                fontSize: 22,
                lineHeight: 1.55,
                color: theme.muted,
              }}
            >
              New angle: freelance designers with invoices overdue by more than 14
              days.
            </p>
          </div>
        </div>
      </UiShell>

      <Cursor left={358} top={447} clickProgress={clickProgress} />
    </div>
  );
}
