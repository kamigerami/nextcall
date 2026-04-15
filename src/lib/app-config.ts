export type AppMode = "landing" | "full";

const DEFAULT_REQUEST_ACCESS_EMAIL = "access@nextpitch.se";

function resolveAppMode(value: string | undefined): {
  mode: AppMode;
  isValid: boolean;
} {
  if (value === "landing" || value === "full") {
    return {
      mode: value,
      isValid: true,
    };
  }

  return {
    mode: "landing",
    isValid: false,
  };
}

function resolveAnalyzeEnabled(value: string | undefined) {
  return value === "true";
}

export function getAppConfig() {
  const appMode = resolveAppMode(process.env.APP_MODE);

  return {
    appMode: appMode.mode,
    isAppModeValid: appMode.isValid,
    analyzeEnabled: resolveAnalyzeEnabled(process.env.ANALYZE_ENABLED),
    requestAccessEmail:
      process.env.NEXT_PUBLIC_REQUEST_ACCESS_EMAIL?.trim() ||
      DEFAULT_REQUEST_ACCESS_EMAIL,
  };
}

