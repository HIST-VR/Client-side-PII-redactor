import { EntityType, type Entity } from "@ua-pii/core";
import type { Counts, GoldSpan, Score } from "./types.ts";

export function emptyCounts(): Counts {
  return { tp: 0, fp: 0, fn: 0 };
}

export function addCounts(a: Counts, b: Counts): Counts {
  return { tp: a.tp + b.tp, fp: a.fp + b.fp, fn: a.fn + b.fn };
}

function key(e: { start: number; end: number; type: string }): string {
  return `${e.start}:${e.end}:${e.type}`;
}

/** Strict entity match: identical character span and type. */
export function countDoc(gold: GoldSpan[], pred: Entity[]): Counts {
  const g = new Set(gold.map(key));
  const p = new Set(pred.map(key));
  let tp = 0;
  for (const k of p) {
    if (g.has(k)) tp += 1;
  }
  return { tp, fp: p.size - tp, fn: g.size - tp };
}

export function scoreOf(c: Counts, support: number): Score {
  const precision = c.tp + c.fp === 0 ? 0 : c.tp / (c.tp + c.fp);
  const recall = c.tp + c.fn === 0 ? 0 : c.tp / (c.tp + c.fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { ...c, precision, recall, f1, support };
}

export const ALL_TYPES: EntityType[] = [
  EntityType.PERSON,
  EntityType.PHONE,
  EntityType.IBAN,
  EntityType.CARD,
  EntityType.RNOKPP,
  EntityType.EDRPOU,
  EntityType.PASSPORT,
  EntityType.UNZR,
  EntityType.EMAIL,
  EntityType.ADDRESS,
  EntityType.DOB,
];

export interface Mismatch {
  doc_id: string;
  kind: "fp" | "fn";
  type: string;
  start: number;
  end: number;
  text: string;
}

export function mismatches(docId: string, text: string, gold: GoldSpan[], pred: Entity[]): Mismatch[] {
  const gMap = new Map(gold.map((e) => [key(e), e]));
  const pMap = new Map(pred.map((e) => [key(e), e]));
  const out: Mismatch[] = [];
  for (const [k, e] of pMap) {
    if (!gMap.has(k)) {
      out.push({ doc_id: docId, kind: "fp", type: e.type, start: e.start, end: e.end, text: text.slice(e.start, e.end) });
    }
  }
  for (const [k, e] of gMap) {
    if (!pMap.has(k)) {
      out.push({
        doc_id: docId,
        kind: "fn",
        type: e.type,
        start: e.start,
        end: e.end,
        text: text.slice(e.start, e.end),
      });
    }
  }
  return out;
}
