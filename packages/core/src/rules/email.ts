import { entity, EntityType, type Entity } from "../types.ts";

const EMAIL_RE =
  /(?<![A-Za-z0-9._%+\-])[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,24}(?![A-Za-z0-9])/g;

export function findEmails(text: string): Entity[] {
  const entities: Entity[] = [];
  EMAIL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EMAIL_RE.exec(text)) !== null) {
    entities.push(entity(EntityType.EMAIL, match.index, match.index + match[0].length, match[0]));
  }
  return entities;
}
