import type { Profile, ProfileField } from "@/types/profile";
import type { Condition, LeafCondition, Rule, Scheme } from "@/types/scheme";

/**
 * Deterministic, three-valued rule evaluation.
 * A fact that is missing makes a check "unknown", never "fail".
 */

export type Facts = Profile;
export type Outcome = "pass" | "fail" | "unknown";
export type RuleOutcome = Outcome | "assumed";
export type Eligibility = "likely" | "possibly" | "not";

type Evaluated = { outcome: Outcome; missing: Set<ProfileField> };

function isKnown(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function evalLeaf(condition: LeafCondition, facts: Facts): Evaluated {
  const value = facts[condition.field] as unknown;
  const missing = new Set<ProfileField>([condition.field]);

  if (condition.op === "exists") {
    return { outcome: isKnown(value) ? "pass" : "fail", missing: new Set() };
  }
  if (!isKnown(value)) return { outcome: "unknown", missing };

  const result = (ok: boolean): Evaluated => ({ outcome: ok ? "pass" : "fail", missing: new Set() });
  const num = typeof value === "number" ? value : null;

  switch (condition.op) {
    case "eq":
      return result(value === condition.value);
    case "neq":
      return result(value !== condition.value);
    case "in":
      return result(condition.value.some((v) => v === value));
    case "not_in":
      return result(!condition.value.some((v) => v === value));
    case "lt":
      return num === null ? { outcome: "unknown", missing } : result(num < condition.value);
    case "lte":
      return num === null ? { outcome: "unknown", missing } : result(num <= condition.value);
    case "gt":
      return num === null ? { outcome: "unknown", missing } : result(num > condition.value);
    case "gte":
      return num === null ? { outcome: "unknown", missing } : result(num >= condition.value);
    case "between":
      return num === null
        ? { outcome: "unknown", missing }
        : result(num >= condition.value[0] && num <= condition.value[1]);
    case "is_true":
      return result(value === true);
    case "is_false":
      return result(value === false);
  }
}

function union(parts: Evaluated[]): Set<ProfileField> {
  const out = new Set<ProfileField>();
  for (const part of parts) for (const field of part.missing) out.add(field);
  return out;
}

export function evaluateCondition(condition: Condition, facts: Facts): Evaluated {
  if ("all" in condition) {
    const parts = condition.all.map((c) => evaluateCondition(c, facts));
    if (parts.some((p) => p.outcome === "fail")) return { outcome: "fail", missing: new Set() };
    if (parts.every((p) => p.outcome === "pass")) return { outcome: "pass", missing: new Set() };
    return { outcome: "unknown", missing: union(parts.filter((p) => p.outcome === "unknown")) };
  }
  if ("any" in condition) {
    const parts = condition.any.map((c) => evaluateCondition(c, facts));
    if (parts.some((p) => p.outcome === "pass")) return { outcome: "pass", missing: new Set() };
    if (parts.every((p) => p.outcome === "fail")) return { outcome: "fail", missing: new Set() };
    return { outcome: "unknown", missing: union(parts.filter((p) => p.outcome === "unknown")) };
  }
  if ("not" in condition) {
    const inner = evaluateCondition(condition.not, facts);
    if (inner.outcome === "pass") return { outcome: "fail", missing: new Set() };
    if (inner.outcome === "fail") return { outcome: "pass", missing: new Set() };
    return inner;
  }
  return evalLeaf(condition, facts);
}

export function fieldsIn(condition: Condition): ProfileField[] {
  if ("all" in condition) return [...new Set(condition.all.flatMap(fieldsIn))];
  if ("any" in condition) return [...new Set(condition.any.flatMap(fieldsIn))];
  if ("not" in condition) return fieldsIn(condition.not);
  return [condition.field];
}

export type RuleResult = {
  rule: Rule;
  outcome: RuleOutcome;
  /** Facts this rule looked at, for "you said ..." lines. */
  fields: ProfileField[];
  /** Facts that would settle this rule if answered. */
  missing: ProfileField[];
};

export type SchemeEvaluation = {
  scheme: Scheme;
  eligibility: Eligibility;
  results: RuleResult[];
  /** Unanswered facts that keep this scheme at "possibly". */
  missingFields: ProfileField[];
  /** Exclusions we assumed were fine; worth a yes/no check. */
  checkFields: ProfileField[];
};

export function evaluateRule(rule: Rule, facts: Facts): RuleResult {
  const { outcome, missing } = evaluateCondition(rule.if, facts);
  return {
    rule,
    outcome: outcome === "unknown" && rule.exclusion ? "assumed" : outcome,
    fields: fieldsIn(rule.if),
    missing: [...missing],
  };
}

export function evaluateScheme(scheme: Scheme, facts: Facts): SchemeEvaluation {
  const results = scheme.rules.map((rule) => evaluateRule(rule, facts));
  const eligibility: Eligibility = results.some((r) => r.outcome === "fail")
    ? "not"
    : results.some((r) => r.outcome === "unknown")
      ? "possibly"
      : "likely";

  const missingFields = new Set<ProfileField>();
  const checkFields = new Set<ProfileField>();
  for (const r of results) {
    if (r.outcome === "unknown") r.missing.forEach((f) => missingFields.add(f));
    if (r.outcome === "assumed") r.missing.forEach((f) => checkFields.add(f));
  }

  return {
    scheme,
    eligibility,
    results,
    missingFields: eligibility === "not" ? [] : [...missingFields],
    checkFields: eligibility === "not" ? [] : [...checkFields],
  };
}
