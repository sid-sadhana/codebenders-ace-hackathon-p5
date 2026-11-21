import { describe, expect, it } from "vitest";
import { schemes } from "@/data/schemes";
import { seedUsers } from "@/lib/auth/demo-accounts";
import type { Profile } from "@/types/profile";
import type { Condition } from "@/types/scheme";
import { evaluateCondition, evaluateScheme } from "./evaluate";
import { applyAnswer } from "./questions";
import { recommend } from "./recommend";

const TODAY = new Date("2026-11-21T12:00:00+05:30");

function profileOf(username: string): Profile {
  const user = seedUsers.find((u) => u.username === username);
  if (!user?.profile) throw new Error(`No profile for ${username}`);
  return user.profile;
}

function eligibilityOf(username: string, schemeId: string) {
  const scheme = schemes.find((s) => s.id === schemeId);
  if (!scheme) throw new Error(`Unknown scheme ${schemeId}`);
  return evaluateScheme(scheme, profileOf(username)).eligibility;
}

function bucketOf(username: string, schemeId: string) {
  const rec = recommend(profileOf(username), schemes, { today: TODAY });
  for (const bucket of ["applyNow", "notOpenNow", "stalled", "unavailable", "notEligible"] as const) {
    if (rec[bucket].some((e) => e.scheme.id === schemeId)) return bucket;
  }
  return null;
}

describe("operators", () => {
  const check = (condition: Condition, facts: Profile) => evaluateCondition(condition, facts).outcome;

  it("handles exact matches, lists and ranges", () => {
    expect(check({ field: "socialCategory", op: "eq", value: "SC" }, { socialCategory: "SC" })).toBe("pass");
    expect(check({ field: "socialCategory", op: "in", value: ["SC", "ST"] }, { socialCategory: "BC-B" })).toBe("fail");
    expect(check({ field: "age", op: "between", value: [18, 40] }, { age: 40 })).toBe("pass");
    expect(check({ field: "age", op: "between", value: [18, 40] }, { age: 41 })).toBe("fail");
    expect(check({ field: "annualFamilyIncome", op: "lt", value: 500000 }, { annualFamilyIncome: 500000 })).toBe("fail");
    expect(check({ field: "isPattadar", op: "is_false" }, { isPattadar: false })).toBe("pass");
  });

  it("treats a missing fact as unknown, never as fail", () => {
    expect(check({ field: "age", op: "gte", value: 70 }, {})).toBe("unknown");
    expect(check({ field: "isPattadar", op: "is_true" }, {})).toBe("unknown");
  });

  it("uses three-valued logic for any / all / not", () => {
    const income: Condition = {
      any: [
        { field: "annualFamilyIncome", op: "lte", value: 150000 },
        { all: [{ field: "area", op: "eq", value: "urban" }, { field: "annualFamilyIncome", op: "lte", value: 200000 }] },
      ],
    };
    expect(check(income, { annualFamilyIncome: 120000 })).toBe("pass");
    expect(check(income, { annualFamilyIncome: 180000 })).toBe("unknown");
    expect(check(income, { annualFamilyIncome: 180000, area: "urban" })).toBe("pass");
    expect(check(income, { annualFamilyIncome: 180000, area: "rural" })).toBe("fail");
    expect(check({ not: { field: "age", op: "gte", value: 60 } }, { age: 30 })).toBe("pass");
  });

  it("only reports the facts that can still change the answer", () => {
    const r = evaluateCondition(
      { any: [{ field: "socialCategory", op: "eq", value: "SC" }, { field: "isDisabled", op: "is_true" }] },
      { socialCategory: "BC-B" },
    );
    expect(r.outcome).toBe("unknown");
    expect([...r.missing]).toEqual(["isDisabled"]);
  });
});

