import { entity, EntityType, type Entity } from "../types.ts";
import { foldText, hasKeywordNearby } from "../textutil.ts";

const DOB_CONTEXT = [
  "народив",
  "народила",
  "народження",
  "дата нар",
  "д.н",
  "д. н",
  "дн:",
  "дн ",
  "р.н",
  "dob",
  "date of birth",
  "birthday",
  "born",
  "д/н",
] as const;

const MONTHS: Record<string, number> = {
  січня: 1, січень: 1, января: 1, январь: 1, january: 1, jan: 1,
  лютого: 2, лютий: 2, февраля: 2, февраль: 2, february: 2, feb: 2,
  березня: 3, березень: 3, марта: 3, март: 3, march: 3, mar: 3,
  квітня: 4, квітень: 4, апреля: 4, апрель: 4, april: 4, apr: 4,
  травня: 5, травень: 5, мая: 5, май: 5, may: 5,
  червня: 6, червень: 6, июня: 6, июнь: 6, june: 6, jun: 6,
  липня: 7, липень: 7, июля: 7, июль: 7, july: 7, jul: 7,
  серпня: 8, серпень: 8, августа: 8, август: 8, august: 8, aug: 8,
  вересня: 9, вересень: 9, сентября: 9, сентябрь: 9, september: 9, sep: 9, sept: 9,
  жовтня: 10, жовтень: 10, октября: 10, октябрь: 10, october: 10, oct: 10,
  листопада: 11, листопад: 11, ноября: 11, ноябрь: 11, november: 11, nov: 11,
  грудня: 12, грудень: 12, декабря: 12, декабрь: 12, december: 12, dec: 12,
};

const MONTH_ALT = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");

const NUMERIC = /(?<!\d)(\d{1,2})[./](\d{1,2})[./]((?:19|20)\d{2})(?!\d)/g;
const ISO = /(?<!\d)((?:19|20)\d{2})-(\d{2})-(\d{2})(?!\d)/g;
const NAMED = new RegExp(`(?<!\\d)(\\d{1,2})\\s+(${MONTH_ALT})\\s+((?:19|20)\\d{2})(?!\\d)`, "gi");

function safeDate(year: number, month: number, day: number): Date | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return d;
}

export function findDobs(text: string, today = new Date()): Entity[] {
  const folded = foldText(text);
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const minUtc = Date.UTC(1920, 0, 1);
  const entities: Entity[] = [];
  const seen = new Set<string>();

  const consider = (start: number, end: number, parsed: Date | null) => {
    if (!parsed) return;
    const utc = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
    if (utc < minUtc || utc > todayUtc) return;
    const key = `${start}:${end}`;
    if (seen.has(key)) return;
    if (!hasKeywordNearby(folded, start, end, DOB_CONTEXT)) return;
    seen.add(key);
    entities.push(entity(EntityType.DOB, start, end, text.slice(start, end)));
  };

  for (const re of [NUMERIC, ISO]) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(folded)) !== null) {
      if (re === ISO) {
        consider(match.index, match.index + match[0].length, safeDate(+match[1]!, +match[2]!, +match[3]!));
      } else {
        consider(match.index, match.index + match[0].length, safeDate(+match[3]!, +match[2]!, +match[1]!));
      }
    }
  }

  NAMED.lastIndex = 0;
  let named: RegExpExecArray | null;
  while ((named = NAMED.exec(folded)) !== null) {
    const month = MONTHS[named[2]!.toLowerCase()];
    if (!month) continue;
    consider(named.index, named.index + named[0].length, safeDate(+named[3]!, month, +named[1]!));
  }
  return entities;
}
