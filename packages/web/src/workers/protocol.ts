import type { Entity } from "@ua-pii/core";

export type MainToWorker =
  | { type: "load" }
  | { type: "detect"; requestId: number; text: string };

export type WorkerToMain =
  | { type: "progress"; message: string }
  | { type: "ready" }
  | { type: "result"; requestId: number; entities: Entity[] }
  | { type: "error"; requestId?: number; message: string };

export function parseDownloadPercent(message: string): number | null {
  const m = /(\d+)%\s*$/.exec(message);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
}
