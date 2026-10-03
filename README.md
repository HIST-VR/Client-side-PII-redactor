# Client-side PII redactor for Ukrainian text

Detects and masks personal data in Ukrainian (and mixed UA/RU/EN) text **entirely in the browser**.

> Status: phase 2 — rule engine and validators. Demo, NER, CI, and the full README come in later phases.

The detector is TypeScript (`packages/core`, `@ua-pii/core`). That is the code the demo, Web Worker, and eval will call. Checksum citations: `docs/sources.md`.

```
npm test
npm run typecheck
```
