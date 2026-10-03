/** Frozen copies of `datasets/metrics-*-heldout.json` so the demo has no runtime fetch. */
import hybrid from "./metrics-hybrid-heldout.json" with { type: "json" };
import model from "./metrics-model-heldout.json" with { type: "json" };
import rules from "./metrics-rules-heldout.json" with { type: "json" };

export interface Score {
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface Report {
  layer: string;
  split: string;
  n_docs: number;
  micro: Score;
  per_type: Record<string, Score>;
}

export const METRICS = {
  rules: rules as Report,
  model: model as Report,
  hybrid: hybrid as Report,
} as const;

export function fmtScore(n: number): string {
  return n.toFixed(3);
}
