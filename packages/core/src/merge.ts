import { CONTAINER_TYPES, PRIORITY, type Entity } from "./types.ts";

export function overlaps(a: Entity, b: Entity): boolean {
  return a.start < b.end && b.start < a.end;
}

export function contains(outer: Entity, inner: Entity): boolean {
  return (
    outer.start <= inner.start &&
    outer.end >= inner.end &&
    outer.end - outer.start > inner.end - inner.start
  );
}

export function merge(entities: Entity[]): Entity[] {
  if (entities.length === 0) return [];
  const structured = entities.filter((e) => !CONTAINER_TYPES.has(e.type));
  const containers = entities.filter((e) => CONTAINER_TYPES.has(e.type));
  const keptStruct = greedy(structured);
  const keptContainers: Entity[] = [];
  for (const container of greedy(containers)) {
    if (partialConflict(container, keptStruct)) continue;
    keptContainers.push(container);
  }
  return [...keptStruct, ...keptContainers].sort((a, b) => a.start - b.start || a.end - b.end || a.type.localeCompare(b.type));
}

function greedy(entities: Entity[]): Entity[] {
  const ordered = [...entities].sort((a, b) => {
    const pa = PRIORITY[a.type];
    const pb = PRIORITY[b.type];
    if (pb !== pa) return pb - pa;
    const la = a.end - a.start;
    const lb = b.end - b.start;
    if (lb !== la) return lb - la;
    return a.start - b.start;
  });
  const kept: Entity[] = [];
  for (const e of ordered) {
    if (kept.some((k) => overlaps(e, k))) continue;
    kept.push(e);
  }
  return kept;
}

function partialConflict(container: Entity, structured: Entity[]): boolean {
  for (const item of structured) {
    if (!overlaps(container, item)) continue;
    const nested = contains(container, item) || contains(item, container);
    if (!nested) return true;
  }
  return false;
}
