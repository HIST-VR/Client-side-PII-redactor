import { describe, expect, it } from "vitest";
import { NerClient } from "./client";
import type { MainToWorker, WorkerToMain } from "./protocol";

class FakeWorker {
  terminated = false;
  loads = 0;
  failNext = true;
  private readonly listeners = new Set<(event: MessageEvent<WorkerToMain>) => void>();

  addEventListener(type: string, fn: (event: MessageEvent<WorkerToMain>) => void): void {
    if (type === "message") this.listeners.add(fn);
  }

  removeEventListener(type: string, fn: (event: MessageEvent<WorkerToMain>) => void): void {
    if (type === "message") this.listeners.delete(fn);
  }

  postMessage(msg: MainToWorker): void {
    if (this.terminated) return;
    if (msg.type !== "load") return;
    this.loads += 1;
    queueMicrotask(() => {
      if (this.terminated) return;
      if (this.failNext) {
        this.failNext = false;
        this.emit({ type: "error", message: "Failed to fetch" });
        return;
      }
      this.emit({ type: "ready" });
    });
  }

  terminate(): void {
    this.terminated = true;
  }

  private emit(data: WorkerToMain): void {
    const event = { data } as MessageEvent<WorkerToMain>;
    for (const fn of this.listeners) fn(event);
  }
}

describe("NerClient retry", () => {
  it("starts a new worker after a failed load", async () => {
    const workers: FakeWorker[] = [];
    const ner = new NerClient(() => {
      const w = new FakeWorker();
      w.failNext = workers.length === 0;
      workers.push(w);
      return w as unknown as Worker;
    });

    await expect(ner.load()).rejects.toThrow("Failed to fetch");
    expect(ner.status).toBe("error");
    expect(workers).toHaveLength(1);
    expect(workers[0]!.terminated).toBe(true);

    await ner.load();
    expect(ner.status).toBe("ready");
    expect(workers).toHaveLength(2);
    expect(workers[1]!.terminated).toBe(false);
    expect(workers[1]!.loads).toBe(1);
  });
});
