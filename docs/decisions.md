# Decisions

## Phase 6 — CI and deploy

CI (`/.github/workflows/ci.yml`) runs typecheck, unit tests, **rules-only** held-out eval, and a freeze check against `datasets/metrics-rules-heldout.json`. Model/hybrid eval is not in CI: it downloads ~110 MB and is not needed to catch checksum regressions.

The live demo is **Cloudflare Pages** at [ua-pii-redactor.pages.dev](https://ua-pii-redactor.pages.dev/). Cloudflare builds from `main` (`npm ci && npm run build`, output `packages/web/dist`). CI on GitHub only typechecks, tests, and freezes the rules baseline. Vite `base` is `./` and the worker resolves wasm as `../wasm/` relative to the worker URL. `public/_headers` sets CSP, COOP, and COEP on Cloudflare. Hub weights currently redirect to `*.hf.co` (for example `us.aws.cdn.hf.co`); `connect-src` allows `huggingface.co` and `hf.co` plus subdomains so the NER download is not blocked.

Street `ADDRESS` spans allow a second capitalized token so `Лесі Українки` is kept with the building number. A third token is not taken, because the next line is often the recipient.

Playwright e2e uses system Chrome locally and Playwright Chromium in CI.

## Phase 5 — demo UI and Web Worker

The demo is `packages/web` (Vite + React). Rules run on the UI thread so paste is instant. NER runs in a module Web Worker via `createNerEngine()`. Hybrid merge stays in the page: `detectHybrid(text, modelEntities)`.

The 110 MB Hub download is **opt-in**. A first visit must not pull the model without a click. Consent is stored in `localStorage`; later visits auto-load. If the worker fails, the UI stays on rules.

ORT wasm is served from this origin (`/wasm/…`) so CSP does not need jsDelivr. `connect-src` allows Hugging Face only for weights. User text is never posted. COOP `same-origin` + COEP `credentialless` give the worker a chance at `SharedArrayBuffer` without requiring CORP on the Hub.

Routing is hash-based (`#/`, `#/metrics`) so a static host does not need rewrite rules. i18n is two typed dictionaries (UK default). Theme is CSS variables with a system/light/dark toggle.

Masking and type filters are view-only: they do not re-run detection.

## Phase 4 — in-browser NER

Model: [`onnx-community/uk-ner-ONNX`](https://huggingface.co/onnx-community/uk-ner-ONNX) (XLM-RoBERTa-Uk on Ukr-Synth). Default dtype **int8** (~110 MB); `q4f16` is the smaller WebGPU fallback for phase 5.

Tags: `PER` → `PERSON`, `LOC` → `ADDRESS`, `ORG` dropped. Score threshold **0.5**, chosen before looking at held-out.

transformers.js token-classification does not emit character offsets, so we tokenize ourselves, argmax logits, align pieces onto the original string, fuse BIO, then snap subword spans to letter boundaries. Sequences longer than 512 tokens use a sliding window (stride 128) and keep the higher-scoring label on overlap.

Inference is local. The only network use is downloading weights from Hugging Face Hub. User text never leaves the process. `createNerEngine()` is DOM-free so phase 5 can run it in a Web Worker.

Hybrid is `merge(rules ∪ model)` with the existing container rule: `PERSON`/`ADDRESS` may wrap a structured identifier.

## Phase 3 — eval protocol

Gold is **true PII**, including `PERSON`. Rules-only `PERSON` recall is 0; the NER layer is what finds names.

Invalid checksums (IBAN, Luhn, РНОКПП, ЄДРПОУ, УНЗР) are negatives: they appear in the text with **no** gold span.

Held-out is a stable 20% split: `hash(id) % 5 === 0`. Adding documents does not reshuffle old ids. Do not tune rules against held-out; inspect `dev` for error examples.

`--layer rules|model|hybrid` is the ablation CLI. Held-out is for reporting; inspect `dev` when changing the detector.

The corpus is synthetic-only (`datasets/`). Never add live customer text.

## Phase 2 — one engine: TypeScript

The product processes pasted text in the browser, so the detector is TypeScript (`packages/core`). A second Python implementation of the same checksums and regexes would drift and is not on any runtime path. Eval and the dataset generator (phase 3) will call `@ua-pii/core` as well.

Checksum formulas were checked against NBU, ISO, Wikipedia, python-stdnum, and ICAO Doc 9303 (`docs/sources.md`). Those libraries are citations, not dependencies.

## УНЗР

Added as requested. Official form is `YYYYMMDD-XXXXC` (13 digits, hyphen after the date). Check digit is ICAO Doc 9303 weights `7-3-1`. Hyphenated matches and compact 13-digit runs that pass date + checksum are both accepted; serial `0000` is rejected.

## Passport ID-card and DOB need context

A 9-digit ID-card number with no checksum would match order IDs, amounts, and random digit runs. Dates without a cue would flag every `12.03.2024` payment. Both require a nearby keyword (window of 48 characters).

Booklet series (`АА123456`) and hyphenated УНЗР (`19900101-00011`) are distinctive enough to match without extra words; compact 13-digit УНЗР still needs a valid date + ICAO check.

## Merge

Structured identifiers (IBAN, CARD, UNZR, RNOKPP, EDRPOU, EMAIL, PHONE, PASSPORT, DOB) are mutually exclusive on overlap: higher priority wins, then longer span.

`ADDRESS` (and later `PERSON`) may **contain** a structured identifier. Nested pairs are kept; a partial overlap drops the container.

## РНОКПП extra date check

The statutory check is only the 10th digit. We also decode digits 1–5 as days since 1899-12-31 and reject impossible or implausible dates (before 1920 or after today). That is a false-positive control, documented as extra, not as a legal definition of a valid tax ID.
