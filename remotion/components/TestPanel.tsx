import { Label } from "./Label";
import { SectionCard } from "./SectionCard";
import { SuccessConditionBox } from "./SuccessConditionBox";
import { theme, typeScale } from "../styles/theme";

export function TestPanel({
  successRevealProgress,
  monoFamily,
}: {
  successRevealProgress: number;
  monoFamily: string;
}) {
  return (
    <SectionCard width={980}>
      <Label>Test this</Label>
      <h2
        style={{
          margin: "18px 0 0",
          maxWidth: 760,
          fontSize: typeScale.section,
          lineHeight: 1.05,
          letterSpacing: "-0.06em",
          fontWeight: 760,
          color: theme.text,
        }}
      >
        Narrow the idea to overdue-invoice collection
      </h2>
      <p
        style={{
          margin: "18px 0 0",
          maxWidth: 760,
          fontSize: typeScale.copy,
          lineHeight: 1.6,
          color: theme.muted,
        }}
      >
        Ask for a live unpaid invoice, not opinions about payment admin in general.
      </p>
      <div style={{ marginTop: 28, maxWidth: 760 }}>
        <SuccessConditionBox
          text="At least 5 people reply with a current unpaid invoice"
          revealProgress={successRevealProgress}
          fontFamily={monoFamily}
        />
      </div>
    </SectionCard>
  );
}
