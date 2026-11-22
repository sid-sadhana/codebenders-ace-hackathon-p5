"use client";

import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  ClipboardList,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LocalizedString } from "@/lib/i18n/types";
import type { RuleOutcome, SchemeEvaluation } from "@/lib/eligibility/evaluate";
import type { CheckContent } from "@/lib/check-content";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { FIELD_SPEC_BY_FIELD, formatFactValue } from "@/lib/profile/fields";
import { cn } from "@/lib/utils";
import type { Profile, ProfileField } from "@/types/profile";

export type CardActions = {
  labels: { howToApply: LocalizedString; track: LocalizedString; tracking: LocalizedString };
  isTracked: (schemeId: string) => boolean;
  onToggleTrack: (schemeId: string) => void;
  onOpenGuide: (schemeId: string) => void;
};

type SchemeCardProps = {
  evaluation: SchemeEvaluation;
  facts: Profile;
  content: CheckContent["results"];
  today: Date;
  onAsk: (field: ProfileField) => void;
  actions: CardActions;
};

const OUTCOME_ICON: Record<RuleOutcome, typeof CheckCircle2> = {
  pass: CheckCircle2,
  fail: XCircle,
  unknown: CircleHelp,
  assumed: AlertTriangle,
};

const OUTCOME_COLOR: Record<RuleOutcome, string> = {
  pass: "text-success",
  fail: "text-destructive",
  unknown: "text-muted-foreground",
  assumed: "text-warning",
};

function formatDate(iso: string, lang: "te" | "en"): string {
  return new Intl.DateTimeFormat(lang === "te" ? "te-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00+05:30`));
}

export function SchemeCard({ evaluation, facts, content, today, onAsk, actions }: SchemeCardProps) {
  const { t, lang } = useLanguage();
  const { scheme, eligibility, results } = evaluation;
  const tracked = actions.isTracked(scheme.id);

  const statusLine = (() => {
    if (scheme.status === "open" && scheme.deadline) {
      const end = new Date(`${scheme.deadline}T23:59:59+05:30`);
      const days = Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
      if (days >= 0) {
        const when = t(content.status.deadline).replace("{date}", formatDate(scheme.deadline, lang));
        const left = days <= 1 ? t(content.status.lastDay) : t(content.status.daysLeft).replace("{n}", String(days));
        return { text: `${when} · ${left}`, urgent: days <= 14 };
      }
    }
    if (scheme.status === "rolling" || (scheme.status === "open" && !scheme.deadline)) {
      return { text: scheme.usualWindow ? t(scheme.usualWindow) : t(content.status.rolling), urgent: false };
    }
    if (scheme.status === "automatic") {
      return { text: scheme.usualWindow ? t(scheme.usualWindow) : t(content.status.automatic), urgent: false };
    }
    return { text: scheme.usualWindow ? t(scheme.usualWindow) : t(content.status.closed), urgent: false };
  })();

  const badgeClass =
    eligibility === "likely"
      ? "bg-success/10 text-success"
      : eligibility === "possibly"
        ? "bg-warning/10 text-warning"
        : "bg-muted text-muted-foreground";

  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={cn("h-6 px-2.5 text-xs", badgeClass)}>{t(content.eligibility[eligibility])}</Badge>
        <Badge variant="outline" className="h-6 px-2.5 text-xs">
          {t(content.level[scheme.level])}
        </Badge>
        {scheme.needsVerification && (
          <Badge variant="outline" className="h-6 border-warning/40 px-2.5 text-xs text-warning">
            {t(content.pending)}
          </Badge>
        )}
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug">{t(scheme.name)}</h3>
      <p className="mt-1 text-base">{t(scheme.benefit)}</p>

      <p
        className={cn(
          "mt-3 flex items-start gap-2 text-sm",
          statusLine.urgent ? "font-medium text-destructive" : "text-muted-foreground",
        )}
      >
        {scheme.status === "automatic" ? (
          <RefreshCcw aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        ) : (
          <CalendarClock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        )}
        <span>{statusLine.text}</span>
      </p>

      <details className="group mt-4 rounded-xl bg-secondary/60 px-4 py-3" open={eligibility !== "likely"}>
        <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
          {t(content.why)}
        </summary>
        <ul className="mt-3 space-y-2">
          {results.map((r) => {
            const Icon = OUTCOME_ICON[r.outcome];
            const said = r.fields
              .filter((f) => facts[f] !== undefined)
              .map((f) => {
                const label = FIELD_SPEC_BY_FIELD.get(f)?.label;
                return `${label ? t(label) : f}: ${formatFactValue(f, facts[f], lang)}`;
              });
            const ask = r.missing[0];
            return (
              <li key={r.rule.id} className="flex gap-2 text-sm">
                <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", OUTCOME_COLOR[r.outcome])} />
                <div className="min-w-0">
                  <p>
                    <span className="sr-only">{t(content.outcome[r.outcome])}: </span>
                    {t(r.rule.text)}
                  </p>
                  {said.length > 0 && r.outcome !== "unknown" && (
                    <p className="text-muted-foreground">
                      {t(content.youSaid)}: {said.join(", ")}
                    </p>
                  )}
                  {(r.outcome === "unknown" || r.outcome === "assumed") && ask && (
                    <button
                      type="button"
                      onClick={() => onAsk(ask)}
                      className="mt-1 inline-flex min-h-9 items-center rounded-full border border-primary/40 px-3 text-sm font-medium text-primary hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {t(r.outcome === "assumed" ? content.outcome.assumed : content.answerToConfirm)}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {scheme.alsoRequired.length > 0 && (
          <div className="mt-3 border-t pt-3 text-sm">
            <p className="font-semibold">{t(content.alsoNeeded)}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
              {scheme.alsoRequired.map((item) => (
                <li key={item.en}>{t(item)}</li>
              ))}
            </ul>
          </div>
        )}
      </details>

      {eligibility !== "not" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="h-11 gap-2 px-4 text-base" onClick={() => actions.onOpenGuide(scheme.id)}>
            <ClipboardList aria-hidden="true" />
            {t(actions.labels.howToApply)}
          </Button>
          <Button
            variant={tracked ? "secondary" : "outline"}
            className="h-11 gap-2 px-4 text-base"
            aria-pressed={tracked}
            onClick={() => actions.onToggleTrack(scheme.id)}
          >
            {tracked ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
            {t(tracked ? actions.labels.tracking : actions.labels.track)}
          </Button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <a
          href={scheme.officialSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {t(content.officialSite)}
          <ExternalLink aria-hidden="true" className="size-4" />
          <span className="sr-only">{t(content.opensNewTab)}</span>
        </a>
        <span className="text-muted-foreground">
          {t(content.lastVerified).replace("{date}", formatDate(scheme.lastVerified, lang))}
        </span>
      </div>
    </article>
  );
}
