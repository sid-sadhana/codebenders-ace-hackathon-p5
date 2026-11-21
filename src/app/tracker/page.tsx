import type { Metadata } from "next";
import { PlaceholderView } from "@/components/layout/PlaceholderView";
import { SiteShell } from "@/components/layout/SiteShell";
import { requireRole } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/types";
import { authContent } from "@/lib/auth-content";
import { toSessionUser } from "@/lib/db/users";
import { getSiteChrome } from "@/lib/site-chrome";

const page = authContent.pages.tracker;

export const metadata: Metadata = { title: page.metaTitle.te };

export default async function TrackerPage() {
  const user = await requireRole(ROLES, "/tracker");

  return (
    <SiteShell
      chrome={getSiteChrome()}
      account={authContent.account}
      user={toSessionUser(user)}
      title={page.metaTitle}
    >
      <PlaceholderView
        title={page.title}
        text={authContent.pages.placeholder}
        welcome={authContent.pages.welcome}
        name={user.displayName}
      />
    </SiteShell>
  );
}
