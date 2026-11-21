import { FIELD_SPECS, GATING_FIELDS } from "@/lib/profile/fields";
import type { ProfileField } from "@/types/profile";
import type { Scheme, SchemeStatus } from "@/types/scheme";
import { evaluateScheme, type Facts, type SchemeEvaluation } from "./evaluate";
import { questionFor, type Question } from "./questions";

export type Recommendation = {
  /** Likely or possibly eligible, and you can apply now (or it's automatic). */
  applyNow: SchemeEvaluation[];
  /** Eligible-looking, but the application window is closed right now. */
  notOpenNow: SchemeEvaluation[];
  /** Announced but not being paid: shown as warnings only. */
  stalled: SchemeEvaluation[];
  /** Ended, or not running in Telangana. Hidden by default. */
  unavailable: SchemeEvaluation[];
  /** Probably not eligible, with the reasons. */
  notEligible: SchemeEvaluation[];
  /** Pairs of likely schemes you usually can't take together. */
  conflicts: [string, string][];
  /** The most useful next questions, best first. */
  questions: Question[];
};

export type RecommendOptions = {
  today?: Date;
  /** Fields already asked (including "Not sure"), so they aren't asked again. */
  asked?: Iterable<ProfileField>;
  maxQuestions?: number;
};

const OPEN: SchemeStatus[] = ["open", "rolling", "automatic"];

function effectiveStatus(scheme: Scheme, today: Date): SchemeStatus {
  if (scheme.deadline && OPEN.includes(scheme.status)) {
    const end = new Date(`${scheme.deadline}T23:59:59+05:30`);
    if (end.getTime() < today.getTime()) return "window_closed";
  }
  return scheme.status;
}

function byRelevance(a: SchemeEvaluation, b: SchemeEvaluation): number {
  if (a.eligibility !== b.eligibility) return a.eligibility === "likely" ? -1 : 1;
  if (a.eligibility === "possibly" && a.missingFields.length !== b.missingFields.length) {
    return a.missingFields.length - b.missingFields.length;
  }
  const da = a.scheme.deadline ?? "9999-12-31";
  const db = b.scheme.deadline ?? "9999-12-31";
  if (da !== db) return da < db ? -1 : 1;
  const va = a.scheme.benefitValue ?? 0;
  const vb = b.scheme.benefitValue ?? 0;
  if (va !== vb) return vb - va;
  return a.scheme.name.en.localeCompare(b.scheme.name.en);
}

const QUESTION_WEIGHT: Record<SchemeStatus, number> = {
  open: 3,
  rolling: 3,
  automatic: 3,
  window_closed: 2,
  stalled: 0.5,
  closed: 0,
  not_active: 0,
};

const FIELD_ORDER = new Map(FIELD_SPECS.map((spec, index) => [spec.field, index]));

export function pickQuestions(
  evaluations: { evaluation: SchemeEvaluation; status: SchemeStatus }[],
  asked: Set<ProfileField>,
  max: number,
): Question[] {
  const score = new Map<ProfileField, number>();
  const add = (field: ProfileField, value: number) => {
    if (asked.has(field) || value <= 0) return;
    score.set(field, (score.get(field) ?? 0) + value);
  };

  for (const { evaluation, status } of evaluations) {
    // Loans and certificates (no fixed cash value) matter less than grants.
    const weight = QUESTION_WEIGHT[status] * (evaluation.scheme.benefitValue ? 1 : 0.5);
    for (const field of evaluation.missingFields) add(field, weight);
    for (const field of evaluation.checkFields) add(field, weight * 0.25);
  }

  return [...score.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      const ga = GATING_FIELDS.has(a[0]) ? 0 : 1;
      const gb = GATING_FIELDS.has(b[0]) ? 0 : 1;
      if (ga !== gb) return ga - gb;
      return (FIELD_ORDER.get(a[0]) ?? 99) - (FIELD_ORDER.get(b[0]) ?? 99);
    })
    .map(([field]) => questionFor(field))
    .filter((q): q is Question => q !== null)
    .slice(0, max);
}

export function recommend(facts: Facts, schemes: Scheme[], options: RecommendOptions = {}): Recommendation {
  const today = options.today ?? new Date();
  const asked = new Set(options.asked ?? []);

  const evaluated = schemes.map((scheme) => ({
    evaluation: evaluateScheme(scheme, facts),
    status: effectiveStatus(scheme, today),
  }));

  const out: Recommendation = {
    applyNow: [],
    notOpenNow: [],
    stalled: [],
    unavailable: [],
    notEligible: [],
    conflicts: [],
    questions: [],
  };

  for (const { evaluation, status } of evaluated) {
    if (evaluation.eligibility === "not") out.notEligible.push(evaluation);
    else if (status === "stalled") out.stalled.push(evaluation);
    else if (status === "closed" || status === "not_active") out.unavailable.push(evaluation);
    else if (status === "window_closed") out.notOpenNow.push(evaluation);
    else out.applyNow.push(evaluation);
  }

  out.applyNow.sort(byRelevance);
  out.notOpenNow.sort(byRelevance);
  out.stalled.sort(byRelevance);
  out.notEligible.sort((a, b) => a.scheme.name.en.localeCompare(b.scheme.name.en));

  const likely = new Set(
    [...out.applyNow, ...out.notOpenNow]
      .filter((e) => e.eligibility === "likely")
      .map((e) => e.scheme.id),
  );
  const seen = new Set<string>();
  for (const e of [...out.applyNow, ...out.notOpenNow]) {
    if (e.eligibility !== "likely") continue;
    for (const other of e.scheme.conflictsWith) {
      const key = [e.scheme.id, other].sort().join("|");
      if (likely.has(other) && !seen.has(key)) {
        seen.add(key);
        out.conflicts.push([e.scheme.id, other]);
      }
    }
  }

  out.questions = pickQuestions(evaluated, asked, options.maxQuestions ?? 3);
  return out;
}
