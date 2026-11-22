"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { questionFor, type AnswerValue } from "@/lib/eligibility/questions";
import type { CheckContent } from "@/lib/check-content";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { FIELD_SPEC_BY_FIELD, formatFactValue } from "@/lib/profile/fields";
import type { Profile, ProfileField } from "@/types/profile";
import { QuestionCard } from "./QuestionCard";

/** One pending check. Answering only edits the facts JSON. */
export type DialogItem =
  | { kind: "confirm"; field: ProfileField; value: AnswerValue }
  | { kind: "clarify"; field: ProfileField; quote: string; options: AnswerValue[] }
  | { kind: "edit"; field: ProfileField };

type AnswerDialogProps = {
  item: DialogItem | null;
  remaining: number;
  content: CheckContent["modal"];
  questionContent: CheckContent["question"];
  onAnswer: (field: ProfileField, value: AnswerValue) => void;
  onConfirm: (field: ProfileField) => void;
  onReject: (field: ProfileField) => void;
  onDismiss: () => void;
};

export function AnswerDialog({
  item,
  remaining,
  content,
  questionContent,
  onAnswer,
  onConfirm,
  onReject,
  onDismiss,
}: AnswerDialogProps) {
  const { t, lang } = useLanguage();
  const question = item ? questionFor(item.field) : null;
  const label = item ? FIELD_SPEC_BY_FIELD.get(item.field)?.label : undefined;

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent showCloseButton={false} className="gap-5 p-6 sm:max-w-lg">
        {item && (
          <>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold">
                {item.kind === "confirm"
                  ? t(content.confirmTitle)
                  : item.kind === "clarify"
                    ? t(content.clarifyTitle)
                    : t(content.editTitle)}
              </DialogTitle>
              {remaining > 0 && (
                <DialogDescription className="text-sm text-muted-foreground">
                  {t(content.remaining).replace("{n}", String(remaining))}
                </DialogDescription>
              )}
            </div>

            {item.kind === "confirm" && (
              <div className="space-y-5">
                <p className="text-base">
                  {t(content.confirmText)}{" "}
                  <strong>
                    {label ? `${t(label)}: ` : ""}
                    {formatFactValue(item.field, item.value as Profile[ProfileField], lang)}
                  </strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button className="h-11 px-5 text-base" onClick={() => onConfirm(item.field)}>
                    {t(content.yes)}
                  </Button>
                  <Button variant="outline" className="h-11 px-5 text-base" onClick={() => onReject(item.field)}>
                    {t(content.no)}
                  </Button>
                </div>
              </div>
            )}

            {item.kind === "clarify" && item.quote && (
              <p className="rounded-lg bg-secondary px-3 py-2 text-sm">
                {t(content.youWrote)} <q className="font-medium">{item.quote}</q>
              </p>
            )}

            {item.kind !== "confirm" && question && (
              <QuestionCard
                key={item.field}
                question={question}
                onlyValues={item.kind === "clarify" ? item.options : undefined}
                saveLabel={questionContent.save}
                onAnswer={(value) => onAnswer(item.field, value)}
                headingLevel="h3"
              />
            )}

            <div className="flex justify-end border-t pt-3">
              <Button variant="ghost" className="h-10" onClick={onDismiss}>
                {t(content.close)}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
