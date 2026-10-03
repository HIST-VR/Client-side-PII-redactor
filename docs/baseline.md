# Held-out baseline

Frozen synthetic corpus (`datasets/corpus.jsonl`), **held-out** split (53 docs, 99 gold spans). Gold annotates true PII, including `PERSON`. The NER threshold was set before this split. Two-word street names were added later (rules ADDRESS F1 1.000).

```
npm run eval -- --layer rules --split heldout
npm run eval -- --layer model --split heldout
npm run eval -- --layer hybrid --split heldout
```

JSON copies: `datasets/metrics-{rules,model,hybrid}-heldout.json`.

## Micro F1

| Layer | P | R | F1 | tp | fp | fn |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| rules | 0.987 | 0.778 | 0.870 | 77 | 1 | 22 |
| model | 0.850 | 0.172 | 0.286 | 17 | 3 | 82 |
| hybrid | 0.969 | 0.949 | 0.959 | 94 | 3 | 5 |

## Per type (hybrid)

| Type | P | R | F1 | tp | fp | fn | support |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| PERSON | 1.000 | 0.895 | 0.944 | 17 | 0 | 2 | 19 |
| PHONE | 1.000 | 1.000 | 1.000 | 11 | 0 | 0 | 11 |
| IBAN | 1.000 | 1.000 | 1.000 | 13 | 0 | 0 | 13 |
| CARD | 1.000 | 1.000 | 1.000 | 7 | 0 | 0 | 7 |
| RNOKPP | 1.000 | 1.000 | 1.000 | 5 | 0 | 0 | 5 |
| EDRPOU | 1.000 | 1.000 | 1.000 | 7 | 0 | 0 | 7 |
| PASSPORT | 0.929 | 1.000 | 0.963 | 13 | 1 | 0 | 13 |
| UNZR | 1.000 | 1.000 | 1.000 | 6 | 0 | 0 | 6 |
| EMAIL | 1.000 | 1.000 | 1.000 | 4 | 0 | 0 | 4 |
| ADDRESS | 0.667 | 1.000 | 0.800 | 4 | 2 | 0 | 4 |
| DOB | 1.000 | 0.700 | 0.824 | 7 | 0 | 3 | 10 |

Model-only PERSON F1 is **0.944** (17/19 names, 0 FP). Structured identifiers stay with the rules. Hybrid micro F1 **0.959** vs rules **0.870**.

## Remaining hybrid misses

- **PERSON** (2 FN): two KYC-form names the tagger skipped.
- **DOB** (3 FN): Russian *родился* is outside the DOB keyword list.
- **ADDRESS** (2 FP): model `LOC` adds cities (`Києві`) and `України` from «громадянина України». Two-word streets (`Лесі Українки`) match on the rules layer.
- **PASSPORT** (1 FP): `hw-025` parcel id plus «не паспорт».

Checksum types (IBAN, CARD, RNOKPP, EDRPOU, UNZR, PHONE, EMAIL) are exact on this split.

## Protocol

Inspect `dev` (`--split dev --mismatches`) when changing rules or the NER threshold. Leave held-out for comparison across phases.
