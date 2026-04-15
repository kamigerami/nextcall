import { afterEach, describe, expect, it } from "vitest";

import { getAppConfig } from "@/lib/app-config";

const originalAppMode = process.env.APP_MODE;
const originalAnalyzeEnabled = process.env.ANALYZE_ENABLED;
const originalRequestAccessEmail = process.env.NEXT_PUBLIC_REQUEST_ACCESS_EMAIL;

afterEach(() => {
  resetEnv("APP_MODE", originalAppMode);
  resetEnv("ANALYZE_ENABLED", originalAnalyzeEnabled);
  resetEnv("NEXT_PUBLIC_REQUEST_ACCESS_EMAIL", originalRequestAccessEmail);
});

function resetEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

describe("getAppConfig", () => {
  it("falls back to landing mode when APP_MODE is missing", () => {
    delete process.env.APP_MODE;
    process.env.ANALYZE_ENABLED = "true";

    expect(getAppConfig()).toMatchObject({
      appMode: "landing",
      isAppModeValid: false,
      analyzeEnabled: true,
      requestAccessEmail: "access@nextpitch.se",
    });
  });

  it("uses the provided public request access email", () => {
    process.env.APP_MODE = "full";
    process.env.ANALYZE_ENABLED = "false";
    process.env.NEXT_PUBLIC_REQUEST_ACCESS_EMAIL = "founders@example.com";

    expect(getAppConfig()).toMatchObject({
      appMode: "full",
      isAppModeValid: true,
      analyzeEnabled: false,
      requestAccessEmail: "founders@example.com",
    });
  });
});

