import { Label } from "./Label";
import { SectionCard } from "./SectionCard";
import { theme, typeScale } from "../styles/theme";

export function BestAnglePanel() {
  return (
    <SectionCard width={980}>
      <Label>Best angle</Label>
      <h2
        style={{
          margin: "18px 0 0",
          maxWidth: 760,
          fontSize: typeScale.title,
          lineHeight: 1.02,
          letterSpacing: "-0.07em",
          fontWeight: 760,
          color: theme.text,
        }}
      >
        Get freelancers paid without the awkward chase
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
        Frame it around the social friction of asking again, not generic invoicing
        software.
      </p>
    </SectionCard>
  );
}
