import type { Metadata } from "next";
import { PlaceholderView } from "@/components/layout/PlaceholderView";
import { SiteShell } from "@/components/layout/SiteShell";
import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/types";
import { authContent } from "@/lib/auth-content";
import { toSessionUser } from "@/lib/db/users";
import { getSiteChrome } from "@/lib/site-chrome";

const page = authContent.pages.admin;

export const metadata: Metadata = { title: page.metaTitle.te };

export default async function AdminSchemesPage() {
  const user = await requireRole(STAFF_ROLES, "/admin/schemes");

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
