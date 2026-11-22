"use client";

import { BellRing, BookmarkCheck, CalendarClock, ChevronRight, FileCheck2 } from "lucide-react";
import { schemes } from "@/data/schemes";
import type { CheckContent } from "@/lib/check-content";
import { checklistFor } from "@/lib/documents";
import type { Facts } from "@/lib/eligibility/evaluate";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { daysUntil, type Tracker } from "@/lib/tracker/useTracker";
import { cn } from "@/lib/utils";

type MyApplicationsProps = {
  tracker: Tracker;
  facts: Facts;
  today: Date;
  content: CheckContent;
  onOpenGuide: (schemeId: string) => void;
};

const DUE_SOON_DAYS = 14;

export function MyApplications({ tracker, facts, today, content, onOpenGuide }: MyApplicationsProps) {
  const { t } = useLanguage();
  const tr = content.tracker;

  const items = schemes
    .filter((scheme) => tracker.tracked[scheme.id])
    .map((scheme) => {
      const entry = tracker.tracked[scheme.id];
      const checklist = checklistFor(scheme, facts);
      const have = new Set(tracker.docs[scheme.id] ?? []);
      const days = scheme.deadline ? daysUntil(scheme.deadline, today) : null;
      return {
        scheme,
        entry,
        days,
        docsDone: checklist.filter((d) => have.has(d.id)).length,
        docsTotal: checklist.length,
      };
    })
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999));

  if (items.length === 0) return null;

  // In-app reminders (demo): tracked, reminders on, not yet applied, closing soon.
  const dueSoon = items.filter(
    (i) =>
      i.entry.remind &&
      i.days !== null &&
      i.days >= 0 &&
      i.days <= DUE_SOON_DAYS &&
      (i.entry.status === "saved" || i.entry.status === "documents_ready"),
  );

  return (
    <section aria-labelledby="my-apps" className="mb-10 space-y-4">
      {dueSoon.map((i) => (
        <button
          key={`due-${i.scheme.id}`}
          type="button"
          onClick={() => onOpenGuide(i.scheme.id)}
          className="flex w-full items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-left text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BellRing aria-hidden="true" className="size-5 shrink-0" />
          <span className="flex-1">
            {(i.days! <= 1 ? t(tr.dueToday) : t(tr.dueSoon).replace("{n}", String(i.days)))
              .replace("{name}", t(i.scheme.name))}
          </span>
          <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
        </button>
      ))}

      <div>
        <h2 id="my-apps" className="flex items-center gap-2 text-xl font-semibold">
          <BookmarkCheck aria-hidden="true" className="size-5 text-primary" />
          {t(tr.title)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(tr.hint)}</p>
      </div>

      <ul className="grid gap-2">
        {items.map((i) => (
          <li key={i.scheme.id}>
            <button
              type="button"
              onClick={() => onOpenGuide(i.scheme.id)}
              className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{t(i.scheme.name)}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-primary">
                    {t(tr.statuses[i.entry.status])}
                  </span>
                  {i.docsTotal > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <FileCheck2 aria-hidden="true" className="size-4" />
                      {t(tr.docsCount).replace("{done}", String(i.docsDone)).replace("{total}", String(i.docsTotal))}
                    </span>
                  )}
                  {i.days !== null && i.days >= 0 && (
                    <span className={cn("inline-flex items-center gap-1", i.days <= DUE_SOON_DAYS && "text-destructive")}>
                      <CalendarClock aria-hidden="true" className="size-4" />
                      {i.days <= 1
                        ? t(content.results.status.lastDay)
                        : t(content.results.status.daysLeft).replace("{n}", String(i.days))}
                    </span>
                  )}
                  {i.entry.remind && <BellRing aria-label={t(tr.remind)} className="size-4 text-primary" />}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
