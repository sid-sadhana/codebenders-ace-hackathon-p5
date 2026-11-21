import { landingContent } from "@/lib/landing-content";
import { LandingPage } from "@/components/landing/LandingPage";

export default function Home() {
  return <LandingPage content={landingContent} />;
}
