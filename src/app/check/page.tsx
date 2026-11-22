import type { Metadata } from "next";
import { CheckView } from "@/components/check/CheckView";
import { SiteShell } from "@/components/layout/SiteShell";
import { getSession, getSessionUser } from "@/lib/auth/session";
import { authContent } from "@/lib/auth-content";
import { checkContent } from "@/lib/check-content";
import { getSiteChrome } from "@/lib/site-chrome";

const page = authContent.pages.check;

export const metadata: Metadata = { title: page.metaTitle.te };

export default async function CheckPage() {
  const sessionUser = await getSessionUser();
  const user = sessionUser ? await getSession().catch(() => null) : null;
  const saved = user?.profile ? { name: user.displayName, profile: user.profile } : null;

  const chrome = getSiteChrome();

  return (
    <SiteShell
      chrome={chrome}
      account={authContent.account}
      user={sessionUser}
      title={page.metaTitle}
      footerMobileOnly
    >
      <CheckView
        content={checkContent}
        saved={saved}
        notice={{ disclaimer: chrome.footer.disclaimer, projectNotice: chrome.footer.projectNotice }}
        owner={sessionUser?.id ?? "guest"}
      />
    </SiteShell>
  );
}
