import { entity, EntityType, type Entity } from "../types.ts";
import { iterDigitGroupsRange } from "../textutil.ts";
import { luhnValid } from "../validators/luhn.ts";

export function findCards(text: string): Entity[] {
  const entities: Entity[] = [];
  for (const [start, end, digits] of iterDigitGroupsRange(text, 13, 19)) {
    const grouped = end - start !== digits.length;
    if (!grouped && digits.length !== 16) continue;
    if (luhnValid(digits)) {
      entities.push(entity(EntityType.CARD, start, end, text.slice(start, end)));
    }
  }
  return entities;
}
