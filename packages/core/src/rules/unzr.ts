import { entity, EntityType, type Entity } from "../types.ts";
import { foldText, iterDigitGroups } from "../textutil.ts";
import { isValidUnzr } from "../validators/unzr.ts";

const FORMATTED = /(?<!\d)\d{8}-\d{5}(?!\d)/g;

export function findUnzr(text: string): Entity[] {
  const folded = foldText(text);
  const seen = new Set<string>();
  const entities: Entity[] = [];

  FORMATTED.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FORMATTED.exec(folded)) !== null) {
    const raw = text.slice(match.index, match.index + match[0].length);
    if (isValidUnzr(raw)) {
      seen.add(`${match.index}:${match.index + match[0].length}`);
      entities.push(entity(EntityType.UNZR, match.index, match.index + match[0].length, raw));
    }
  }

  for (const [start, end, digits] of iterDigitGroups(text, 13)) {
    if (seen.has(`${start}:${end}`)) continue;
    if (isValidUnzr(digits)) {
      entities.push(entity(EntityType.UNZR, start, end, text.slice(start, end)));
    }
  }
  return entities;
}
