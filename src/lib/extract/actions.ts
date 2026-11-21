"use server";

import { understandText, type UnderstandResult } from "./understand";

export async function understandAction(text: string): Promise<UnderstandResult> {
  if (typeof text !== "string") return { ok: false, error: "empty" };
  return understandText(text);
}
