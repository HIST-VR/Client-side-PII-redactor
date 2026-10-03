import type { Entity } from "../types.ts";
import { DEFAULT_NER_THRESHOLD, tokensToEntities, type NerToken } from "./postprocess.ts";
import { mergeWindowPreds, tokenWindows, type TokenPred } from "./windows.ts";

export const DEFAULT_NER_MODEL = "onnx-community/uk-ner-ONNX";
export const DEFAULT_NER_DTYPE = "int8" as const;

/** Same-origin ORT wasm, or a CDN prefix. Set this before load in a Web Worker. */
export type OnnxWasmPaths = string | { wasm?: string; mjs?: string };

export interface NerEngineOptions {
  modelId?: string;
  dtype?: "int8" | "q8" | "q4f16" | "fp32";
  scoreThreshold?: number;
  maxLength?: number;
  stride?: number;
  wasmPaths?: OnnxWasmPaths;
  /** 1 inside a Worker: nested ORT thread-pool workers are unreliable. */
  wasmNumThreads?: number;
  progress?: (msg: string) => void;
}

export interface NerEngine {
  detect(text: string): Promise<Entity[]>;
}

/**
 * Load uk-ner ONNX via transformers.js.
 * Weights come from Hugging Face Hub; user text stays in-process.
 */
export async function createNerEngine(options: NerEngineOptions = {}): Promise<NerEngine> {
  const modelId = options.modelId ?? DEFAULT_NER_MODEL;
  const dtype = options.dtype ?? DEFAULT_NER_DTYPE;
  const threshold = options.scoreThreshold ?? DEFAULT_NER_THRESHOLD;
  const maxLength = options.maxLength ?? 512;
  const stride = options.stride ?? 128;
  const progress = options.progress ?? (() => undefined);

  progress(`loading ${modelId} dtype=${dtype}`);
  const tf = await import("@huggingface/transformers");
  tf.env.allowRemoteModels = true;
  tf.env.allowLocalModels = false;
  const wasm = tf.env.backends.onnx?.wasm as
    | { proxy?: boolean; wasmPaths?: OnnxWasmPaths; numThreads?: number }
    | undefined;
  if (wasm) {
    wasm.proxy = false;
    if (options.wasmPaths !== undefined) wasm.wasmPaths = options.wasmPaths;
    if (options.wasmNumThreads !== undefined) wasm.numThreads = options.wasmNumThreads;
  }

  const tokenizer = await tf.AutoTokenizer.from_pretrained(modelId);
  const model = await tf.AutoModelForTokenClassification.from_pretrained(modelId, {
    dtype,
    progress_callback: (info: { status?: string; file?: string; progress?: number }) => {
      if (info.status === "progress" && info.file) {
        const pct = typeof info.progress === "number" ? ` ${Math.round(info.progress)}%` : "";
        progress(`download ${info.file}${pct}`);
      } else if (info.status === "initiate" && info.file) {
        progress(`fetch ${info.file}`);
      } else if (info.status === "done" && info.file) {
        progress(`cached ${info.file}`);
      }
    },
  });
  progress("ner ready");

  const id2label = ((model.config as { id2label?: Record<string | number, string> }).id2label ?? {}) as Record<
    string | number,
    string
  >;

  return {
    async detect(text: string): Promise<Entity[]> {
      if (!text.trim()) return [];
      const tokens = await inferTokens(
        tf,
        tokenizer as unknown as TokenizerLike,
        model as unknown as ModelLike,
        id2label,
        text,
        maxLength,
        stride,
      );
      return tokensToEntities(text, tokens, threshold);
    },
  };
}

