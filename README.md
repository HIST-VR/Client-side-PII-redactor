# Client-side PII redactor for Ukrainian text

Detects and masks personal data in Ukrainian (and mixed UA/RU/EN) text **entirely in the browser**.

> Status: phase 3 — rule engine, synthetic gold, rules-only baseline. NER, demo, CI, and deploy come later.

The detector is TypeScript (`packages/core`, `@ua-pii/core`). Eval (`packages/eval`) scores it on a frozen synthetic corpus. Checksum citations: `docs/sources.md`. Baseline: `docs/baseline.md`.

```
npm test
npm run typecheck
npm run generate
npm run eval -- --layer rules --split heldout
```
