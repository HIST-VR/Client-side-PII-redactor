import { createNerEngine, type NerEngine } from "@ua-pii/core";
import type { MainToWorker, WorkerToMain } from "./protocol";

let engine: NerEngine | null = null;
let loading: Promise<NerEngine> | null = null;

function post(msg: WorkerToMain): void {
  self.postMessage(msg);
}

function wasmPaths(): string {
  return new URL(`${import.meta.env.BASE_URL}wasm/`, self.location.origin).href;
}

async function loadEngine(): Promise<NerEngine> {
  if (engine) return engine;
  if (loading) return loading;
  loading = createNerEngine({
    wasmPaths: wasmPaths(),
    wasmNumThreads: 1,
    progress: (message) => post({ type: "progress", message }),
  }).then((created) => {
    engine = created;
    loading = null;
    return created;
  });
  try {
    return await loading;
  } catch (err) {
    loading = null;
    throw err;
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

self.addEventListener("message", (event: MessageEvent<MainToWorker>) => {
  const msg = event.data;
  void (async () => {
    try {
      if (msg.type === "load") {
        await loadEngine();
        post({ type: "ready" });
        return;
      }
      if (msg.type === "detect") {
        const ner = await loadEngine();
        const entities = await ner.detect(msg.text);
        post({ type: "result", requestId: msg.requestId, entities });
      }
    } catch (err) {
      post({
        type: "error",
        requestId: msg.type === "detect" ? msg.requestId : undefined,
        message: errorMessage(err),
      });
    }
  })();
});
