import { Label } from "./Label";
import { theme } from "../styles/theme";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function SuccessConditionBox({
  text,
  revealProgress,
  fontFamily,
}: {
  text: string;
  revealProgress: number;
  fontFamily: string;
}) {
  const progress = clamp(revealProgress);

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 14}px)`,
        border: `1px solid ${theme.border}`,
        backgroundColor: theme.bg,
        padding: "18px 20px 20px",
        boxSizing: "border-box",
      }}
    >
      <Label>Success condition</Label>
      <p
        style={{
          margin: "12px 0 0",
          fontFamily,
          fontSize: 20,
          lineHeight: 1.55,
          color: theme.text,
        }}
      >
        {text}
      </p>
    </div>
  );
}