async function inferTokens(
  tf: typeof import("@huggingface/transformers"),
  tokenizer: TokenizerLike,
  model: ModelLike,
  id2label: Record<string | number, string>,
  text: string,
  maxLength: number,
  stride: number,
): Promise<NerToken[]> {
  const encoded = tokenizer(text, {
    add_special_tokens: false,
    truncation: false,
    return_tensor: false,
  }) as { input_ids: number[] | number[][] };

  const contentIds = flattenIds(encoded.input_ids);
  const words = idsToWords(tokenizer, contentIds);
  const windows = tokenWindows(contentIds.length, maxLength, stride);
  const windowPreds: { start: number; preds: TokenPred[] }[] = [];

  const bos = tokenizer.bos_token_id ?? tokenizer.cls_token_id ?? 0;
  const eos = tokenizer.eos_token_id ?? tokenizer.sep_token_id ?? 2;

  for (const w of windows) {
    const wrapped = [bos, ...contentIds.slice(w.start, w.end), eos];
    const mask = wrapped.map(() => 1);
    const inputs = {
      input_ids: new tf.Tensor("int64", BigInt64Array.from(wrapped.map(BigInt)), [1, wrapped.length]),
      attention_mask: new tf.Tensor("int64", BigInt64Array.from(mask.map(BigInt)), [1, wrapped.length]),
    };
    const outputs = await model(inputs);
    const seq = logitsRow(outputs.logits, 0);
    const contentLogits = seq.slice(1, 1 + (w.end - w.start));
    const preds: TokenPred[] = contentLogits.map((row) => {
      const { index, score } = softmaxArgmax(row);
      return { label: id2label[index] ?? id2label[String(index)] ?? "O", score };
    });
    windowPreds.push({ start: w.start, preds });
  }

  const merged = mergeWindowPreds(contentIds.length, windowPreds);
  return merged.map((p, i) => ({
    word: words[i] ?? "",
    entity: p.label,
    score: p.score,
  }));
}

interface TokenizerLike {
  (text: string, opts: Record<string, unknown>): unknown;
  bos_token_id?: number;
  cls_token_id?: number;
  eos_token_id?: number;
  sep_token_id?: number;
  pad_token_id?: number;
  decode: (ids: number[], opts?: { skip_special_tokens?: boolean }) => string;
  convert_ids_to_tokens?: (ids: number[]) => string[];
}

type ModelLike = (inputs: unknown) => Promise<{ logits: Logits }>;

interface Logits {
  dims: number[];
  data?: ArrayLike<number>;
  tolist?: () => number[][][];
}

function flattenIds(ids: Array<number | bigint> | Array<Array<number | bigint>>): number[] {
  if (ids.length === 0) return [];
  const row = Array.isArray(ids[0]) ? (ids as Array<Array<number | bigint>>)[0]! : (ids as Array<number | bigint>);
  return row.map((n) => Number(n));
}

function idsToWords(tokenizer: TokenizerLike, ids: number[]): string[] {
  if (typeof tokenizer.convert_ids_to_tokens === "function") {
    return tokenizer.convert_ids_to_tokens(ids);
  }
  return ids.map((id) => tokenizer.decode([id], { skip_special_tokens: false }));
}

function logitsRow(logits: Logits, batch: number): number[][] {
  if (typeof logits.tolist === "function") {
    return logits.tolist()[batch]!;
  }
  const seq = logits.dims[1];
  const labels = logits.dims[2];
  const data = logits.data;
  if (!data || seq === undefined || labels === undefined) {
    throw new Error("unexpected logits layout");
  }
  const row: number[][] = [];
  const offset = batch * seq * labels;
  for (let t = 0; t < seq; t++) {
    const start = offset + t * labels;
    const vec: number[] = [];
    for (let k = 0; k < labels; k++) vec.push(Number(data[start + k]));
    row.push(vec);
  }
  return row;
}

export function softmaxArgmax(values: ArrayLike<number>): { index: number; score: number } {
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (v > max) max = v;
  }
  let sum = 0;
  const exps = new Array<number>(values.length);
  for (let i = 0; i < values.length; i++) {
    exps[i] = Math.exp(values[i]! - max);
    sum += exps[i]!;
  }
  let best = 0;
  for (let i = 1; i < exps.length; i++) {
    if (exps[i]! > exps[best]!) best = i;
  }
  return { index: best, score: exps[best]! / sum };
}
