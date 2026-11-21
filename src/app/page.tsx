import { LandingPage } from "@/components/landing/LandingPage";
import { getSessionUser } from "@/lib/auth/session";
import { authContent } from "@/lib/auth-content";
import { landingContent } from "@/lib/landing-content";

export default async function Home() {
  const user = await getSessionUser();

  return <LandingPage content={landingContent} user={user} account={authContent.account} />;
}
