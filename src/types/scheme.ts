import { z } from "zod";
import { localizedStringSchema } from "@/lib/i18n/types";
import { profileSchema } from "./profile";

const profileFieldSchema = z.enum(
  Object.keys(profileSchema.shape) as [keyof typeof profileSchema.shape, ...(keyof typeof profileSchema.shape)[]],
);

const scalar = z.union([z.string(), z.number(), z.boolean()]);

/** A single check against one profile fact. */
export const leafConditionSchema = z.discriminatedUnion("op", [
  z.object({ field: profileFieldSchema, op: z.literal("eq"), value: scalar }),
  z.object({ field: profileFieldSchema, op: z.literal("neq"), value: scalar }),
  z.object({ field: profileFieldSchema, op: z.literal("in"), value: z.array(scalar).min(1) }),
  z.object({ field: profileFieldSchema, op: z.literal("not_in"), value: z.array(scalar).min(1) }),
  z.object({ field: profileFieldSchema, op: z.literal("lt"), value: z.number() }),
  z.object({ field: profileFieldSchema, op: z.literal("lte"), value: z.number() }),
  z.object({ field: profileFieldSchema, op: z.literal("gt"), value: z.number() }),
  z.object({ field: profileFieldSchema, op: z.literal("gte"), value: z.number() }),
  z.object({ field: profileFieldSchema, op: z.literal("between"), value: z.tuple([z.number(), z.number()]) }),
  z.object({ field: profileFieldSchema, op: z.literal("is_true") }),
  z.object({ field: profileFieldSchema, op: z.literal("is_false") }),
  z.object({ field: profileFieldSchema, op: z.literal("exists") }),
]);
export type LeafCondition = z.infer<typeof leafConditionSchema>;

export type Condition =
  | LeafCondition
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    leafConditionSchema,
    z.object({ all: z.array(conditionSchema).min(1) }),
    z.object({ any: z.array(conditionSchema).min(1) }),
    z.object({ not: conditionSchema }),
  ]),
);

export const ruleSchema = z.object({
  id: z.string().min(1),
  text: localizedStringSchema,
  if: conditionSchema,
  /**
   * Exclusion-style rules ("does not already get a pension") are assumed to
   * hold when the person hasn't said otherwise, and are shown as "please check".
   */
  exclusion: z.boolean().default(false),
});
export type Rule = z.infer<typeof ruleSchema>;

export const SCHEME_STATUSES = [
  "open",
  "rolling",
  "automatic",
  "window_closed",
  "stalled",
  "closed",
  "not_active",
] as const;

export const schemeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: localizedStringSchema,
  level: z.enum(["state", "central"]),
  audience: z.array(z.enum(["student", "senior", "family", "worker", "farmer", "women"])).min(1),
  status: z.enum(SCHEME_STATUSES),
  confidence: z.enum(["high", "medium", "low"]),
  needsVerification: z.boolean(),
  verificationNotes: z.string().optional(),
  benefit: localizedStringSchema,
  /** Rough yearly value in rupees, used only to order results. */
  benefitValue: z.number().int().min(0).optional(),
  deadline: z.string().date().optional(),
  usualWindow: localizedStringSchema.optional(),
  officialSourceUrl: z.string().url(),
  lastVerified: z.string().date(),
  rules: z.array(ruleSchema).min(1),
  /** Conditions we cannot check from a profile; shown as "also needed". */
  alsoRequired: z.array(localizedStringSchema).default([]),
  conflictsWith: z.array(z.string()).default([]),
});
export type Scheme = z.infer<typeof schemeSchema>;
export type SchemeStatus = Scheme["status"];
