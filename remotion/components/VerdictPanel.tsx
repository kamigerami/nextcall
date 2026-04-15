import { Label } from "./Label";
import { SectionCard } from "./SectionCard";
import { theme, typeScale } from "../styles/theme";

export function VerdictPanel() {
  return (
    <SectionCard width={800}>
      <Label>Verdict</Label>
      <h2
        style={{
          margin: "18px 0 0",
          fontSize: 74,
          lineHeight: 0.96,
          letterSpacing: "-0.08em",
          fontWeight: 760,
          color: theme.text,
          textTransform: "lowercase",
        }}
      >
        promising
      </h2>
      <p
        style={{
          margin: "22px 0 0",
          maxWidth: 620,
          fontSize: typeScale.copy,
          lineHeight: 1.6,
          color: theme.muted,
        }}
      >
        The pain is common, concrete, and easy to test with a direct outbound ask.
      </p>
    </SectionCard>
  );
}
