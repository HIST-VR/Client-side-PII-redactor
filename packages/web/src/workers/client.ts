import type { Entity } from "@ua-pii/core";
import type { MainToWorker, WorkerToMain } from "./protocol";
import { parseDownloadPercent } from "./protocol";

export type NerStatus = "idle" | "loading" | "ready" | "error";

type Pending = {
  resolve: (entities: Entity[]) => void;
  reject: (err: Error) => void;
};

export class NerClient {
  status: NerStatus = "idle";
  lastError: string | null = null;
  progressMessage = "";
  progressPercent: number | null = null;

  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private readonly listeners = new Set<() => void>();
  private readyWaiters: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];

  constructor(private readonly spawnWorker: () => Worker = defaultWorker) {}

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  async load(): Promise<void> {
    if (this.status === "ready") return;
    if (this.status === "loading") {
      return new Promise<void>((resolve, reject) => {
        this.readyWaiters.push({ resolve, reject });
      });
    }
    // A failed fetch leaves ORT / transformers.js unusable in that worker.
    // Retry must start a new one (a new browser profile already does).
    this.dropWorker();
    this.status = "loading";
    this.lastError = null;
    this.progressMessage = "";
    this.progressPercent = null;
    this.emit();
    this.ensureWorker();
    this.post({ type: "load" });
    await new Promise<void>((resolve, reject) => {
      this.readyWaiters.push({ resolve, reject });
    });
  }

  async detect(text: string): Promise<Entity[]> {
    if (!text.trim()) return [];
    if (this.status !== "ready") {
      throw new Error("NER is not ready");
    }
    this.ensureWorker();
    const requestId = this.nextId++;
    return new Promise<Entity[]>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.post({ type: "detect", requestId, text });
    });
  }

  dispose(): void {
    this.dropWorker();
    for (const w of this.readyWaiters) w.reject(new Error("NER client disposed"));
    this.readyWaiters = [];
    this.status = "idle";
    this.emit();
  }

  private dropWorker(): void {
    for (const p of this.pending.values()) p.reject(new Error("NER worker reset"));
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = this.spawnWorker();
    worker.addEventListener("message", (event: MessageEvent<WorkerToMain>) => {
      this.onMessage(event.data);
    });
    worker.addEventListener("error", (event) => {
      this.fail(event.message || "Worker failed");
    });
    this.worker = worker;
    return worker;
  }

  private onMessage(msg: WorkerToMain): void {
    if (msg.type === "progress") {
      this.progressMessage = msg.message;
      const pct = parseDownloadPercent(msg.message);
      if (pct !== null) this.progressPercent = pct;
      this.emit();
      return;
    }
    if (msg.type === "ready") {
      this.status = "ready";
      this.progressMessage = "";
      this.progressPercent = 100;
      this.flushReady();
      this.emit();
      return;
    }
    if (msg.type === "result") {
      const pending = this.pending.get(msg.requestId);
      if (!pending) return;
      this.pending.delete(msg.requestId);
      pending.resolve(msg.entities);
      return;
    }
    this.fail(msg.message, msg.requestId);
  }

  private fail(message: string, requestId?: number): void {
    const restart = this.status !== "error";
    this.status = "error";
    this.lastError = message;
    if (requestId !== undefined) {
      const pending = this.pending.get(requestId);
      if (pending) {
        this.pending.delete(requestId);
        pending.reject(new Error(message));
      }
    }
    const waiters = this.readyWaiters;
    this.readyWaiters = [];
    for (const w of waiters) w.reject(new Error(message));
    if (restart) this.dropWorker();
    this.emit();
  }

  private flushReady(): void {
    const waiters = this.readyWaiters;
    this.readyWaiters = [];
    for (const w of waiters) w.resolve();
  }

  private post(msg: MainToWorker): void {
    this.ensureWorker().postMessage(msg);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }
}

function defaultWorker(): Worker {
  return new Worker(new URL("./ner.worker.ts", import.meta.url), { type: "module" });
}
