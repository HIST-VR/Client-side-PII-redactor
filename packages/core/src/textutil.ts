const LOOKALIKE: Record<string, string> = {
  A: "А",
  a: "А",
  B: "В",
  b: "В",
  C: "С",
  c: "С",
  E: "Е",
  e: "Е",
  H: "Н",
  h: "Н",
  I: "І",
  i: "І",
  K: "К",
  k: "К",
  M: "М",
  m: "М",
  O: "О",
  o: "О",
  P: "Р",
  p: "Р",
  T: "Т",
  t: "Т",
  X: "Х",
  x: "Х",
  Y: "У",
  y: "У",
};

const SPACEISH = new Set(["\u00a0", "\u202f", "\u2007", "\u2009", "\u200a", "\u200b", "\ufeff"]);
const DASHISH = new Set(["−", "–", "—", "‐", "‑", "‒"]);

export const DIGIT_SEPS = new Set([" ", "\t", "-", "/", "(", ")"]);

export function foldChar(ch: string): string {
  if (SPACEISH.has(ch)) return " ";
  if (DASHISH.has(ch)) return "-";
  const code = ch.codePointAt(0) ?? 0;
  if (code >= 0xff10 && code <= 0xff19) {
    return String.fromCharCode(0x30 + (code - 0xff10));
  }
  return ch;
}

export function foldText(text: string): string {
  let out = "";
  for (const ch of text) out += foldChar(ch);
  return out;
}

export function onlyDigits(text: string): string {
  let out = "";
  for (const ch of foldText(text)) {
    if (ch >= "0" && ch <= "9") out += ch;
  }
  return out;
}

export function foldSeriesLetter(ch: string): string {
  return (LOOKALIKE[ch] ?? ch).toUpperCase();
}

export function hasKeywordNearby(
  text: string,
  start: number,
  end: number,
  keywords: readonly string[],
  window = 48,
): boolean {
  const lo = Math.max(0, start - window);
  const hi = Math.min(text.length, end + window);
  const snippet = foldText(text.slice(lo, hi)).toLowerCase();
  return keywords.some((key) => snippet.includes(key));
}

export function* iterDigitGroups(
  text: string,
  count: number,
  seps: Set<string> = DIGIT_SEPS,
): Generator<[number, number, string]> {
  const folded = foldText(text);
  let i = 0;
  const n = folded.length;
  while (i < n) {
    if (folded[i]! >= "0" && folded[i]! <= "9") {
      let j = i;
      let digits = "";
      while (j < n && ((folded[j]! >= "0" && folded[j]! <= "9") || seps.has(folded[j]!))) {
        if (folded[j]! >= "0" && folded[j]! <= "9") digits += folded[j];
        j += 1;
      }
      let end = j;
      while (end > i && seps.has(folded[end - 1]!)) end -= 1;
      if (digits.length === count) yield [i, end, digits];
      i = j;
    } else {
      i += 1;
    }
  }
}

export function* iterDigitGroupsRange(
  text: string,
  minCount: number,
  maxCount: number,
  seps: Set<string> = DIGIT_SEPS,
): Generator<[number, number, string]> {
  const folded = foldText(text);
  let i = 0;
  const n = folded.length;
  while (i < n) {
    if (folded[i]! >= "0" && folded[i]! <= "9") {
      let j = i;
      let digits = "";
      while (j < n && ((folded[j]! >= "0" && folded[j]! <= "9") || seps.has(folded[j]!))) {
        if (folded[j]! >= "0" && folded[j]! <= "9") digits += folded[j];
        j += 1;
      }
      let end = j;
      while (end > i && seps.has(folded[end - 1]!)) end -= 1;
      if (digits.length >= minCount && digits.length <= maxCount) yield [i, end, digits];
      i = j;
    } else {
      i += 1;
    }
  }
}
