"use client";

import { DocumentTitle } from "@/components/i18n/DocumentTitle";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import type { SessionUser } from "@/lib/auth/types";
import type { AccountContent } from "@/lib/auth-content";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { LocalizedString } from "@/lib/i18n/types";
import type { SiteChrome } from "@/lib/site-chrome";

type SiteShellProps = {
  chrome: SiteChrome;
  account: AccountContent;
  user: SessionUser | null;
  title: LocalizedString;
  children: React.ReactNode;
};

export function SiteShell({ chrome, account, user, title, children }: SiteShellProps) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-dvh flex-col">
      <DocumentTitle title={title} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:ring-2 focus:ring-primary"
      >
        {t(chrome.ui.skipToContent)}
      </a>
      <SiteHeader ui={chrome.ui} nav={chrome.nav} hrefs={chrome.hrefs} user={user} account={account} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter footer={chrome.footer} hrefs={chrome.hrefs} showLogin={!user} />
    </div>
  );
}
