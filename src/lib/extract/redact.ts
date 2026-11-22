/**
 * Removes identity numbers before any text leaves the browser or the server.
 * We never need them: eligibility depends on whether someone has a card, not
 * its number. Runs in the browser as the person types, and again on the server.
 */

export type PiiKind = "aadhaar" | "phone" | "email" | "pan";

export const PII_MASK = "********";

const PATTERNS: [PiiKind, RegExp][] = [
  ["aadhaar", /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g],
  ["phone", /(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g],
  ["email", /[\w.+-]+@[\w-]+\.[\w.-]+/g],
  ["pan", /\b[A-Za-z]{5}\d{4}[A-Za-z]\b/g],
];

export function redactIdentifiers(text: string): { text: string; redacted: boolean; found: PiiKind[] } {
  const found = new Set<PiiKind>();
  let out = text;
  for (const [kind, pattern] of PATTERNS) {
    out = out.replace(pattern, () => {
      found.add(kind);
      return PII_MASK;
    });
  }
  return { text: out, redacted: found.size > 0, found: [...found] };
}
