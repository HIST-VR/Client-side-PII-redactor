# Decisions

## Phase 3 — eval protocol

Gold is **true PII**, including `PERSON`, not “what the rules can find”. Rules-only `PERSON` recall is expected to be 0 until the in-browser NER lands.

Invalid checksums (IBAN, Luhn, РНОКПП, ЄДРПОУ, УНЗР) are negatives: they appear in the text with **no** gold span.

Held-out is a stable 20% split: `hash(id) % 5 === 0`. Adding documents does not reshuffle old ids. Do not tune rules against held-out; inspect `dev` for error examples.

`--layer model|hybrid` is an ablation hook. Until phase 4, `model` predicts nothing and `hybrid` equals `rules`.

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
