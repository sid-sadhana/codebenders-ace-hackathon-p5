"use client";

import Link from "next/link";
import { useState } from "react";
import { GraduationCap, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { LandingContent } from "@/lib/landing-content";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

type SiteHeaderProps = {
  content: LandingContent;
};

export function SiteHeader({ content }: SiteHeaderProps) {
  const { t } = useLanguage();
  const { ui, nav, hrefs } = content;
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8 min-w-0">
        <Link
          href="/"
          className="inline-flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GraduationCap className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate min-w-0 font-semibold">{t(nav.brandName)}</span>
        </Link>

        <nav
          aria-label={t(nav.brandName)}
          className="ml-auto hidden items-center gap-1 md:flex"
        >
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-base hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t(link.label)}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <span className="hidden rounded-full border bg-accent/20 px-2 py-0.5 text-sm font-medium text-foreground sm:inline-flex">
            {t(nav.demoPill)}
          </span>

          <LanguageSwitcher
            groupLabel={ui.languageGroupLabel}
            options={ui.languageOptions}
          />

          <Link
            href={hrefs.login}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "hidden min-h-11 md:inline-flex",
            )}
          >
            {t(nav.loginLabel)}
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-11 min-w-11 md:hidden"
                  aria-label={t(ui.mobileMenuOpen)}
                >
                  <Menu aria-hidden="true" />
                </Button>
              }
            />
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{t(ui.mobileMenuTitle)}</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-1 px-4">
                {nav.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-md px-3 text-base hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t(link.label)}
                  </a>
                ))}
              </div>

              <div className="flex flex-col gap-3 px-4">
                <LanguageSwitcher
                  groupLabel={ui.languageGroupLabel}
                  options={ui.languageOptions}
                />
                <Link
                  href={hrefs.login}
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants(), "w-full min-h-11")}
                >
                  {t(nav.loginLabel)}
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
