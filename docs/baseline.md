# Rules-only baseline (phase 3)

Scored on the frozen synthetic corpus (`datasets/corpus.jsonl`), **held-out** split, layer `rules`. Machine-readable copy: `datasets/metrics-rules-heldout.json`.

Command:

```
npm run eval -- --layer rules --split heldout
```

Gold annotates true PII, including `PERSON`. These numbers were not used to change the rule engine.

## Held-out (53 docs, 99 gold spans)

| Type | P | R | F1 | tp | fp | fn | support |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| micro | 0.974 | 0.768 | 0.859 | 76 | 2 | 23 | 99 |
| PERSON | 0.000 | 0.000 | 0.000 | 0 | 0 | 19 | 19 |
| PHONE | 1.000 | 1.000 | 1.000 | 11 | 0 | 0 | 11 |
| IBAN | 1.000 | 1.000 | 1.000 | 13 | 0 | 0 | 13 |
| CARD | 1.000 | 1.000 | 1.000 | 7 | 0 | 0 | 7 |
| RNOKPP | 1.000 | 1.000 | 1.000 | 5 | 0 | 0 | 5 |
| EDRPOU | 1.000 | 1.000 | 1.000 | 7 | 0 | 0 | 7 |
| PASSPORT | 0.929 | 1.000 | 0.963 | 13 | 1 | 0 | 13 |
| UNZR | 1.000 | 1.000 | 1.000 | 6 | 0 | 0 | 6 |
| EMAIL | 1.000 | 1.000 | 1.000 | 4 | 0 | 0 | 4 |
| ADDRESS | 0.750 | 0.750 | 0.750 | 3 | 1 | 1 | 4 |
| DOB | 1.000 | 0.700 | 0.824 | 7 | 0 | 3 | 10 |

`--layer hybrid` matches `rules` until NER merge. `--layer model` predicts nothing (micro F1 0).

## What the misses are

- **PERSON** (19 FN): names are gold and the rule engine has no name detector. This is the NER gap.
- **DOB** (3 FN): Russian *родился* is outside the current DOB keyword list (`народив…`, `born`, …).
- **ADDRESS** (1 FP + 1 FN on the same doc): `бульв. Лесі Українки, буд. 114` is gold; the street regex takes only the first capital token (`бульв. Лесі`).
- **PASSPORT** (1 FP): `hw-025` is a 9-digit parcel id plus the words «не паспорт», and the 48-character ID-card window still sees `паспорт`.

Checksum types (IBAN, CARD, RNOKPP, EDRPOU, UNZR, PHONE, EMAIL) are exact on this split.

## Protocol

Inspect `dev` (`--split dev --mismatches`) when changing rules. Leave held-out for later comparison with the hybrid detector.
