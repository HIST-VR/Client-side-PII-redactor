import { entity, EntityType, type Entity } from "../types.ts";
import { foldText, onlyDigits } from "../textutil.ts";

const PHONE_RE =
  /(?<!\d)(?:\+|00\s*)?380(?:[\s\-()]*\d){9}(?!\d)|(?<!\d)\(?0(?:[\s\-()]*\d){9}(?!\d)/g;

function isUaPhone(digits: string): boolean {
  if (digits.startsWith("380") && digits.length === 12) return true;
  if (digits.startsWith("0") && digits.length === 10) return true;
  return false;
}

export function findPhones(text: string): Entity[] {
  const folded = foldText(text);
  const entities: Entity[] = [];
  PHONE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PHONE_RE.exec(folded)) !== null) {
    let digits = onlyDigits(match[0]);
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (isUaPhone(digits)) {
      entities.push(entity(EntityType.PHONE, match.index, match.index + match[0].length, text.slice(match.index, match.index + match[0].length)));
    }
  }
  return entities;
}
