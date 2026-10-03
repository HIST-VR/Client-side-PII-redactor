import { entity, EntityType, type Entity } from "../types.ts";
import { foldText } from "../textutil.ts";
import { isValidIban } from "../validators/iban.ts";

const IBAN_RE = /UA(?:[\s-]*\d){27}/gi;

export function findIbans(text: string): Entity[] {
  const folded = foldText(text);
  const entities: Entity[] = [];
  IBAN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IBAN_RE.exec(folded)) !== null) {
    const raw = text.slice(match.index, match.index + match[0].length);
    if (isValidIban(raw)) {
      entities.push(entity(EntityType.IBAN, match.index, match.index + match[0].length, raw));
    }
  }
  return entities;
}
