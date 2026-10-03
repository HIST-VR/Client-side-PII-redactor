import { entity, Source, type Entity } from "../types.ts";
import { alignTokens } from "./align.ts";
import { mapNerTag, parseBio } from "./labels.ts";

export interface NerToken {
  word: string;
  entity: string;
  score: number;
}

export const DEFAULT_NER_THRESHOLD = 0.5;

/**
 * Align tokens, fuse BIO groups, map PER/LOC, drop ORG and low-score spans.
 */
export function tokensToEntities(
  text: string,
  tokens: readonly NerToken[],
  threshold = DEFAULT_NER_THRESHOLD,
): Entity[] {
  const aligned = alignTokens(
    text,
    tokens.map((t) => t.word),
  );
  const groups = groupBio(tokens, aligned);
  const raw: Entity[] = [];
  for (const g of groups) {
    const type = mapNerTag(g.tag);
    if (!type) continue;
    if (g.score < threshold) continue;
    const snapped = snapWord(text, g.start, g.end);
    const trimmed = trimSpan(text, snapped[0], snapped[1]);
    if (!trimmed) continue;
    const [start, end] = trimmed;
    raw.push(entity(type, start, end, text.slice(start, end), undefined, Source.MODEL));
  }
  return mergeTouching(text, raw);
}

interface Group {
  tag: string;
  start: number;
  end: number;
  score: number;
}

function groupBio(tokens: readonly NerToken[], aligned: Array<{ start: number; end: number } | null>): Group[] {
  const groups: Group[] = [];
  let open: { tag: string; start: number; end: number; scoreSum: number; n: number } | null = null;

  const flush = () => {
    if (!open) return;
    groups.push({
      tag: open.tag,
      start: open.start,
      end: open.end,
      score: open.scoreSum / open.n,
    });
    open = null;
  };

  for (let i = 0; i < tokens.length; i++) {
    const span = aligned[i];
    const { prefix, tag } = parseBio(tokens[i]!.entity);
    if (!span || prefix === "O" || !mapNerTag(tag)) {
      flush();
      continue;
    }
    if (open && open.tag === tag && prefix === "I") {
      open.end = span.end;
      open.scoreSum += tokens[i]!.score;
      open.n += 1;
    } else {
      flush();
      open = { tag, start: span.start, end: span.end, scoreSum: tokens[i]!.score, n: 1 };
    }
  }
  flush();
  return groups;
}

function trimSpan(text: string, start: number, end: number): [number, number] | null {
  let s = start;
  let e = end;
  while (s < e && /\s/.test(text[s]!)) s += 1;
  while (e > s && /\s/.test(text[e - 1]!)) e -= 1;
  if (e - s < 2) return null;
  return [s, e];
}

function isLetter(ch: string): boolean {
  return /\p{L}/u.test(ch);
}

/** Subword models often tag the second piece of a name; grow to the word. */
function snapWord(text: string, start: number, end: number): [number, number] {
  let s = start;
  let e = end;
  while (s > 0 && isLetter(text[s - 1]!)) s -= 1;
  while (e < text.length && isLetter(text[e]!)) e += 1;
  return [s, e];
}

function mergeTouching(text: string, entities: Entity[]): Entity[] {
  const sorted = [...entities].sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Entity[] = [];
  for (const e of sorted) {
    const prev = out[out.length - 1];
    if (prev && prev.type === e.type && e.start <= prev.end) {
      prev.end = Math.max(prev.end, e.end);
      prev.value = text.slice(prev.start, prev.end);
      continue;
    }
    out.push({ ...e });
  }
  return out;
}
