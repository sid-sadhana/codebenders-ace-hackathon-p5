import type { Metadata } from "next";
import { PlaceholderView } from "@/components/layout/PlaceholderView";
import { SiteShell } from "@/components/layout/SiteShell";
import { getSessionUser } from "@/lib/auth/session";
import { authContent } from "@/lib/auth-content";
import { getSiteChrome } from "@/lib/site-chrome";

const page = authContent.pages.check;

export const metadata: Metadata = { title: page.metaTitle.te };

export default async function CheckPage() {
  const user = await getSessionUser();

  return (
    <SiteShell chrome={getSiteChrome()} account={authContent.account} user={user} title={page.metaTitle}>
      <PlaceholderView title={page.title} text={authContent.pages.placeholder} />
    </SiteShell>
  );
}
