"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnswerValue, Question } from "@/lib/eligibility/questions";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { LocalizedString } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

type QuestionCardProps = {
  question: Question;
  /** Restrict choices (e.g. to what an unclear phrase could mean). */
  onlyValues?: AnswerValue[];
  saveLabel: LocalizedString;
  skipLabel?: LocalizedString;
  onAnswer: (value: AnswerValue) => void;
  onSkip?: () => void;
  headingLevel?: "h2" | "h3";
};

export function QuestionCard({
  question,
  onlyValues,
  saveLabel,
  skipLabel,
  onAnswer,
  onSkip,
  headingLevel = "h3",
}: QuestionCardProps) {
  const { t } = useLanguage();
  const inputId = useId();
  const [number, setNumber] = useState("");
  const Heading = headingLevel;

  if (question.kind === "number") {
    const value = Number(number);
    const valid = number.trim() !== "" && Number.isFinite(value) && value >= question.min && value <= question.max;
    return (
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onAnswer(value);
        }}
      >
        <Heading className="text-lg font-semibold">
          <label htmlFor={inputId}>{t(question.text)}</label>
        </Heading>
        <div className="flex items-center gap-2">
          <Input
            id={inputId}
            inputMode="decimal"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            className="h-11 w-32 text-base md:text-base"
            autoComplete="off"
          />
          <span className="text-muted-foreground">{t(question.unit)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!valid} className="h-11 px-5 text-base">
            {t(saveLabel)}
          </Button>
          {onSkip && skipLabel && (
            <Button type="button" variant="ghost" onClick={onSkip} className="h-11 px-4 text-base">
              {t(skipLabel)}
            </Button>
          )}
        </div>
      </form>
    );
  }

  const options = onlyValues?.length
    ? question.options.filter((o) => o.value === null || onlyValues.includes(o.value))
    : question.options;

  return (
    <div className="space-y-3">
      <Heading className="text-lg font-semibold">{t(question.text)}</Heading>
      <ul className="flex flex-wrap gap-2">
        {options.map((option) => (
          <li key={String(option.value)}>
            <button
              type="button"
              onClick={() => onAnswer(option.value)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                option.value === null
                  ? "border-dashed text-muted-foreground hover:bg-muted"
                  : "bg-card hover:border-primary hover:bg-secondary",
              )}
            >
              {t(option.label)}
            </button>
          </li>
        ))}
      </ul>
      {onSkip && skipLabel && (
        <Button type="button" variant="ghost" onClick={onSkip} className="h-11 px-4 text-base">
          {t(skipLabel)}
        </Button>
      )}
    </div>
  );
}
