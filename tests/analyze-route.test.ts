import { afterEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/analyze/route";

const originalAppMode = process.env.APP_MODE;
const originalAnalyzeEnabled = process.env.ANALYZE_ENABLED;

afterEach(() => {
  resetEnv("APP_MODE", originalAppMode);
  resetEnv("ANALYZE_ENABLED", originalAnalyzeEnabled);
});

function resetEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

describe("POST /api/analyze access control", () => {
  it("returns 404 outside full mode before touching model logic", async () => {
    process.env.APP_MODE = "landing";
    process.env.ANALYZE_ENABLED = "true";

    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "initial", idea: "test" }),
      }),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("x-nextpitch-blocked")).toBe("true");
    await expect(response.json()).resolves.toEqual({ error: "Not found." });
  });

  it("returns 503 when analyze is paused in full mode", async () => {
    process.env.APP_MODE = "full";
    process.env.ANALYZE_ENABLED = "false";

    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: "initial", idea: "test" }),
      }),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("x-nextpitch-blocked")).toBe("true");
    await expect(response.json()).resolves.toEqual({
      error: "Analyzer temporarily paused. Try again later.",
    });
  });
});
