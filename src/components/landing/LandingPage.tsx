"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  FileText,
  FolderCheck,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  Home,
  Info,
  Mic,
  MessageCircleQuestion,
  Route,
  Scale,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Sprout,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DocumentTitle } from "@/components/i18n/DocumentTitle";
import { SiteFooter } from "@/components/layout/SiteFooter";
import type { SessionUser } from "@/lib/auth/types";
import type { AccountContent } from "@/lib/auth-content";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ExampleStatus, GroupIcon, LandingContent } from "@/lib/landing-content";
import { cn } from "@/lib/utils";
import { HeroUseCases } from "./HeroUseCases";
import { SectionHeader } from "./SectionHeader";
import { SiteHeader } from "./SiteHeader";

type LandingPageProps = {
  content: LandingContent;
  user: SessionUser | null;
  account: AccountContent;
};

const PROBLEM_ICONS: LucideIcon[] = [Shuffle, FileQuestion, Wallet];
const HOW_ICONS: LucideIcon[] = [FileText, Sparkles, ClipboardList, CalendarClock];
const FEATURE_ICONS: LucideIcon[] = [
  Mic,
  Scale,
  MessageCircleQuestion,
  FolderCheck,
  Route,
  BellRing,
  Info,
  ShieldCheck,
];
const GROUP_ICONS: Record<GroupIcon, LucideIcon> = {
  GraduationCap,
  HeartHandshake,
  Sprout,
  Users,
  Home,
};
const STATUS_STYLES: Record<ExampleStatus, { Icon: LucideIcon; className: string }> = {
  likely: {
    Icon: CheckCircle2,
    className: "border-[color:var(--success)] bg-transparent text-[color:var(--success)]",
  },
  maybe: {
    Icon: HelpCircle,
    className: "border-[color:var(--warning)] bg-transparent text-[color:var(--warning)]",
  },
  announced: {
    Icon: AlertTriangle,
    className: "border-[color:var(--neutral)] bg-transparent text-foreground",
  },
};

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";
const SECTION = "py-12 sm:py-16 lg:py-20";
const CARD = "h-full rounded-2xl border bg-card p-6 shadow-sm";
const ICON_TILE =
  "mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary";

