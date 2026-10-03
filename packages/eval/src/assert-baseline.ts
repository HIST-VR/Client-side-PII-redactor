import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultCorpusPath, loadCorpus } from "./corpus.ts";
import { evaluate } from "./evaluate.ts";
import { predictRules } from "./predict.ts";
import type { Report } from "./types.ts";

function repoRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "../../..");
}

function close(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9;
}

async function main(): Promise<void> {
  const frozenPath = join(repoRoot(), "datasets/metrics-rules-heldout.json");
  const frozen = JSON.parse(readFileSync(frozenPath, "utf8")) as Report;
  const docs = loadCorpus(defaultCorpusPath()).filter((d) => d.split === "heldout");
  const report = await evaluate(docs, "rules", "heldout", predictRules);
  const a = report.micro;
  const b = frozen.micro;
  if (!close(a.f1, b.f1) || a.tp !== b.tp || a.fp !== b.fp || a.fn !== b.fn) {
    console.error("rules held-out baseline drifted");
    console.error("frozen ", b);
    console.error("current", a);
    process.exitCode = 1;
    return;
  }
  console.log(`rules held-out F1 ${a.f1.toFixed(3)} matches ${frozenPath}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
