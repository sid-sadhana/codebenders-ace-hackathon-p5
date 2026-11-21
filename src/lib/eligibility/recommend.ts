import { FIELD_SPECS, GATING_FIELDS } from "@/lib/profile/fields";
import type { ProfileField } from "@/types/profile";
import type { Scheme, SchemeStatus } from "@/types/scheme";
import { evaluateScheme, fieldsIn, type Facts, type SchemeEvaluation } from "./evaluate";
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
  /** Nothing the person said matches these yet; shown only as a count. */
  needsMoreInfo: SchemeEvaluation[];
  /** Relevance score per scheme id (higher = more specific to this person). */
  relevance: Record<string, number>;
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

/**
 * How specific each fact is: a fact used by few schemes (a wedding, SHG
 * membership, a foreign admission) says more about relevance than one used
 * by many (gender, age, income). Inverse document frequency over the catalog.
 */
function fieldSpecificity(schemes: Scheme[]): Map<ProfileField, number> {
  const counts = new Map<ProfileField, number>();
  for (const scheme of schemes) {
    const used = new Set(scheme.rules.flatMap((rule) => fieldsIn(rule.if)));
    for (const field of used) counts.set(field, (counts.get(field) ?? 0) + 1);
  }
  const weights = new Map<ProfileField, number>();
  for (const [field, count] of counts) weights.set(field, Math.log((schemes.length + 1) / count));
  return weights;
}

/**
 * Relevance = how specifically this scheme matches what the person told us.
 * Each passed rule scores the specificity of the most specific stated fact it
 * used; each unanswered rule costs a little; "likely" gets a small bonus.
 */
function relevanceOf(evaluation: SchemeEvaluation, facts: Facts, weights: Map<ProfileField, number>): number {
  let score = 0;
  for (const r of evaluation.results) {
    if (r.outcome === "pass") {
      const known = r.fields.filter((f) => facts[f] !== undefined && facts[f] !== null);
      score += Math.max(0, ...known.map((f) => weights.get(f) ?? 1));
    } else if (r.outcome === "unknown") {
      score -= 0.5;
    }
  }
  if (evaluation.eligibility === "likely") score += 1;
  return score;
}

function matchedRules(evaluation: SchemeEvaluation): number {
  return evaluation.results.filter((r) => r.outcome === "pass").length;
}

function byScore(relevance: Record<string, number>) {
  return (a: SchemeEvaluation, b: SchemeEvaluation): number => {
    const diff = (relevance[b.scheme.id] ?? 0) - (relevance[a.scheme.id] ?? 0);
    if (Math.abs(diff) > 1e-9) return diff;
    const da = a.scheme.deadline ?? "9999-12-31";
    const db = b.scheme.deadline ?? "9999-12-31";
    if (da !== db) return da < db ? -1 : 1;
    const va = a.scheme.benefitValue ?? 0;
    const vb = b.scheme.benefitValue ?? 0;
    if (va !== vb) return vb - va;
    return a.scheme.name.en.localeCompare(b.scheme.name.en);
  };
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
    needsMoreInfo: [],
    relevance: {},
    conflicts: [],
    questions: [],
  };

  const weights = fieldSpecificity(schemes);

  for (const { evaluation, status } of evaluated) {
    out.relevance[evaluation.scheme.id] = relevanceOf(evaluation, facts, weights);
    if (evaluation.eligibility === "not") out.notEligible.push(evaluation);
    else if (matchedRules(evaluation) === 0) out.needsMoreInfo.push(evaluation);
    else if (status === "stalled") out.stalled.push(evaluation);
    else if (status === "closed" || status === "not_active") out.unavailable.push(evaluation);
    else if (status === "window_closed") out.notOpenNow.push(evaluation);
    else out.applyNow.push(evaluation);
  }

  const ranked = byScore(out.relevance);
  out.applyNow.sort(ranked);
  out.notOpenNow.sort(ranked);
  out.stalled.sort(ranked);
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
        out.conflicts.push([e.scheme.id, other].sort() as [string, string]);
      }
    }
  }

  out.questions = pickQuestions(evaluated, asked, options.maxQuestions ?? 3);
  return out;
}
