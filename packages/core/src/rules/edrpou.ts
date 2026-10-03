import { entity, EntityType, type Entity } from "../types.ts";
import { iterDigitGroups } from "../textutil.ts";
import { isValidEdrpou } from "../validators/edrpou.ts";

export function findEdrpou(text: string): Entity[] {
  const entities: Entity[] = [];
  for (const [start, end, digits] of iterDigitGroups(text, 8)) {
    if (isValidEdrpou(digits)) {
      entities.push(entity(EntityType.EDRPOU, start, end, text.slice(start, end)));
    }
  }
  return entities;
}
