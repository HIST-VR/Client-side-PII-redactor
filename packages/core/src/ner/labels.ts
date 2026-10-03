import { EntityType } from "../types.ts";

/** ukr-models/uk-ner tags. ORG is out of scope for this redactor. */
export const NER_TAG_TO_TYPE: Record<string, EntityType> = {
  PER: EntityType.PERSON,
  LOC: EntityType.ADDRESS,
};

export function parseBio(label: string): { prefix: "B" | "I" | "O"; tag: string } {
  if (!label || label === "O") return { prefix: "O", tag: "O" };
  const dash = label.indexOf("-");
  if (dash <= 0) return { prefix: "O", tag: label };
  const p = label.slice(0, dash);
  const tag = label.slice(dash + 1);
  if (p === "B" || p === "I") return { prefix: p, tag };
  return { prefix: "O", tag };
}

export function mapNerTag(tag: string): EntityType | null {
  return NER_TAG_TO_TYPE[tag] ?? null;
}
