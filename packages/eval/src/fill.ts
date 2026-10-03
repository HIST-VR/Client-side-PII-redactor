import type { GoldSpan, Slot } from "./types.ts";

const TOKEN = /\{([a-z0-9_]+)\}/gi;

/** Replace `{slot}` tokens and record character spans in the resulting string. */
export function fill(
  template: string,
  slots: Record<string, Slot>,
): { text: string; entities: GoldSpan[] } {
  let text = "";
  const entities: GoldSpan[] = [];
  let last = 0;
  TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(template)) !== null) {
    const name = match[1]!;
    const slot = slots[name];
    if (!slot) {
      throw new Error(`unknown slot {${name}} in template: ${template.slice(0, 80)}`);
    }
    text += template.slice(last, match.index);
    const start = text.length;
    text += slot.value;
    entities.push({ type: slot.type, start, end: text.length });
    last = match.index + match[0].length;
  }
  text += template.slice(last);
  return { text, entities };
}

export function assertGold(text: string, entities: GoldSpan[]): void {
  const seen = new Set<string>();
  for (const e of entities) {
    if (e.start < 0 || e.end > text.length || e.end <= e.start) {
      throw new Error(`bad span [${e.start}, ${e.end}) for ${e.type}`);
    }
    const k = `${e.start}:${e.end}:${e.type}`;
    if (seen.has(k)) throw new Error(`duplicate gold ${k}`);
    seen.add(k);
  }
}

export function assignSplit(id: string): "dev" | "heldout" {
  // Stable 20% held-out: hashing the id, so adding new docs does not reshuffle old ones.
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 5 === 0 ? "heldout" : "dev";
}
