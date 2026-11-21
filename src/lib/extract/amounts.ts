/**
 * Small deterministic reader for rupee amounts written with digits, used to
 * double-check the income the language model reports.
 * "1.5 lakh", "1.5L", "1,50,000", "2 లక్షలు", "8 వేలు నెలకు" -> yearly rupees.
 */
export function readYearlyRupees(text: string): number | null {
  const normalized = text.toLowerCase().replace(/₹|rs\.?|rupees|రూపాయలు/g, " ");
  const match = normalized.match(
    /(\d+(?:[.,]\d+)*)\s*(lakhs?|lacs?|l\b|లక్ష\S*|thousand|k\b|వేల\S*|వేయి|వెయ్యి)?/,
  );
  if (!match) return null;

  const raw = match[1];
  const unit = match[2] ?? "";
  let value = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;

  if (/^(lakh|lac|l$|లక్ష)/.test(unit)) value *= 100000;
  else if (/^(thousand|k$|వేల|వేయి|వెయ్యి)/.test(unit)) value *= 1000;

  if (/per month|a month|monthly|నెలకు|నెలకి/.test(normalized)) value *= 12;
  return Math.round(value);
}
