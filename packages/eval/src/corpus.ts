import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertGold } from "./fill.ts";
import { generatedDocs } from "./generated.ts";
import { handwrittenDocs } from "./handwritten.ts";
import type { GoldDoc } from "./types.ts";

export function defaultCorpusPath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "../../../datasets/corpus.jsonl");
}

export function buildCorpus(): GoldDoc[] {
  const docs = [...handwrittenDocs(), ...generatedDocs()];
  const ids = new Set<string>();
  for (const d of docs) {
    if (ids.has(d.id)) throw new Error(`duplicate gold id ${d.id}`);
    ids.add(d.id);
    assertGold(d.text, d.entities);
  }
  return docs;
}

export function loadCorpus(path: string): GoldDoc[] {
  const raw = readFileSync(path, "utf8");
  const docs: GoldDoc[] = [];
  for (const line of raw.split(/\n/)) {
    if (!line.trim()) continue;
    docs.push(JSON.parse(line) as GoldDoc);
  }
  return docs;
}

export function writeCorpus(path = defaultCorpusPath()): { path: string; docs: GoldDoc[] } {
  const docs = buildCorpus();
  mkdirSync(dirname(path), { recursive: true });
  const body = docs.map((d) => JSON.stringify(d)).join("\n") + "\n";
  writeFileSync(path, body, "utf8");
  return { path, docs };
}
