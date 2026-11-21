"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ClipboardList, GraduationCap, LogOut, Menu, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { logoutAction } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/auth/types";
import type { AccountContent } from "@/lib/auth-content";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { SiteChrome } from "@/lib/site-chrome";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

type SiteHeaderProps = Pick<SiteChrome, "ui" | "nav" | "hrefs"> & {
  user: SessionUser | null;
  account: AccountContent;
};

const NAV_LINK =
  "inline-flex min-h-11 items-center rounded-md px-3 text-base hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SiteHeader({ ui, nav, hrefs, user, account }: SiteHeaderProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const logoutFormRef = useRef<HTMLFormElement>(null);

  // Section anchors only exist on the landing page.
  const linkHref = (href: string) =>
    href.startsWith("#") && pathname !== "/" ? `/${href}` : href;

  const isStaff = user?.role === "volunteer" || user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full min-w-0 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GraduationCap className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 truncate font-semibold">{t(nav.brandName)}</span>
        </Link>

        <nav aria-label={t(nav.brandName)} className="ml-auto hidden items-center gap-1 md:flex">
          {nav.links.map((link) => (
            <a key={link.href} href={linkHref(link.href)} className={NAV_LINK}>
              {t(link.label)}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <span className="hidden rounded-full border bg-accent/20 px-2 py-0.5 text-sm font-medium text-foreground sm:inline-flex">
            {t(nav.demoPill)}
          </span>

          <LanguageSwitcher groupLabel={ui.languageGroupLabel} options={ui.languageOptions} />

          {user ? (
            <>
              <form ref={logoutFormRef} action={logoutAction} className="hidden" />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="hidden min-h-11 gap-2 rounded-full px-1.5 md:inline-flex"
                      aria-label={`${t(account.menuLabel)}: ${t(user.name)}`}
                    />
                  }
                >
                  <UserAvatar initials={user.initials} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-1.5">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 text-sm text-foreground">
                      <UserAvatar initials={user.initials} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{t(user.name)}</span>
                        <Badge variant="secondary" className="mt-1">
                          {t(account.roles[user.role])}
                        </Badge>
                      </span>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="min-h-10 px-2 text-base"
                    render={<Link href="/tracker" />}
                  >
                    <ClipboardList aria-hidden="true" />
                    {t(account.myTracker)}
                  </DropdownMenuItem>
                  {isStaff && (
                    <DropdownMenuItem
                      className="min-h-10 px-2 text-base"
                      render={<Link href="/admin/schemes" />}
                    >
                      <ShieldCheck aria-hidden="true" />
                      {t(account.admin)}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="min-h-10 px-2 text-base"
                    onClick={() => logoutFormRef.current?.requestSubmit()}
                  >
                    <LogOut aria-hidden="true" />
                    {t(account.logout)}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link
              href={hrefs.login}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden min-h-11 md:inline-flex",
              )}
            >
              {t(nav.loginLabel)}
            </Link>
          )}

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

              {user && (
                <div className="mx-4 flex items-center gap-3 rounded-xl border bg-secondary p-3">
                  <UserAvatar initials={user.initials} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t(user.name)}</p>
                    <Badge variant="outline" className="mt-1 bg-card">
                      {t(account.roles[user.role])}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1 px-4">
                {nav.links.map((link) => (
                  <a
                    key={link.href}
                    href={linkHref(link.href)}
                    onClick={() => setOpen(false)}
                    className={cn(NAV_LINK, "flex")}
                  >
                    {t(link.label)}
                  </a>
                ))}
                {user && (
                  <Link href="/tracker" onClick={() => setOpen(false)} className={cn(NAV_LINK, "flex gap-2")}>
                    <ClipboardList aria-hidden="true" className="size-4" />
                    {t(account.myTracker)}
                  </Link>
                )}
                {isStaff && (
                  <Link href="/admin/schemes" onClick={() => setOpen(false)} className={cn(NAV_LINK, "flex gap-2")}>
                    <ShieldCheck aria-hidden="true" className="size-4" />
                    {t(account.admin)}
                  </Link>
                )}
              </div>

              <div className="flex flex-col gap-3 px-4">
                <LanguageSwitcher groupLabel={ui.languageGroupLabel} options={ui.languageOptions} />
                {user ? (
                  <form action={logoutAction}>
                    <Button type="submit" variant="outline" className="min-h-11 w-full gap-2">
                      <LogOut aria-hidden="true" />
                      {t(account.logout)}
                    </Button>
                  </form>
                ) : (
                  <Link
                    href={hrefs.login}
                    onClick={() => setOpen(false)}
                    className={cn(buttonVariants(), "min-h-11 w-full")}
                  >
                    {t(nav.loginLabel)}
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
