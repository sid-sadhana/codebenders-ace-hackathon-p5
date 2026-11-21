import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import { FIELD_SPEC_BY_FIELD, GATING_FIELDS } from "@/lib/profile/fields";
import { profileSchema, type Profile, type ProfileField } from "@/types/profile";
import type { AnswerValue } from "@/lib/eligibility/questions";
import { readYearlyRupees } from "./amounts";
import { MAX_INPUT_CHARS } from "./limits";
import { redactIdentifiers } from "./redact";
import { EXTRACTION_INSTRUCTIONS, extractionSchema } from "./schema";

export type Confidence = "high" | "medium" | "low";

export type UnderstoodFact = {
  field: ProfileField;
  value: Exclude<AnswerValue, null>;
  quote: string | null;
  confidence: Confidence;
};

export type Ambiguity = { field: ProfileField; quote: string; options: AnswerValue[] };

export type UnderstandResult =
  | {
      ok: true;
      /** Flat facts JSON for the rules engine (only trusted facts). */
      facts: Profile;
      understood: UnderstoodFact[];
      /** Facts we kept but want a quick yes/no confirmation on. */
      toConfirm: ProfileField[];
      /** Mentioned but unclear: ask with these options. */
      ambiguities: Ambiguity[];
      translationEn: string;
      redacted: boolean;
    }
  | { ok: false; error: "empty" | "too_long" | "not_configured" | "unavailable" };

const rawSchema = z.object({
  translationEn: z.string().default(""),
  facts: z.record(z.string(), z.unknown()).default({}),
  evidence: z
    .array(z.object({ field: z.string(), quote: z.string(), confidence: z.enum(["high", "medium", "low"]) }))
    .default([]),
  ambiguities: z
    .array(z.object({ field: z.string(), quote: z.string(), possibleValues: z.array(z.string()) }))
    .default([]),
});

const squash = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function coerceOption(field: ProfileField, raw: string): AnswerValue | undefined {
  const spec = FIELD_SPEC_BY_FIELD.get(field);
  if (!spec) return undefined;
  if (spec.kind === "boolean") return raw === "true" ? true : raw === "false" ? false : undefined;
  if (spec.kind === "enum") return spec.values.includes(raw) ? raw : undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Turns one free-text message into trusted facts. The model only extracts;
 * everything it returns is validated here and eligibility is decided later
 * by the rules engine.
 */
export async function understandText(input: string): Promise<UnderstandResult> {
  const text = input.trim();
  if (!text) return { ok: false, error: "empty" };
  if (text.length > MAX_INPUT_CHARS) return { ok: false, error: "too_long" };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "not_configured" };
  const models = [
    ...new Set(
      [process.env.GEMINI_MODEL || "gemini-3.5-flash-lite", ...(process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.1-flash-lite").split(",")]
        .map((m) => m.trim())
        .filter(Boolean),
    ),
  ];

  const { text: safeText, redacted } = redactIdentifiers(text);
  const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });

  let raw: z.infer<typeof rawSchema> | null = null;
  // Try each model in turn: a daily limit or outage on one falls through to the next.
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: safeText }] }],
        config: {
          systemInstruction: EXTRACTION_INSTRUCTIONS,
          responseMimeType: "application/json",
          responseSchema: extractionSchema,
          temperature: 0,
          // Give up on this model after 20s; the page offers yes/no questions if all fail.
          abortSignal: AbortSignal.timeout(20_000),
          // Extraction needs little reasoning; this keeps answers to a few seconds.
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      });
      raw = rawSchema.parse(JSON.parse(response.text ?? "{}"));
      break;
    } catch (error) {
      // Log only the model and a short reason; never the text or the key.
      const reason = error instanceof Error ? error.message.slice(0, 160) : "unknown error";
      console.warn(`[understand] ${model} failed: ${reason}`);
      continue;
    }
  }
  if (!raw) return { ok: false, error: "unavailable" };

  const haystack = squash(safeText);
  const evidence = new Map<string, { quote: string; confidence: Confidence }>();
  for (const e of raw.evidence) {
    const found = e.quote.trim().length > 0 && haystack.includes(squash(e.quote));
    // A quote that isn't really in the message can't be trusted.
    evidence.set(e.field, { quote: e.quote, confidence: found ? e.confidence : "low" });
  }

  const facts: Record<string, unknown> = {};
  const understood: UnderstoodFact[] = [];
  const toConfirm = new Set<ProfileField>();
  const ambiguities: Ambiguity[] = [];

  for (const [field, value] of Object.entries(raw.facts)) {
    if (value === null || value === undefined) continue;
    const shape = profileSchema.shape[field as ProfileField];
    if (!shape || !FIELD_SPEC_BY_FIELD.has(field as ProfileField)) continue;
    const parsed = shape.safeParse(value);
    if (!parsed.success) continue;

    const f = field as ProfileField;
    const ev = evidence.get(field);
    const confidence: Confidence = ev?.confidence ?? "low";

    if (confidence === "low" && GATING_FIELDS.has(f)) {
      // Too important to guess: ask instead.
      ambiguities.push({ field: f, quote: ev?.quote ?? "", options: [] });
      continue;
    }
    if (confidence === "low") continue;

    if (f === "annualFamilyIncome" && ev?.quote) {
      const ours = readYearlyRupees(ev.quote);
      if (ours !== null && Math.abs(ours - Number(parsed.data)) > Number(parsed.data) * 0.05) {
        toConfirm.add(f);
      }
    }
    if (confidence === "medium" && GATING_FIELDS.has(f)) toConfirm.add(f);

    facts[f] = parsed.data;
    understood.push({ field: f, value: parsed.data as Exclude<AnswerValue, null>, quote: ev?.quote ?? null, confidence });
  }

  for (const a of raw.ambiguities) {
    const f = a.field as ProfileField;
    if (!FIELD_SPEC_BY_FIELD.has(f) || f in facts) continue;
    if (ambiguities.some((x) => x.field === f)) continue;
    const options = a.possibleValues
      .map((v) => coerceOption(f, v))
      .filter((v): v is AnswerValue => v !== undefined);
    ambiguities.push({ field: f, quote: a.quote, options });
  }

  return {
    ok: true,
    facts: facts as Profile,
    understood,
    toConfirm: [...toConfirm],
    ambiguities,
    translationEn: raw.translationEn,
    redacted,
  };
}
