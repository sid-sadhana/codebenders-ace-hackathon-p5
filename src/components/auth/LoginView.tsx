"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BellRing, Bookmark, ChevronRight, History, Info, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { demoLoginAction, type LoginState } from "@/lib/auth/actions";
import type { DemoAccount } from "@/lib/auth/demo-accounts";
import type { LoginContent } from "@/lib/auth-content";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { LoginForm } from "./LoginForm";

type GroupKey = keyof LoginContent["groups"];
const GROUP_ORDER: GroupKey[] = ["student", "senior", "farmer", "women", "family", "staff"];
const BENEFIT_ICONS = [Bookmark, BellRing, History];

const initialState: LoginState = { error: null };

type LoginViewProps = {
  content: LoginContent;
  accounts: DemoAccount[];
  next: string | null;
  checkHref: string;
};

export function LoginView({ content, accounts, next, checkHref }: LoginViewProps) {
  const { t } = useLanguage();
  const [demoState, demoAction, demoPending] = useActionState(demoLoginAction, initialState);
  const [chosen, setChosen] = useState<string | null>(null);

  const groups = GROUP_ORDER.map((key) => ({
    key,
    accounts: accounts.filter((account) => (account.group ?? "staff") === key),
  })).filter((group) => group.accounts.length > 0);

  return (
    <section className="bg-secondary py-10 sm:py-14 lg:py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:px-8">
        <div className="lg:col-span-5 lg:row-start-1">
          <h1 className="text-3xl font-bold sm:text-4xl">{t(content.title)}</h1>
          <p className="mt-3 max-w-prose text-lg text-muted-foreground">{t(content.subtitle)}</p>
        </div>

        <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm sm:p-8 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <div
            role="note"
            className="flex gap-3 rounded-xl border border-accent/50 bg-accent/10 p-4 text-sm leading-relaxed"
          >
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <p>{t(content.demoNotice)}</p>
          </div>

          <h2 className="mt-6 text-xl font-semibold">{t(content.quickLoginHeading)}</h2>

          <form action={demoAction} className="mt-4">
            {next && <input type="hidden" name="next" value={next} />}
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-5">
              {groups.map((group) => (
                <div key={group.key} className="min-w-0">
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    {t(content.groups[group.key])}
                  </h3>
                  <ul className="space-y-2">
                    {group.accounts.map((account) => {
                      const loading = demoPending && chosen === account.username;
                      return (
                        <li key={account.username}>
                          <button
                            type="submit"
                            name="username"
                            value={account.username}
                            disabled={demoPending}
                            onClick={() => setChosen(account.username)}
                            className="flex min-h-11 w-full items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70"
                          >
                            <UserAvatar initials={account.avatarInitials} />
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium">{t(account.displayName)}</span>
                              <span className="block text-sm leading-snug text-muted-foreground">
                                {t(account.useCase)}
                              </span>
                            </span>
                            {loading ? (
                              <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin text-primary" />
                            ) : (
                              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            {demoState.error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {t(content.errors[demoState.error])}
              </p>
            )}
          </form>

          <div className="my-8 flex items-center gap-3 text-sm text-muted-foreground">
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
            <h2 className="font-medium">{t(content.formHeading)}</h2>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          </div>

          <LoginForm content={content} next={next} />

          <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">{t(content.guestNote)}</p>
            <Link
              href={checkHref}
              className={cn(buttonVariants({ variant: "outline" }), "h-11 px-4 text-base")}
            >
              {t(content.guestCta)}
            </Link>
          </div>
        </div>

        <ul className="space-y-4 lg:col-span-5 lg:row-start-2 lg:self-start">
          {content.benefits.map((benefit, index) => {
            const Icon = BENEFIT_ICONS[index] ?? Bookmark;
            return (
              <li key={benefit.en} className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="pt-2 text-base">{t(benefit)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
