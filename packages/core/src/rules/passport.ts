import { entity, EntityType, type Entity } from "../types.ts";
import { foldSeriesLetter, foldText, hasKeywordNearby, iterDigitGroups } from "../textutil.ts";

const UA_LETTERS = new Set([... "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ"]);

const ID_CONTEXT = [
  "паспорт",
  "паспорту",
  "паспорта",
  "id-карт",
  "id карт",
  "ід-карт",
  "ідентифікаційн",
  "документ №",
  "документ no",
  "документ n",
  "документ#",
  "серія",
  "номер паспорта",
  "passport",
] as const;

const BOOKLET_RE =
  /(?<![A-Za-zА-Яа-яІіЇїЄєҐґЁё])[A-Za-zА-Яа-яІіЇїЄєҐґЁё]{2}[\s-]*\d{6}(?!\d)/g;

function validSeries(letters: string): boolean {
  if (letters.length !== 2) return false;
  const a = foldSeriesLetter(letters[0]!);
  const b = foldSeriesLetter(letters[1]!);
  return UA_LETTERS.has(a) && UA_LETTERS.has(b);
}

export function findPassports(text: string): Entity[] {
  const folded = foldText(text);
  const entities: Entity[] = [];

  BOOKLET_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BOOKLET_RE.exec(folded)) !== null) {
    const series = match[0].slice(0, 2);
    if (!validSeries(series)) continue;
    entities.push(
      entity(EntityType.PASSPORT, match.index, match.index + match[0].length, text.slice(match.index, match.index + match[0].length), "booklet"),
    );
  }

  for (const [start, end] of iterDigitGroups(text, 9)) {
    if (hasKeywordNearby(folded, start, end, ID_CONTEXT)) {
      entities.push(entity(EntityType.PASSPORT, start, end, text.slice(start, end), "id_card"));
    }
  }
  return entities;
}
