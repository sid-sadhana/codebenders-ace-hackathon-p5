/**
 * Removes identity numbers before any text leaves the server. We never need
 * them: eligibility depends on whether someone has a card, not its number.
 */
const PATTERNS: [RegExp, string][] = [
  [/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[aadhaar]"],
  [/(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g, "[phone]"],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]"],
  [/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[pan]"],
];

export function redactIdentifiers(text: string): { text: string; redacted: boolean } {
  let out = text;
  for (const [pattern, label] of PATTERNS) out = out.replace(pattern, label);
  return { text: out, redacted: out !== text };
}
