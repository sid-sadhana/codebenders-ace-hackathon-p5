"use client";

import { Bell, BellOff, Bookmark, BookmarkCheck, CalendarClock, Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { CheckContent } from "@/lib/check-content";
import { checklistFor } from "@/lib/documents";
import type { Facts } from "@/lib/eligibility/evaluate";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { daysUntil, reminderDates, TRACK_STATUSES, type Tracker } from "@/lib/tracker/useTracker";
import { cn } from "@/lib/utils";
import type { Scheme } from "@/types/scheme";

type SchemeGuideProps = {
  scheme: Scheme | null;
  facts: Facts;
  today: Date;
  tracker: Tracker;
  content: CheckContent;
  onClose: () => void;
};

function formatDate(date: Date, lang: "te" | "en"): string {
  return new Intl.DateTimeFormat(lang === "te" ? "te-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function SchemeGuide({ scheme, facts, today, tracker, content, onClose }: SchemeGuideProps) {
  const { t, lang } = useLanguage();
  const g = content.guide;
  const tr = content.tracker;

  return (
    <Sheet open={scheme !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" showCloseButton={false} className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {scheme && (() => {
          const checklist = checklistFor(scheme, facts);
          const have = new Set(tracker.docs[scheme.id] ?? []);
          const done = checklist.filter((d) => have.has(d.id)).length;
          const tracked = tracker.tracked[scheme.id];
          const reminders = reminderDates(scheme.deadline, today);
          const days = scheme.deadline ? daysUntil(scheme.deadline, today) : null;

          return (
            <>
              <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-background px-5 py-4">
                <div className="min-w-0">
                  <SheetTitle className="text-xl font-semibold leading-snug">{t(scheme.name)}</SheetTitle>
                  <SheetDescription className="mt-1 text-sm text-muted-foreground">{t(g.howToApply)}</SheetDescription>
                </div>
                <Button variant="ghost" size="icon" className="size-10 shrink-0" onClick={onClose} aria-label={t(g.close)}>
                  <X aria-hidden="true" />
                </Button>
              </div>

              <div className="space-y-8 px-5 py-6">
                <p className="text-base">{t(scheme.benefit)}</p>

                {/* Tracking and reminders (demo, stored on this device) */}
                <section className="space-y-4 rounded-2xl border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {days !== null && days >= 0 ? (
                      <p className={cn("flex items-center gap-2 text-sm font-medium", days <= 14 ? "text-destructive" : "text-foreground")}>
                        <CalendarClock aria-hidden="true" className="size-4" />
                        {days <= 1
                          ? t(content.results.status.lastDay)
                          : t(content.results.status.daysLeft).replace("{n}", String(days))}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {scheme.usualWindow ? t(scheme.usualWindow) : t(content.results.status.rolling)}
                      </p>
                    )}
                    <Button
                      variant={tracked ? "secondary" : "default"}
                      className="h-10 gap-2 px-4"
                      onClick={() => tracker.toggleTracked(scheme.id)}
                      aria-pressed={Boolean(tracked)}
                    >
                      {tracked ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
                      {t(tracked ? tr.tracking : tr.track)}
                    </Button>
                  </div>

                  {tracked && (
                    <>
                      <fieldset>
                        <legend className="mb-2 text-sm font-semibold">{t(tr.statusLabel)}</legend>
                        <div className="flex flex-wrap gap-2">
                          {TRACK_STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              aria-pressed={tracked.status === status}
                              onClick={() => tracker.setStatus(scheme.id, status)}
                              className={cn(
                                "inline-flex min-h-10 items-center rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                tracked.status === status
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "bg-card hover:border-primary",
                              )}
                            >
                              {t(tr.statuses[status])}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <div className="space-y-1">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={tracked.remind}
                          onClick={() => tracker.setRemind(scheme.id, !tracked.remind)}
                          className="flex min-h-10 items-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                        >
                          {tracked.remind ? (
                            <Bell aria-hidden="true" className="size-4 text-primary" />
                          ) : (
                            <BellOff aria-hidden="true" className="size-4 text-muted-foreground" />
                          )}
                          {t(tr.remind)}
                        </button>
                        {tracked.remind && (
                          <p className="text-sm text-muted-foreground">
                            {reminders.length > 0
                              ? t(tr.remindOn).replace("{dates}", reminders.map((d) => formatDate(d, lang)).join(", "))
                              : t(tr.remindNoDate)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">{t(tr.remindDemo)}</p>
                      </div>
                    </>
                  )}
                </section>

                {/* Personalised document checklist */}
                <section aria-labelledby="guide-docs" className="space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 id="guide-docs" className="text-lg font-semibold">
                      {t(g.documents)}
                    </h3>
                    {checklist.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {t(g.docsProgress).replace("{done}", String(done)).replace("{total}", String(checklist.length))}
                      </span>
                    )}
                  </div>
                  {checklist.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t(g.noDocs)}</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">{t(g.docsHint)}</p>
                      <ul className="space-y-2">
                        {checklist.map((doc) => {
                          const checked = have.has(doc.id);
                          return (
                            <li key={doc.id}>
                              <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 hover:border-primary">
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={checked}
                                  onChange={() => tracker.toggleDoc(scheme.id, doc.id)}
                                />
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                                    checked ? "border-primary bg-primary text-primary-foreground" : "bg-background",
                                  )}
                                >
                                  {checked && <Check className="size-3.5" />}
                                </span>
                                <span className="min-w-0">
                                  <span className={cn("block font-medium", checked && "text-muted-foreground line-through")}>
                                    {t(doc.name)}
                                  </span>
                                  <span className="block text-sm text-muted-foreground">
                                    {t(g.whereToGet)}: {t(doc.whereToGet)}
                                  </span>
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </section>

                {/* Step-by-step guide */}
                {scheme.steps.length > 0 && (
                  <section aria-labelledby="guide-steps" className="space-y-3">
                    <h3 id="guide-steps" className="text-lg font-semibold">
                      {t(g.steps)}
                    </h3>
                    <ol className="space-y-3">
                      {scheme.steps.map((step, index) => (
                        <li key={step.en} className="flex gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                            {index + 1}
                          </span>
                          <p className="pt-0.5 text-base">{t(step)}</p>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {/* Official source */}
                <section className="space-y-1 border-t pt-4 text-sm">
                  <a
                    href={scheme.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t(content.results.officialSite)}
                    <ExternalLink aria-hidden="true" className="size-4" />
                    <span className="sr-only">{t(content.results.opensNewTab)}</span>
                  </a>
                  <p className="text-muted-foreground">
                    {t(content.results.lastVerified).replace(
                      "{date}",
                      formatDate(new Date(`${scheme.lastVerified}T00:00:00+05:30`), lang),
                    )}
                    {scheme.needsVerification && ` · ${t(content.results.pending)}`}
                  </p>
                </section>
              </div>
            </>
          );
        })()}
      </SheetContent>
    </Sheet>
  );
}