export function LandingPage({ content, user, account }: LandingPageProps) {
  const { t } = useLanguage();

  return (
    <>
      <DocumentTitle title={content.meta.title} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:ring-2 focus:ring-primary"
      >
        {t(content.ui.skipToContent)}
      </a>

      <SiteHeader
        ui={content.ui}
        nav={content.nav}
        hrefs={content.hrefs}
        user={user}
        account={account}
      />

      <main id="main">
        <HeroUseCases content={content.hero} hrefs={content.hrefs} />

        {/* Problem */}
        <section aria-labelledby="problem-title" className={cn(SECTION, "bg-background")}>
          <div className={CONTAINER}>
            <SectionHeader
              id="problem-title"
              title={content.problem.title}
              intro={content.problem.intro}
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {content.problem.items.map((item, i) => {
                const Icon = PROBLEM_ICONS[i] ?? Shuffle;
                return (
                  <div key={i} className={CARD}>
                    <div className={ICON_TILE}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold sm:text-xl">{t(item.title)}</h3>
                    <p className="mt-2 text-base text-muted-foreground">{t(item.text)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          aria-labelledby="how-title"
          className={cn(SECTION, "bg-muted")}
        >
          <div className={CONTAINER}>
            <SectionHeader id="how-title" title={content.how.title} intro={content.how.intro} />
            <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {content.how.steps.map((step, i) => {
                const Icon = HOW_ICONS[i] ?? FileText;
                return (
                  <li key={i} className={CARD}>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold sm:text-xl">{t(step.title)}</h3>
                    <p className="mt-2 text-base text-muted-foreground">{t(step.text)}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          aria-labelledby="features-title"
          className={cn(SECTION, "bg-background")}
        >
          <div className={CONTAINER}>
            <SectionHeader
              id="features-title"
              title={content.features.title}
              intro={content.features.intro}
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {content.features.items.map((item, i) => {
                const Icon = FEATURE_ICONS[i] ?? Info;
                return (
                  <div key={i} className={CARD}>
                    <div className={ICON_TILE}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold sm:text-xl">{t(item.title)}</h3>
                    <p className="mt-2 text-base text-muted-foreground">{t(item.text)}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-center text-base text-muted-foreground">
              {t(content.features.adminNote)}
            </p>
          </div>
        </section>

        {/* Examples */}
        <section id="examples" aria-labelledby="example-title" className={cn(SECTION, "bg-muted")}>
          <div className={CONTAINER}>
            <SectionHeader
              id="example-title"
              title={content.example.title}
              intro={content.example.intro}
            />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {content.example.cards.map((card) => {
                const status = STATUS_STYLES[card.status];
                const StatusIcon = status.Icon;
                return (
                  <div
                    key={card.id}
                    className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="secondary">{t(content.example.badge)}</Badge>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t(card.groupLabel)}
                      </p>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold sm:text-xl">
                      {t(card.schemeName)}
                    </h3>
                    <div>
                      <Badge className={cn("mt-3 h-auto gap-1 text-sm font-medium", status.className)}>
                        <StatusIcon aria-hidden="true" />
                        {t(card.statusLabel)}
                      </Badge>
                    </div>
                    {card.pendingVerification ? (
                      <div>
                        <Badge variant="outline" className="mt-2 h-auto gap-1 text-sm">
                          <AlertTriangle aria-hidden="true" />
                          {t(content.example.pendingLabel)}
                        </Badge>
                      </div>
                    ) : null}
                    {card.why.length > 0 ? (
                      <>
                        <h4 className="mt-4 text-base font-semibold">
                          {t(content.example.whyTitle)}
                        </h4>
                        <ul className="mt-2 space-y-2">
                          {card.why.map((item, i) => (
                            <li key={i} className="text-base leading-relaxed">
                              <span aria-hidden="true" className="mr-2">
                                {item.kind === "ok" ? "✅" : "❓"}
                              </span>
                              {t(item.text)}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {card.questionRow ? (
                      <div className="mt-4 rounded-xl bg-muted p-3">
                        <p className="text-base font-medium">{t(card.questionRow.question)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {card.questionRow.options.map((option, i) => (
                            <span
                              key={i}
                              className="rounded-full border bg-card px-3 py-1 text-sm"
                            >
                              {t(option)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {card.benefit ? (
                      <p className="mt-4 text-base font-medium">{t(card.benefit)}</p>
                    ) : null}
                    {card.statusLine ? (
                      <p className="mt-2 text-sm text-muted-foreground">{t(card.statusLine)}</p>
                    ) : null}
                    {card.note ? (
                      <p className="mt-3 text-sm text-muted-foreground">{t(card.note)}</p>
                    ) : null}
                    {card.source ? (
                      <div className="mt-auto border-t pt-4 text-sm text-muted-foreground">
                        <p>
                          {t(content.example.sourceLabel)}{" "}
                          <a
                            href={card.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {card.source.host}
                            <span className="sr-only"> {t(content.ui.opensNewTab)}</span>
                          </a>{" "}
                          · {t(content.example.verifiedLabel)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-center text-sm italic text-muted-foreground">
              {t(content.example.illustrativeNote)}
            </p>
          </div>
        </section>

        {/* Audience */}
        <section aria-labelledby="audience-title" className={cn(SECTION, "bg-background")}>
          <div className={CONTAINER}>
            <SectionHeader
              id="audience-title"
              title={content.audience.title}
              intro={content.audience.intro}
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {content.audience.groups.map((group) => {
                const Icon = GROUP_ICONS[group.icon];
                return (
                  <div key={group.id} className={CARD}>
                    <div className={ICON_TILE}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold sm:text-xl">{t(group.title)}</h3>
                    <ul className="mt-3 space-y-1">
                      {group.schemes.map((scheme, i) => (
                        <li key={i} className="text-base text-muted-foreground">
                          {t(scheme)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-title" className={cn(SECTION, "bg-muted")}>
          <div className={CONTAINER}>
            <SectionHeader id="faq-title" title={content.faq.title} intro={content.faq.intro} />
            <div className="mx-auto mt-10 max-w-3xl">
              <Accordion className="w-full">
                {content.faq.items.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="min-h-11 text-left text-base font-semibold">
                      {t(item.question)}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {t(item.answer)}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section aria-labelledby="cta-title" className={cn(SECTION, "bg-background")}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-3xl rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground sm:px-10">
              <h2 id="cta-title" className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                {t(content.cta.title)}
              </h2>
              <p className="mx-auto mt-3 max-w-prose text-base">{t(content.cta.text)}</p>
              <Link
                href={content.hrefs.check}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "mt-6 h-11 w-full sm:w-auto",
                )}
              >
                {t(content.cta.primaryCta)}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter footer={content.footer} hrefs={content.hrefs} showLogin={!user} />
    </>
  );
}
