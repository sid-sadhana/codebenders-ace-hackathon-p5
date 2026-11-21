import { z } from "zod";

export type Lang = "te" | "en";

export const DEFAULT_LANG: Lang = "te";

export const LANG_STORAGE_KEY = "cwy:v1:lang";

export type LocalizedString = { te: string; en: string };

export const localizedStringSchema = z.object({
  te: z.string().min(1),
  en: z.string().min(1),
});

export type LocalizedStringInput = z.infer<typeof localizedStringSchema>;
