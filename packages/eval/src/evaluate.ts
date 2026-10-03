import type { Entity } from "@ua-pii/core";
import { ALL_TYPES, addCounts, countDoc, emptyCounts, mismatches, scoreOf, type Mismatch } from "./metrics.ts";
import { predictRules, type PredictFn } from "./predict.ts";
import type { GoldDoc, Layer, Report, Score, Split } from "./types.ts";

export async function evaluate(
  docs: GoldDoc[],
  layer: Layer,
  split: Split | "all" = "all",
  predictFn: PredictFn = predictRules,
): Promise<Report> {
  let micro = emptyCounts();
  const per = Object.fromEntries(ALL_TYPES.map((t) => [t, emptyCounts()]));
  const support: Record<string, number> = Object.fromEntries(ALL_TYPES.map((t) => [t, 0]));
  let goldTotal = 0;

  for (const d of docs) {
    const pred = await predictFn(d.text);
    micro = addCounts(micro, countDoc(d.entities, pred));
    goldTotal += d.entities.length;
    for (const t of ALL_TYPES) {
      const g = d.entities.filter((e) => e.type === t);
      const p = pred.filter((e) => e.type === t);
      per[t] = addCounts(per[t]!, countDoc(g, p));
      support[t]! += g.length;
    }
  }

  const per_type: Record<string, Score> = {};
  for (const t of ALL_TYPES) {
    per_type[t] = scoreOf(per[t]!, support[t]!);
  }

  return {
    layer,
    split,
    n_docs: docs.length,
    micro: scoreOf(micro, goldTotal),
    per_type,
  };
}

export async function collectMismatches(docs: GoldDoc[], predictFn: PredictFn): Promise<Mismatch[]> {
  const out: Mismatch[] = [];
  for (const d of docs) {
    const pred: Entity[] = await predictFn(d.text);
    out.push(...mismatches(d.id, d.text, d.entities, pred));
  }
  return out;
}

export function formatReport(report: Report): string {
  const lines: string[] = [
    `layer=${report.layer} split=${report.split} n_docs=${report.n_docs}`,
    formatRow("micro", report.micro),
  ];
  for (const [type, score] of Object.entries(report.per_type)) {
    lines.push(formatRow(type, score));
  }
  return lines.join("\n");
}

function formatRow(name: string, s: Score): string {
  const label = name.padEnd(10);
  return `${label} P=${s.precision.toFixed(3)} R=${s.recall.toFixed(3)} F1=${s.f1.toFixed(3)}  tp=${s.tp} fp=${s.fp} fn=${s.fn} support=${s.support}`;
}
