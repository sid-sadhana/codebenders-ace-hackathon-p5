import { z } from "zod";
import documentsJson from "@/data/documents.json";
import { evaluateCondition, type Facts } from "@/lib/eligibility/evaluate";
import { localizedStringSchema, type LocalizedString } from "@/lib/i18n/types";
import type { Scheme } from "@/types/scheme";

const documentSchema = z.object({ name: localizedStringSchema, whereToGet: localizedStringSchema });

export const documentCatalog: Record<string, { name: LocalizedString; whereToGet: LocalizedString }> = z
  .record(z.string(), documentSchema)
  .parse(documentsJson);

export type ChecklistItem = { id: string; name: LocalizedString; whereToGet: LocalizedString };

/**
 * The documents this person needs for a scheme. A document with a condition
 * is included only when the person's facts say it applies (or aren't known
 * yet), so the list is personal without hiding anything that might be needed.
 */
export function checklistFor(scheme: Scheme, facts: Facts): ChecklistItem[] {
  return scheme.documents
    .filter((doc) => !doc.onlyIf || evaluateCondition(doc.onlyIf, facts).outcome !== "fail")
    .map((doc) => {
      const entry = documentCatalog[doc.id];
      if (!entry) throw new Error(`Unknown document id: ${doc.id}`);
      return { id: doc.id, ...entry };
    });
}
