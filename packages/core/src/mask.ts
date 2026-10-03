import { EntityType, type Entity } from "./types.ts";
import { foldText, onlyDigits } from "./textutil.ts";

export const MaskMode = {
  PLACEHOLDER: "placeholder",
  PARTIAL: "partial",
  PSEUDONYM: "pseudonym",
} as const;

export type MaskMode = (typeof MaskMode)[keyof typeof MaskMode];

const PLACEHOLDER: Record<EntityType, string> = {
  PERSON: "[PERSON]",
  PHONE: "[PHONE]",
  IBAN: "[IBAN]",
  CARD: "[CARD]",
  RNOKPP: "[RNOKPP]",
  EDRPOU: "[EDRPOU]",
  PASSPORT: "[PASSPORT]",
  UNZR: "[UNZR]",
  EMAIL: "[EMAIL]",
  ADDRESS: "[ADDRESS]",
  DOB: "[DOB]",
};

const DIGIT_TYPES = new Set<EntityType>([
  "PHONE",
  "IBAN",
  "CARD",
  "RNOKPP",
  "EDRPOU",
  "UNZR",
]);

export function mask(text: string, entities: Entity[], mode: MaskMode = MaskMode.PLACEHOLDER): string {
  if (entities.length === 0) return text;
  const aliases = new Map<string, string>();
  if (mode === MaskMode.PSEUDONYM) {
    const counters = new Map<EntityType, number>();
    const readingOrder = [...entities].sort((a, b) => a.start - b.start);
    for (const e of readingOrder) {
      const key = `${e.type}|${normKey(e)}`;
      if (!aliases.has(key)) {
        const n = (counters.get(e.type) ?? 0) + 1;
        counters.set(e.type, n);
        aliases.set(key, `${e.type}_${n}`);
      }
    }
  }
  const ordered = [...entities].sort((a, b) => b.start - a.start);
  let result = text;
  for (const e of ordered) {
    result = result.slice(0, e.start) + replace(e, mode, aliases) + result.slice(e.end);
  }
  return result;
}

function replace(e: Entity, mode: MaskMode, aliases: Map<string, string>): string {
  if (mode === MaskMode.PLACEHOLDER) return PLACEHOLDER[e.type];
  if (mode === MaskMode.PSEUDONYM) return aliases.get(`${e.type}|${normKey(e)}`) ?? PLACEHOLDER[e.type];
  return partial(e);
}

function normKey(e: Entity): string {
  const folded = foldText(e.value).toLowerCase();
  const digits = onlyDigits(folded);
  if (DIGIT_TYPES.has(e.type)) return digits;
  return folded.split(/\s+/).filter(Boolean).join(" ");
}

function partial(e: Entity): string {
  if (e.type === EntityType.EMAIL) {
    const at = e.value.indexOf("@");
    if (at < 0) return PLACEHOLDER.EMAIL;
    const local = e.value.slice(0, at);
    const domain = e.value.slice(at + 1);
    const head = local[0] ?? "*";
    return `${head}***@${domain}`;
  }
  if (e.type === EntityType.PERSON) {
    return e.value
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0] + "*".repeat(Math.max(1, part.length - 1)))
      .join(" ") || PLACEHOLDER.PERSON;
  }
  if (e.type === EntityType.ADDRESS) return PLACEHOLDER.ADDRESS;
  if (e.type === EntityType.DOB) return PLACEHOLDER.DOB;
  const digits = onlyDigits(e.value);
  if (digits.length >= 4) return "*".repeat(digits.length - 4) + digits.slice(-4);
  return PLACEHOLDER[e.type];
}