describe("demo users", () => {
  it("sravani: BC-B engineering student", () => {
    expect(eligibilityOf("sravani", "ts-epass-post-matric")).toBe("likely");
    expect(eligibilityOf("sravani", "central-pm-yasasvi-top-class")).toBe("likely");
    expect(eligibilityOf("sravani", "central-sector-scholarship-csss")).toBe("possibly");
    expect(eligibilityOf("sravani", "central-aicte-pragati")).toBe("not");
    expect(eligibilityOf("sravani", "ts-rajiv-aarogyasri")).toBe("likely");
  });

  it("kiran: SC student, no white card, 45% disability, urban ₹2.2 lakh", () => {
    expect(eligibilityOf("kiran", "ts-epass-post-matric")).toBe("likely");
    expect(eligibilityOf("kiran", "ts-cheyutha-disabled")).toBe("not");
    expect(eligibilityOf("kiran", "ts-rajiv-aarogyasri")).toBe("not");
  });

  it("ayesha: minority with a foreign admission", () => {
    expect(eligibilityOf("ayesha", "ts-cm-overseas-minorities")).toBe("likely");
    expect(bucketOf("ayesha", "ts-cm-overseas-minorities")).toBe("notOpenNow");
    expect(eligibilityOf("ayesha", "ts-epass-post-matric")).toBe("not");
  });

  it("arjun: OC above most income limits", () => {
    expect(eligibilityOf("arjun", "ts-epass-post-matric")).toBe("not");
    expect(eligibilityOf("arjun", "central-sector-scholarship-csss")).toBe("not");
    expect(eligibilityOf("arjun", "ts-ews-certificate")).toBe("likely");
  });

  it("saraswathi: widow, 66, white card", () => {
    expect(eligibilityOf("saraswathi", "ts-cheyutha-widow")).toBe("likely");
    expect(bucketOf("saraswathi", "ts-cheyutha-widow")).toBe("notOpenNow");
    expect(eligibilityOf("saraswathi", "ts-rajiv-aarogyasri")).toBe("likely");
    expect(eligibilityOf("saraswathi", "ts-mahalakshmi-free-bus")).toBe("likely");
  });

  it("narayana: 74, no white card", () => {
    expect(eligibilityOf("narayana", "central-ayushman-vay-vandana")).toBe("likely");
    expect(eligibilityOf("narayana", "ts-rajiv-aarogyasri")).toBe("not");
    expect(eligibilityOf("narayana", "ts-cheyutha-old-age")).toBe("not");
  });

  it("venkatesh: pattadar farmer", () => {
    expect(eligibilityOf("venkatesh", "ts-rythu-bharosa")).toBe("likely");
    expect(eligibilityOf("venkatesh", "central-pm-kisan")).toBe("likely");
    expect(eligibilityOf("venkatesh", "central-kcc")).toBe("likely");
  });

  it("mallesh: tenant farmer is not covered by Rythu Bharosa", () => {
    expect(eligibilityOf("mallesh", "ts-rythu-bharosa")).toBe("not");
    expect(eligibilityOf("mallesh", "central-kcc")).toBe("likely");
    expect(bucketOf("mallesh", "ts-indiramma-atmiya-bharosa")).toBe("stalled");
  });

  it("padma: SHG member", () => {
    expect(eligibilityOf("padma", "ts-indira-mahila-shakti-vlr")).toBe("likely");
    expect(eligibilityOf("padma", "ts-mahalakshmi-500-lpg")).toBe("likely");
  });

  it("swapna: daughter's wedding, no pucca house, 150 units", () => {
    expect(eligibilityOf("swapna", "ts-kalyana-lakshmi")).toBe("likely");
    expect(eligibilityOf("swapna", "ts-indiramma-indlu")).toBe("likely");
    expect(eligibilityOf("swapna", "ts-gruha-jyothi")).toBe("likely");
    expect(eligibilityOf("swapna", "central-e-shram")).toBe("likely");
  });
});

describe("recommendations", () => {
  it("moves a scheme whose deadline has passed out of 'apply now'", () => {
    const facts = profileOf("sravani");
    const before = recommend(facts, schemes, { today: TODAY });
    const after = recommend(facts, schemes, { today: new Date("2026-12-05T10:00:00+05:30") });
    expect(before.applyNow.some((e) => e.scheme.id === "central-sector-scholarship-csss")).toBe(true);
    expect(after.notOpenNow.some((e) => e.scheme.id === "central-sector-scholarship-csss")).toBe(true);
  });

  it("flags likely schemes that can't be combined", () => {
    const rec = recommend(profileOf("saraswathi"), schemes, { today: TODAY });
    expect(rec.conflicts).toContainEqual(["ts-cheyutha-old-age", "ts-cheyutha-widow"]);
  });

  it("asks the most useful questions first and never repeats an asked one", () => {
    const first = recommend({}, schemes, { today: TODAY });
    expect(first.questions.length).toBe(3);
    const asked = first.questions.map((q) => q.field);
    const next = recommend({}, schemes, { today: TODAY, asked });
    expect(next.questions.some((q) => asked.includes(q.field))).toBe(false);
  });

  it("re-runs locally from a yes/no answer without any model call", () => {
    let facts: Profile = { maritalStatus: undefined, gender: "female", age: 66, annualFamilyIncome: 60000 };
    const scheme = schemes.find((s) => s.id === "ts-cheyutha-widow")!;
    expect(evaluateScheme(scheme, facts).eligibility).toBe("possibly");
    facts = applyAnswer(facts, "maritalStatus", "widowed");
    facts = applyAnswer(facts, "receivesPension", false);
    facts = applyAnswer(facts, "isGovtEmployeeFamily", false);
    expect(evaluateScheme(scheme, facts).eligibility).toBe("likely");
  });

  it("pure yes/no mode reaches a result for a senior widow", () => {
    const answers: Partial<Record<string, unknown>> = {
      gender: "female",
      age: 66,
      annualFamilyIncome: 100000,
      area: "rural",
      rationCard: "white_phh",
      maritalStatus: "widowed",
      educationLevel: "none",
      occupation: "homemaker",
      receivesPension: false,
      isGovtEmployeeFamily: false,
    };
    let facts: Profile = {};
    const asked: string[] = [];
    for (let step = 0; step < 25; step++) {
      const { questions } = recommend(facts, schemes, { today: TODAY, asked: asked as never });
      if (questions.length === 0) break;
      const q = questions[0];
      asked.push(q.field);
      facts = applyAnswer(facts, q.field, (answers[q.field] ?? null) as never);
    }
    const rec = recommend(facts, schemes, { today: TODAY });
    const ids = [...rec.applyNow, ...rec.notOpenNow].filter((e) => e.eligibility === "likely").map((e) => e.scheme.id);
    expect(ids).toContain("ts-cheyutha-widow");
    expect(ids).toContain("ts-rajiv-aarogyasri");
    expect(asked.length).toBeLessThanOrEqual(25);
  });
});
