# Client-side PII redactor for Ukrainian text

Detects and masks personal data in Ukrainian (and mixed UA/RU/EN) text **entirely in the browser**.

> Status: phase 2 — rule engine and validators. Demo, NER, CI, and the full README come in later phases.

Python (`python/ua_pii`) is the reference implementation of checksums, detectors, merge, and masking. `@ua-pii/core` is the TypeScript port that will run in the web app. Both are tested against `fixtures/validators.json`.

```
npm test          # Python pytest + Vitest
npm run test:py
npm run test:ts
```

See `docs/sources.md` for checksum citations and `docs/decisions.md` for why the split exists.
