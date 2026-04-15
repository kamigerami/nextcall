import { Label } from "./Label";
import { SectionCard } from "./SectionCard";
import { theme } from "../styles/theme";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function ExampleCardsPanel({ revealProgress }: { revealProgress: number[] }) {
  const examples = [
    "Ops agencies chasing missing client files",
    "Dental teams filling last-minute cancellations",
    "Property managers waiting on contractor photos",
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 18,
        width: "100%",
      }}
    >
      {examples.map((example, index) => {
        const progress = clamp(revealProgress[index] ?? 1);

        return (
          <SectionCard
            key={example}
            style={{
              opacity: progress,
              transform: `translateY(${(1 - progress) * 16}px)`,
              padding: "26px 26px 30px",
            }}
          >
            <Label>Promising</Label>
            <h3
              style={{
                margin: "18px 0 0",
                fontSize: 34,
                lineHeight: 1.08,
                letterSpacing: "-0.06em",
                fontWeight: 730,
                color: theme.text,
              }}
            >
              {example}
            </h3>
          </SectionCard>
        );
      })}
    </div>
  );
}
