import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultCorpusPath, loadCorpus } from "./corpus.ts";
import { collectMismatches, evaluate, formatReport } from "./evaluate.ts";
import { loadEngine, makePredictor } from "./predict.ts";
import type { GoldDoc, Layer, Split } from "./types.ts";

function repoRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "../../..");
}

function resolveRepoPath(path: string): string {
  return isAbsolute(path) ? path : join(repoRoot(), path);
}

const LAYERS = new Set<Layer>(["rules", "model", "hybrid"]);
const SPLITS = new Set<Split | "all">(["dev", "heldout", "all"]);

interface Args {
  layer: Layer;
  split: Split | "all";
  corpus: string;
  json?: string;
  mismatches: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    layer: "rules",
    split: "heldout",
    corpus: defaultCorpusPath(),
    mismatches: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--layer") args.layer = next(argv, ++i, a) as Layer;
    else if (a === "--split") args.split = next(argv, ++i, a) as Split | "all";
    else if (a === "--corpus") args.corpus = resolveRepoPath(next(argv, ++i, a));
    else if (a === "--json") args.json = resolveRepoPath(next(argv, ++i, a));
    else if (a === "--mismatches") args.mismatches = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  if (!LAYERS.has(args.layer)) throw new Error(`--layer must be rules|model|hybrid`);
  if (!SPLITS.has(args.split)) throw new Error(`--split must be heldout|dev|all`);
  return args;
}

function next(argv: string[], i: number, flag: string): string {
  const v = argv[i];
  if (!v) throw new Error(`${flag} needs a value`);
  return v;
}

function filterSplit(docs: GoldDoc[], split: Split | "all"): GoldDoc[] {
  if (split === "all") return docs;
  return docs.filter((d) => d.split === split);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: ua-pii-eval [--layer rules|model|hybrid] [--split heldout|dev|all]
                 [--corpus path] [--json path] [--mismatches]

Default: --layer rules --split heldout
Gold is true PII. Do not tune rules or the NER threshold against held-out.`);
    return;
  }
  const docs = filterSplit(loadCorpus(args.corpus), args.split);
  if (docs.length === 0) {
    throw new Error(`no documents for split=${args.split} in ${args.corpus}`);
  }
  const engine = args.layer === "rules" ? undefined : await loadEngine((msg) => console.error(msg));
  const predictFn = makePredictor(args.layer, engine);
  const report = await evaluate(docs, args.layer, args.split, predictFn);
  console.log(formatReport(report));
  if (args.json) {
    mkdirSync(dirname(args.json), { recursive: true });
    writeFileSync(args.json, JSON.stringify(report, null, 2) + "\n", "utf8");
    console.log(`wrote ${args.json}`);
  }
  if (args.mismatches) {
    const rows = await collectMismatches(docs, predictFn);
    for (const m of rows) {
      console.log(`${m.kind.toUpperCase()}\t${m.doc_id}\t${m.type}\t[${m.start},${m.end})\t${JSON.stringify(m.text)}`);
    }
    console.log(`${rows.length} mismatches`);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exitCode = 1;
});
