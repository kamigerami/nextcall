import { LandingPage } from "@/components/landing-page";
import { getAppConfig } from "@/lib/app-config";

export default async function Home() {
  const { appMode } = getAppConfig();

  if (appMode === "full") {
    const { IdeaValidatorApp } = await import("@/components/idea-validator-app");

    return <IdeaValidatorApp />;
  }

  return <LandingPage />;
}
