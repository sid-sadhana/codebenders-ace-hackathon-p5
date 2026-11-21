import { z } from "zod";
import { schemeSchema, type Scheme } from "@/types/scheme";
import families from "./families.json";
import farmers from "./farmers.json";
import seniors from "./seniors.json";
import students from "./students.json";
import women from "./women.json";

const parsed = z.array(schemeSchema).parse([
  ...students,
  ...seniors,
  ...families,
  ...farmers,
  ...women,
]);

const ids = new Set<string>();
for (const scheme of parsed) {
  if (ids.has(scheme.id)) throw new Error(`Duplicate scheme id: ${scheme.id}`);
  ids.add(scheme.id);
}
for (const scheme of parsed) {
  for (const other of scheme.conflictsWith) {
    if (!ids.has(other)) throw new Error(`${scheme.id} conflicts with unknown scheme ${other}`);
  }
}

export const schemes: Scheme[] = parsed;
