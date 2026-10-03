# Client-side PII redactor for Ukrainian text

Detects and masks personal data in Ukrainian (and mixed UA/RU/EN) text **entirely in the browser**.

> Status: phase 5 — rule engine, in-browser NER, hybrid ablation, Vite+React demo with a NER Web Worker. CI and deploy come later.

The detector is TypeScript (`packages/core`). Rules cover checksum identifiers; `onnx-community/uk-ner-ONNX` (int8) supplies `PERSON` and location spans. Eval (`packages/eval`) scores `rules` / `model` / `hybrid` on a frozen synthetic corpus. The demo (`packages/web`) runs rules immediately and loads NER in a Web Worker after you opt in. Citations: `docs/sources.md`. Baseline: `docs/baseline.md`.

Held-out hybrid micro F1 **0.949** (rules 0.859; PERSON F1 0.944). The first model load downloads ~110 MB of weights from Hugging Face Hub. User text stays in-process.

```
npm test
npm run typecheck
npm run dev
npm run eval -- --layer hybrid --split heldout
```
