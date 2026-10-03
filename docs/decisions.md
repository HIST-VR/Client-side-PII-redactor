# Decisions (phase 2)

## Python reference + TypeScript port

The detector that runs on pasted text **must** be TypeScript: there is no backend, and Pyodide would add a huge WASM runtime, wreck CSP, and freeze on first load.

Python is still the place algorithms are authored and unit-tested (`python/ua_pii`). Evaluation in phase 3 will call this package. `packages/core` is a browser port checked against the same JSON fixtures.

If a checksum ever disagrees between the two, the Python test vector is the source of truth and the TS port is wrong.

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
