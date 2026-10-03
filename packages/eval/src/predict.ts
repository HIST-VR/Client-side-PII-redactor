import { createNerEngine, detect, detectHybrid, type Entity, type NerEngine } from "@ua-pii/core";
import type { Layer } from "./types.ts";

export type PredictFn = (text: string) => Entity[] | Promise<Entity[]>;

export function predictRules(text: string): Entity[] {
  return detect(text);
}

export function makePredictor(layer: Layer, engine?: NerEngine): PredictFn {
  if (layer === "rules") return predictRules;
  if (!engine) {
    throw new Error(`layer ${layer} needs a NER engine`);
  }
  if (layer === "model") return (text) => engine.detect(text);
  return async (text) => detectHybrid(text, await engine.detect(text));
}

export async function loadEngine(progress?: (msg: string) => void): Promise<NerEngine> {
  return createNerEngine({ progress });
}
