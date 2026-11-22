"use client";

import { useMemo, useState, useTransition } from "react";
import { Keyboard, ListChecks, Loader2, RotateCcw, Sparkles, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { schemes } from "@/data/schemes";
import { applyAnswer, questionFor, type AnswerValue } from "@/lib/eligibility/questions";
import { recommend } from "@/lib/eligibility/recommend";
import { understandAction } from "@/lib/extract/actions";
import { MAX_INPUT_CHARS } from "@/lib/extract/limits";
import type { CheckContent } from "@/lib/check-content";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { LocalizedString } from "@/lib/i18n/types";
import { FIELD_SPECS, formatFactValue } from "@/lib/profile/fields";
import { cn } from "@/lib/utils";
import type { Profile, ProfileField } from "@/types/profile";
import { useTracker } from "@/lib/tracker/useTracker";
import { AnswerDialog, type DialogItem } from "./AnswerDialog";
import { MyApplications } from "./MyApplications";
import { SchemeGuide } from "./SchemeGuide";
import { QuestionCard } from "./QuestionCard";
import { ResultsPanel } from "./ResultsPanel";

type Mode = "text" | "questions";

// Independent scrolling on desktop; normal page flow on smaller screens.
const PANEL =
  "min-w-0 lg:overflow-y-auto lg:overscroll-contain lg:px-1 lg:py-10 lg:pr-3 lg:[scrollbar-gutter:stable]";
type ReadError = keyof CheckContent["text"]["errors"];

type CheckViewProps = {
  content: CheckContent;
  saved: { name: LocalizedString; profile: Profile } | null;
  /** Shown at the bottom of the left panel on desktop, where the footer is hidden. */
  notice: { disclaimer: LocalizedString; projectNotice: LocalizedString };
  /** Whose tracker to load on this device ("guest" when logged out). */
  owner: string;
};

export function CheckView({ content, saved, notice, owner }: CheckViewProps) {
  const { t, lang } = useLanguage();
  const [mode, setMode] = useState<Mode>("text");
  const [facts, setFacts] = useState<Profile>({});
  const [asked, setAsked] = useState<ProfileField[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<ReadError | null>(null);
  const [translation, setTranslation] = useState("");
  const [queue, setQueue] = useState<DialogItem[]>([]);
  const [manualItem, setManualItem] = useState<DialogItem | null>(null);
  const [reading, startReading] = useTransition();
  const [today] = useState(() => new Date());
  const tracker = useTracker(owner);
  const [guideId, setGuideId] = useState<string | null>(null);
  const guideScheme = guideId ? (schemes.find((s) => s.id === guideId) ?? null) : null;
  const cardActions = {
    labels: { howToApply: content.guide.howToApply, track: content.tracker.track, tracking: content.tracker.tracking },
    isTracked: (id: string) => Boolean(tracker.tracked[id]),
    onToggleTrack: tracker.toggleTracked,
    onOpenGuide: setGuideId,
  };

  const rec = useMemo(
    () => recommend(facts, schemes, { today, asked, maxQuestions: 1 }),
    [facts, asked, today],
  );
  const nextQuestion = rec.questions[0] ?? null;
  const hasFacts = Object.values(facts).some((v) => v !== undefined);

  const markAsked = (field: ProfileField) =>
    setAsked((prev) => (prev.includes(field) ? prev : [...prev, field]));

  const answer = (field: ProfileField, value: AnswerValue) => {
    setFacts((prev) => applyAnswer(prev, field, value));
    markAsked(field);
  };

  const activeItem = manualItem ?? queue[0] ?? null;
  const closeActive = () => {
    if (manualItem) setManualItem(null);
    else setQueue((q) => q.slice(1));
  };

  const submitText = () => {
    setError(null);
    const value = text.trim();
    if (!value) return setError("empty");
    if (value.length > MAX_INPUT_CHARS) return setError("too_long");
    startReading(async () => {
      // A stale tab after a redeploy can't reach the action; fall back calmly.
      const result = await understandAction(value).catch(() => ({ ok: false as const, error: "unavailable" as const }));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTranslation(result.translationEn);
      setFacts((prev) => ({ ...prev, ...result.facts }));
      setAsked((prev) => [...new Set([...prev, ...result.understood.map((u) => u.field)])]);
      setQueue([
        ...result.ambiguities.map(
          (a): DialogItem => ({ kind: "clarify", field: a.field, quote: a.quote, options: a.options }),
        ),
        ...result.toConfirm.map(
          (field): DialogItem => ({ kind: "confirm", field, value: (result.facts[field] ?? null) as AnswerValue }),
        ),
      ]);
    });
  };

  const useSaved = () => {
    if (!saved) return;
    setFacts(saved.profile);
    setAsked(Object.keys(saved.profile) as ProfileField[]);
    setQueue([]);
    setError(null);
  };

  const startOver = () => {
    setFacts({});
    setAsked([]);
    setText("");
    setTranslation("");
    setQueue([]);
    setError(null);
  };

  const chips = FIELD_SPECS.filter((spec) => facts[spec.field] !== undefined && facts[spec.field] !== null);

  const tabClass = (active: boolean) =>
    cn(
      "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <section className="py-10 sm:py-12 lg:py-0">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* On desktop each column fills the screen under the header and scrolls on its own. */}
        <div className="grid gap-8 lg:h-[calc(100dvh-4rem-1px)] lg:grid-cols-12 lg:gap-10">
          {/* Input side */}
          <div className={cn(PANEL, "space-y-6 lg:col-span-5")}>
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">{t(content.title)}</h1>
              <p className="mt-3 text-lg text-muted-foreground">{t(content.intro)}</p>
            </div>
            {saved && (
              <div className="flex flex-col gap-3 rounded-2xl border bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <UserRound aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">{t(content.saved.title)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(content.saved.text).replace("{name}", t(saved.name))}
                    </p>
                  </div>
                </div>
                <Button onClick={useSaved} className="h-11 shrink-0 px-4 text-base">
                  {t(content.saved.button)}
                </Button>
              </div>
            )}

            <div role="tablist" aria-label={t(content.title)} className="flex gap-1 rounded-xl bg-muted p-1">
              <button role="tab" type="button" aria-selected={mode === "text"} className={tabClass(mode === "text")} onClick={() => setMode("text")}>
                <Keyboard aria-hidden="true" className="size-4" />
                {t(content.modes.text)}
              </button>
              <button role="tab" type="button" aria-selected={mode === "questions"} className={tabClass(mode === "questions")} onClick={() => setMode("questions")}>
                <ListChecks aria-hidden="true" className="size-4" />
                {t(content.modes.questions)}
              </button>
            </div>

            {mode === "text" && (
              <form
                className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitText();
                }}
              >
                <label htmlFor="describe" className="text-base font-semibold">
                  {t(content.text.label)}
                </label>
                <textarea
                  id="describe"
                  value={text}
                  maxLength={MAX_INPUT_CHARS}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={t(content.text.placeholder)}
                  rows={5}
                  disabled={reading}
                  className="block w-full resize-none rounded-xl border bg-background px-3 py-2.5 text-base leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
                  aria-describedby="describe-help describe-count"
                />
                <div className="flex items-start justify-between gap-3 text-sm text-muted-foreground">
                  <p id="describe-help">{t(content.text.privacy)}</p>
                  <p id="describe-count" className="shrink-0 tabular-nums" aria-live="polite">
                    {text.length}/{MAX_INPUT_CHARS}
                  </p>
                </div>
                {error && (
                  <div role="alert" className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    <p>{t(content.text.errors[error])}</p>
                    {(error === "unavailable" || error === "not_configured") && (
                      <Button type="button" variant="outline" className="h-10 bg-card" onClick={() => setMode("questions")}>
                        {t(content.text.useQuestions)}
                      </Button>
                    )}
                  </div>
                )}
                <Button type="submit" disabled={reading} className="h-11 gap-2 px-5 text-base">
                  {reading ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
                  {t(reading ? content.text.reading : content.text.submit)}
                </Button>
                {translation && !reading && (
                  <p className="border-t pt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{t(content.text.translated)}:</span> {translation}
                  </p>
                )}
              </form>
            )}

            {(mode === "questions" || hasFacts) && (
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-primary">{t(content.question.title)}</span>
                  <span>{t(content.question.answered).replace("{n}", String(asked.length))}</span>
                </div>
                {nextQuestion ? (
                  <QuestionCard
                    key={nextQuestion.field}
                    question={nextQuestion}
                    saveLabel={content.question.save}
                    skipLabel={content.question.skip}
                    onAnswer={(value) => answer(nextQuestion.field, value)}
                    onSkip={() => markAsked(nextQuestion.field)}
                  />
                ) : (
                  <p className="text-base">{t(content.question.done)}</p>
                )}
              </div>
            )}

            {hasFacts && (
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold">{t(content.understood.title)}</h2>
                  <p className="text-sm text-muted-foreground">{t(content.understood.hint)}</p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {chips.map((spec) => (
                    <li key={spec.field}>
                      <button
                        type="button"
                        onClick={() => setManualItem({ kind: "edit", field: spec.field })}
                        className="inline-flex min-h-10 items-center gap-1 rounded-full border bg-card px-3 text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`${t(content.understood.edit)}: ${t(spec.label)}`}
                      >
                        <span className="text-muted-foreground">{t(spec.label)}:</span>
                        <span className="font-medium">{formatFactValue(spec.field, facts[spec.field], lang)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <Button variant="ghost" className="h-10 gap-2 px-2 text-muted-foreground" onClick={startOver}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  {t(content.startOver)}
                </Button>
              </div>
            )}
            <div className="hidden space-y-2 border-t pt-4 text-xs leading-relaxed text-muted-foreground lg:block">
              <p className="font-medium text-foreground">{t(notice.disclaimer)}</p>
              <p>{t(notice.projectNotice)}</p>
            </div>
          </div>

          {/* Results side */}
          <div id="results" className={cn(PANEL, "lg:col-span-7")} aria-live="polite">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">{t(content.results.title)}</h2>
              {hasFacts && (
                <Button variant="ghost" size="icon" className="size-10 lg:hidden" aria-label={t(content.startOver)} onClick={startOver}>
                  <X aria-hidden="true" />
                </Button>
              )}
            </div>
            <MyApplications tracker={tracker} facts={facts} today={today} content={content} onOpenGuide={setGuideId} />
            <ResultsPanel
              actions={cardActions}
              rec={rec}
              facts={facts}
              hasFacts={hasFacts}
              content={content.results}
              today={today}
              onAsk={(field) => questionFor(field) && setManualItem({ kind: "edit", field })}
            />
          </div>
        </div>
      </div>

      <SchemeGuide
        scheme={guideScheme}
        facts={facts}
        today={today}
        tracker={tracker}
        content={content}
        onClose={() => setGuideId(null)}
      />

      <AnswerDialog
        item={activeItem}
        remaining={manualItem ? 0 : Math.max(queue.length - 1, 0)}
        content={content.modal}
        questionContent={content.question}
        onAnswer={(field, value) => {
          answer(field, value);
          closeActive();
        }}
        onConfirm={(field) => {
          markAsked(field);
          closeActive();
        }}
        onReject={(field) => {
          if (manualItem) setManualItem({ kind: "edit", field });
          else setQueue((q) => [{ kind: "edit", field }, ...q.slice(1)]);
        }}
        onDismiss={closeActive}
      />
    </section>
  );
}
