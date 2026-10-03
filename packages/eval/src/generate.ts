import { writeCorpus } from "./corpus.ts";

const { path, docs } = writeCorpus();
const heldout = docs.filter((d) => d.split === "heldout").length;
console.log(`wrote ${docs.length} docs (${heldout} held-out) to ${path}`);
