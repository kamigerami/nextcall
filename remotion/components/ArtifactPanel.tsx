import { CopyButton } from "./CopyButton";
import { Cursor } from "./Cursor";
import { Label } from "./Label";
import { SectionCard } from "./SectionCard";
import { theme, typeScale } from "../styles/theme";

export function ArtifactPanel({
  copied,
  visibleExamples,
  clickProgress,
}: {
  copied: boolean;
  visibleExamples: number;
  clickProgress: number;
}) {
  const examples = [
    "Any overdue invoices sitting with no reply right now?",
    "What do you do after a second payment reminder gets ignored?",
    "Have you chased an invoice this week and still not been paid?",
  ];

  return (
    <div
      style={{
        position: "relative",
        width: 1040,
      }}
    >
      <SectionCard width={1040}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 28,
          }}
        >
          <div style={{ flex: 1 }}>
            <Label>Use this artifact</Label>
            <div
              style={{
                marginTop: 18,
                display: "inline-flex",
                height: 34,
                padding: "0 14px",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.white,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: theme.text,
              }}
            >
              dm
            </div>
          </div>
          <CopyButton copied={copied} />
        </div>

        <div
          style={{
            marginTop: 20,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.white,
            padding: "20px 22px",
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              margin: 0,
              maxWidth: 760,
              fontSize: typeScale.copy,
              lineHeight: 1.6,
              color: theme.text,
            }}
          >
            Do you ever have to chase clients for unpaid invoices?
          </p>
        </div>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {examples.slice(0, visibleExamples).map((example) => (
            <div
              key={example}
              style={{
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bg,
                padding: "14px 16px",
                fontSize: 18,
                lineHeight: 1.5,
                color: theme.muted,
                boxSizing: "border-box",
              }}
            >
              {example}
            </div>
          ))}
        </div>
      </SectionCard>

      <Cursor left={866} top={78} clickProgress={clickProgress} />
    </div>
  );
}
