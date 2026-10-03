import { entity, EntityType, type Entity } from "../types.ts";
import { foldText } from "../textutil.ts";

const STREET_START =
  /(?:вул(?:иця|\.)|просп(?:ект|\.)|бульв(?:ар|\.)|пров(?:улок|\.)|пл(?:оща|\.)|майдан|шосе|набережна|street|str\.|avenue|ave\.)\s+/gi;

/** One or two capitalized tokens: «Хрещатик», «Лесі Українки». A third word would eat the recipient line. */
const NAME =
  /[A-ZА-ЯІЇЄҐЁ][A-Za-zА-Яа-яІіЇїЄєҐґё''\-]{1,40}(?:\s+[A-ZА-ЯІЇЄҐЁ][A-Za-zА-Яа-яІіЇїЄєҐґё''\-]{1,40})?/;

const BUILDING =
  /(?:\s*,\s*|\s+)(?:буд(?:инок|\.)|house|h\.)?\s*\d+\w?(?:(?:\s*,\s*|\s+)(?:кв(?:артира|\.)|apt\.?)\s*\d+)?/i;

export function findAddresses(text: string): Entity[] {
  const folded = foldText(text);
  const entities: Entity[] = [];
  STREET_START.lastIndex = 0;
  let startM: RegExpExecArray | null;
  while ((startM = STREET_START.exec(folded)) !== null) {
    const nameM = matchAt(NAME, folded, startM.index + startM[0].length);
    if (!nameM) continue;
    let end = nameM.index + nameM[0].length;
    const extra = matchAt(BUILDING, folded, end);
    if (extra) end = extra.index + extra[0].length;
    while (end > startM.index && " \t,".includes(folded[end - 1]!)) end -= 1;
    if (end - startM.index < 8) continue;
    entities.push(entity(EntityType.ADDRESS, startM.index, end, text.slice(startM.index, end)));
  }
  return entities;
}

function matchAt(re: RegExp, text: string, index: number): RegExpExecArray | null {
  const sliced = text.slice(index);
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const copy = new RegExp(re.source, flags);
  copy.lastIndex = 0;
  const m = copy.exec(sliced);
  if (!m || m.index !== 0) return null;
  m.index = index;
  return m;
}
