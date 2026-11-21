import type { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";
import { SiteShell } from "@/components/layout/SiteShell";
import { demoAccounts } from "@/lib/auth/demo-accounts";
import { safeNext } from "@/lib/auth/redirects";
import { authContent } from "@/lib/auth-content";
import { getSiteChrome } from "@/lib/site-chrome";

export const metadata: Metadata = {
  title: authContent.login.metaTitle.te,
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const chrome = getSiteChrome();

  return (
    <SiteShell
      chrome={chrome}
      account={authContent.account}
      user={null}
      title={authContent.login.metaTitle}
    >
      <LoginView
        content={authContent.login}
        accounts={demoAccounts}
        next={safeNext(typeof next === "string" ? next : null)}
        checkHref={chrome.hrefs.check}
      />
    </SiteShell>
  );
}
