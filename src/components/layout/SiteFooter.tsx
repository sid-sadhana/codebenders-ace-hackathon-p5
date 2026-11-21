"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { LandingContent } from "@/lib/landing-content";

export function SiteFooter({
  footer,
  hrefs,
  showLogin = true,
}: {
  footer: LandingContent["footer"];
  hrefs: LandingContent["hrefs"];
  showLogin?: boolean;
}) {
  const { t } = useLanguage();

  const linkClass =
    "inline-flex min-h-11 items-center underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
          <div>
            <p className="font-medium leading-relaxed">{t(footer.disclaimer)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(footer.freeLine)}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 lg:mt-0">
            <Link href={hrefs.about} className={linkClass}>
              {t(footer.aboutLabel)}
            </Link>
            {showLogin && (
              <Link href={hrefs.login} className={linkClass}>
                {t(footer.loginLabel)}
              </Link>
            )}
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>{t(footer.projectNotice)}</p>
        </div>
      </div>
    </footer>
  );
}
