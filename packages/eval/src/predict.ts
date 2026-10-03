import { detect, type Entity } from "@ua-pii/core";
import type { Layer } from "./types.ts";

/**
 * Ablation hook. `model` is empty until phase 4.
 * `hybrid` equals `rules` until the NER merge lands.
 */
export function predict(text: string, layer: Layer): Entity[] {
  if (layer === "model") return [];
  return detect(text);
}
