import { EntityType } from "@ua-pii/core";

export type Split = "dev" | "heldout";
export type Source = "generated" | "handwritten";
export type Layer = "rules" | "model" | "hybrid";

export interface GoldSpan {
  type: EntityType;
  start: number;
  end: number;
}

export interface GoldDoc {
  id: string;
  split: Split;
  source: Source;
  text: string;
  entities: GoldSpan[];
}

export interface Slot {
  type: EntityType;
  value: string;
}

export interface Counts {
  tp: number;
  fp: number;
  fn: number;
}

export interface Score extends Counts {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface Report {
  layer: Layer;
  split: Split | "all";
  n_docs: number;
  micro: Score;
  per_type: Record<string, Score>;
}
