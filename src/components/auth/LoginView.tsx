"use client";

import Link from "next/link";
import { useState } from "react";
import { Info } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { DemoAccount } from "@/lib/auth/demo-accounts";
import type { LoginContent } from "@/lib/auth-content";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { LoginForm, type PickedUsername } from "./LoginForm";

type GroupKey = keyof LoginContent["groups"];
const GROUP_ORDER: GroupKey[] = ["student", "senior", "farmer", "women", "family", "staff"];

type LoginViewProps = {
  content: LoginContent;
  accounts: DemoAccount[];
  next: string | null;
  checkHref: string;
};

export function LoginView({ content, accounts, next, checkHref }: LoginViewProps) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<PickedUsername>(null);

  const groups = GROUP_ORDER.map((key) => ({
    key,
    usernames: accounts
      .filter((account) => (account.group ?? "staff") === key)
      .map((account) => account.username),
  })).filter((group) => group.usernames.length > 0);

  return (
    <section className="bg-secondary py-10 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold sm:text-4xl">{t(content.title)}</h1>

        <div className="mt-6 min-w-0 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
          <div
            role="note"
            className="flex gap-3 rounded-xl border border-accent/50 bg-accent/10 p-4 text-sm leading-relaxed"
          >
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <p>{t(content.demoNotice)}</p>
          </div>

          <h2 className="mt-6 text-xl font-semibold">{t(content.quickLoginHeading)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t(content.usernamesHint)}</p>

          <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {groups.map((group) => (
              <div key={group.key} className="min-w-0">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {t(content.groups[group.key])}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {group.usernames.map((username) => {
                    const active = picked?.username === username;
                    return (
                      <li key={username}>
                        <button
                          type="button"
                          onClick={() => setPicked({ username, at: Date.now() })}
                          aria-pressed={active}
                          className={cn(
                            "inline-flex min-h-11 items-center rounded-full border px-4 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "bg-card hover:border-primary hover:bg-secondary",
                          )}
                        >
                          {username}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="mt-8 border-t pt-6 text-xl font-semibold">{t(content.formHeading)}</h2>
          <div className="mt-4">
            <LoginForm content={content} next={next} picked={picked} />
          </div>

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
      </div>
    </section>
  );
}
