import { detect } from "./detect.ts";
import { merge } from "./merge.ts";
import type { Entity } from "./types.ts";

/** Rules plus model spans, then the same merge used by `detect()`. */
export function detectHybrid(text: string, modelEntities: readonly Entity[]): Entity[] {
  return merge([...detect(text), ...modelEntities]);
}
