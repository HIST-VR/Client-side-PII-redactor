import { entity, EntityType, type Entity } from "../types.ts";
import { iterDigitGroups } from "../textutil.ts";
import { isValidRnokpp } from "../validators/rnokpp.ts";

export function findRnokpp(text: string): Entity[] {
  const entities: Entity[] = [];
  for (const [start, end, digits] of iterDigitGroups(text, 10)) {
    if (isValidRnokpp(digits)) {
      entities.push(entity(EntityType.RNOKPP, start, end, text.slice(start, end)));
    }
  }
  return entities;
}
