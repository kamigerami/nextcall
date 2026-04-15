import { theme } from "../styles/theme";

export function Cursor({
  left,
  top,
  scale = 1,
  clickProgress = 0,
}: {
  left: number;
  top: number;
  scale?: number;
  clickProgress?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        pointerEvents: "none",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 6,
          top: 7,
          width: 34 + clickProgress * 16,
          height: 34 + clickProgress * 16,
          border: `1px solid rgba(17, 17, 17, ${0.18 * (1 - clickProgress)})`,
          borderRadius: 999,
          transform: `translate(-50%, -50%) scale(${0.9 + clickProgress * 0.18})`,
        }}
      />
      <svg width="30" height="38" viewBox="0 0 30 38" fill="none">
        <path
          d="M4 2L24.8 19.1L16 20.9L21.8 33.5L16.1 35.8L10.3 23.3L4 30V2Z"
          fill={theme.text}
          stroke={theme.bg}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
