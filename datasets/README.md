# Synthetic evaluation corpus

**SYNTHETIC ONLY.** Every document is generated or handwritten with fake names and fake identifiers (test PANs, generated IBANs, Wikipedia/python-stdnum checksum vectors). Do not add real customer text, live account numbers, or real people’s names.

| File | What |
| --- | --- |
| `corpus.jsonl` | Frozen gold. One JSON object per line. Rebuild with `npm run generate`. |
| `metrics-rules-heldout.json` | Rules-only scores on the held-out split. |
| `metrics-model-heldout.json` | NER-only scores. |
| `metrics-hybrid-heldout.json` | Rules + NER after merge. |

The demo copies these three JSON files into `packages/web/src/data/` so the metrics page has no extra network.

## Gold

- Character spans are JavaScript UTF-16 indices (BMP Ukrainian text).
- Nested entities (for example an IBAN inside later `ADDRESS`/`PERSON` containers) are scored independently.
- Invalid checksums are negatives.
- `PERSON` is annotated as true PII. The rule layer misses names; the NER layer is what finds them.

## Splits

`hash(id) % 5 === 0` → `heldout` (~20%). The rest is `dev`. The hash is FNV-1a on the id string, so new documents do not reshuffle old ones.

Handwritten ids are `hw-001`…`hw-048`. Generated ids are `gen-{family}-{nnn}` with seed `20261003`.
