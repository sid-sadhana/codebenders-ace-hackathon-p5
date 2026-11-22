"use client";

import { useState } from "react";
import { AlertTriangle, Info, SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SchemeEvaluation } from "@/lib/eligibility/evaluate";
import type { Recommendation } from "@/lib/eligibility/recommend";
import type { CheckContent } from "@/lib/check-content";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Profile, ProfileField } from "@/types/profile";
import { SchemeCard, type CardActions } from "./SchemeCard";

type ResultsPanelProps = {
  rec: Recommendation;
  facts: Profile;
  hasFacts: boolean;
  content: CheckContent["results"];
  today: Date;
  onAsk: (field: ProfileField) => void;
  actions: CardActions;
};

const TOP_COUNT = 6;

export function ResultsPanel({ rec, facts, hasFacts, content, today, onAsk, actions }: ResultsPanelProps) {
  const { t } = useLanguage();
  const [showNot, setShowNot] = useState(false);
  const [showAllPossibly, setShowAllPossibly] = useState(false);

  if (!hasFacts) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed bg-card p-6 text-muted-foreground">
        <SearchCheck aria-hidden="true" className="size-8 text-primary" />
        <p className="text-base">{t(content.empty)}</p>
      </div>
    );
  }

  const nameOf = (id: string) => {
    const all = [...rec.applyNow, ...rec.notOpenNow];
    const found = all.find((e) => e.scheme.id === id);
    return found ? t(found.scheme.name) : id;
  };

  const likelyCount = [...rec.applyNow, ...rec.notOpenNow].filter((e) => e.eligibility === "likely").length;
  const possiblyCount = [...rec.applyNow, ...rec.notOpenNow].filter((e) => e.eligibility === "possibly").length;

  // Lists arrive ranked by relevance; show the most relevant first.
  const renderList = (items: SchemeEvaluation[], limit: boolean) => {
    const shown = limit && !showAllPossibly ? items.slice(0, TOP_COUNT) : items;
    return (
      <>
        <div className="grid gap-4">
          {shown.map((e) => (
            <SchemeCard key={e.scheme.id} evaluation={e} facts={facts} content={content} today={today} onAsk={onAsk} actions={actions} />
          ))}
        </div>
        {limit && items.length > TOP_COUNT && (
          <Button variant="outline" className="mt-4 h-11 px-4 text-base" onClick={() => setShowAllPossibly((v) => !v)}>
            {showAllPossibly
              ? t(content.hideNotEligible)
              : t(content.showMore).replace("{n}", String(items.length - TOP_COUNT))}
          </Button>
        )}
      </>
    );
  };

  const notOpenShown = rec.notOpenNow;

  return (
    <div className="space-y-10">
      <p className="rounded-xl bg-secondary px-4 py-3 text-base font-medium">
        {t(content.summary).replace("{likely}", String(likelyCount)).replace("{possibly}", String(possiblyCount))}
      </p>

      {rec.conflicts.length > 0 && (
        <div className="space-y-2">
          {rec.conflicts.map(([a, b]) => (
            <p key={`${a}|${b}`} className="flex gap-2 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
              {t(content.conflict).replace("{a}", nameOf(a)).replace("{b}", nameOf(b))}
            </p>
          ))}
        </div>
      )}

      {rec.applyNow.length > 0 && (
        <section aria-labelledby="sec-apply">
          <h2 id="sec-apply" className="mb-4 text-xl font-semibold">
            {t(content.sections.applyNow)}
          </h2>
          {renderList(rec.applyNow, true)}
        </section>
      )}

      {notOpenShown.length > 0 && (
        <section aria-labelledby="sec-closed">
          <h2 id="sec-closed" className="mb-4 text-xl font-semibold">
            {t(content.sections.notOpenNow)}
          </h2>
          {renderList(notOpenShown, false)}
        </section>
      )}

      {rec.stalled.filter((e) => e.eligibility === "likely").length > 0 && (
        <section aria-labelledby="sec-stalled" className="rounded-2xl border border-warning/40 bg-warning/5 p-5">
          <h2 id="sec-stalled" className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle aria-hidden="true" className="size-5 text-warning" />
            {t(content.sections.stalled)}
          </h2>
          <p className="mt-1 text-sm font-medium">{t(content.stalledNote)}</p>
          <ul className="mt-3 space-y-2">
            {rec.stalled
              .filter((e) => e.eligibility === "likely")
              .map((e) => (
                <li key={e.scheme.id} className="text-sm">
                  <span className="font-semibold">{t(e.scheme.name)}</span>
                  <span className="text-muted-foreground"> · {t(e.scheme.benefit)}</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {rec.needsMoreInfo.length > 0 && (
        <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {t(content.needsMoreInfo).replace("{n}", String(rec.needsMoreInfo.length))}
        </p>
      )}

      {rec.notEligible.length > 0 && (
        <section aria-labelledby="sec-not">
          <Button
            variant="ghost"
            className="h-11 px-3 text-base text-muted-foreground"
            aria-expanded={showNot}
            onClick={() => setShowNot((v) => !v)}
          >
            {showNot
              ? t(content.hideNotEligible)
              : t(content.showNotEligible).replace("{n}", String(rec.notEligible.length))}
          </Button>
          {showNot && (
            <>
              <h2 id="sec-not" className="mb-4 mt-4 text-xl font-semibold">
                {t(content.sections.notEligible)}
              </h2>
              <div className="grid gap-4">
                {rec.notEligible.map((e) => (
                  <SchemeCard key={e.scheme.id} evaluation={e} facts={facts} content={content} today={today} onAsk={onAsk} actions={actions} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
