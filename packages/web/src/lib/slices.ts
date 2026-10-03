import { PRIORITY, type Entity } from "@ua-pii/core";

export interface Slice {
  start: number;
  end: number;
  text: string;
  entities: Entity[];
}

/**
 * Non-overlapping slices. Nested spans (PERSON/ADDRESS around an IBAN) share
 * the inner range; the highest-priority entity paints the mark.
 */
export function slices(text: string, entities: readonly Entity[]): Slice[] {
  if (text.length === 0) return [];
  const bounds = new Set<number>([0, text.length]);
  for (const e of entities) {
    bounds.add(Math.max(0, Math.min(text.length, e.start)));
    bounds.add(Math.max(0, Math.min(text.length, e.end)));
  }
  const points = [...bounds].sort((a, b) => a - b);
  const out: Slice[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]!;
    const end = points[i + 1]!;
    if (start === end) continue;
    const covering = entities
      .filter((e) => e.start <= start && e.end >= end)
      .sort((a, b) => PRIORITY[b.type] - PRIORITY[a.type] || b.end - b.start - (a.end - a.start));
    out.push({ start, end, text: text.slice(start, end), entities: covering });
  }
  return out;
}

export function topEntity(slice: Slice): Entity | undefined {
  return slice.entities[0];
}
