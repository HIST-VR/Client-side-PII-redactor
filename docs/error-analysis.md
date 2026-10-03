# Error analysis

Frozen **held-out** split (`datasets/corpus.jsonl`, 53 docs, 99 gold spans). Gold is true PII, including `PERSON`. The NER threshold was set before this split. Two-word street names were added after this write-up; inspect `dev` (`npm run eval -- --layer hybrid --split dev --mismatches`) for further rule changes.

Hybrid micro F1 **0.959** (94 tp / 3 fp / 5 fn). Checksum types (IBAN, CARD, RNOKPP, EDRPOU, UNZR, PHONE, EMAIL) are exact on this split. Street ADDRESS is exact on the rules layer.

## Remaining hybrid errors

### PERSON — 2 FN, 0 FP (F1 0.944)

The tagger finds most Ukrainian names, including `Олена Коваленко` in `hw-001`. It skipped two KYC-form names that sit after an ID number:

| id | gold | context |
| --- | --- | --- |
| `gen-kyc-011` | `Юлія Олійник` | `ПІБ Юлія Олійник` after `документ № 933733370` |
| `gen-kyc-021` | `Іван Мельник` | `ПІБ Іван Мельник` after `документ № 077863242` |

`ukr-models/uk-ner` is trained on Ukr-Synth news-like sentences, not bank forms. A gazetteer of Ukrainian surnames or a small form-domain fine-tune would recover these. Do not add a “two Capitalized Words” regex: it would light up `Шановний Клієнт` and every street.

Rules-only PERSON recall is 0 by design. The 17/19 hybrid hits are entirely from the model.

### DOB — 3 FN, 0 FP (F1 0.824)

All three are the same Russian cue, which is not in the keyword list (`народив`, `born`, `дата народження`, …):

```
Російською: родился 13.09.1988, паспорт СМ980227.   # gen-mixed-013
Російською: родился 14.10.1982, паспорт ТН066156.   # gen-mixed-023
Російською: родился 23.05.1992, паспорт АА469199.   # gen-mixed-028
```

Adding `родился` / `родилась` to `DOB_CONTEXT` would fix them. Dates without a cue stay unflagged on purpose (`оплата 12.03.2024`).

### ADDRESS — 2 FP, 0 FN (F1 0.800)

Street names now take one extra capitalized word, so `бульв. Лесі Українки, буд. 114` (`gen-address-011`) matches in full. The remaining FPs are model `LOC` → `ADDRESS`: cities and country words (`Києві`, `України` in «громадянина України»). That is useful for a redactor and wrong against street-pattern gold. Dropping `LOC` would hide place names the regex never sees.

Rules-only ADDRESS F1 is **1.000** on this split; hybrid is lower because of those city spans.

### PASSPORT — 1 FP, 0 FN (F1 0.963)

```
номер 987654321 в системі обліку посилок (не паспорт).   # hw-025, gold: none
```

The 9-digit ID-card rule requires a nearby keyword. `паспорт` occurs inside **`не паспорт`**, so the negation is treated as a cue. A real fix is a small window that rejects `не` / `не є` / `not a` immediately before the keyword. Do not drop the context check: bare `\d{9}` is how we keep order IDs out.

## Rules-only (for contrast)

22 FN + 1 FP. The 19 PERSON misses are expected. The other three FN are the `родился` DOBs; the FP is `hw-025`. Hybrid recovers every PERSON the model knows.

## Still open

1. Add `родился`/`родилась` to DOB cues after checking `dev`, then re-report held-out.
2. Negation-aware keyword matching for passport / DOB.
3. A KYC-form NER fine-tune or a conservative `ПІБ`/`мене звати` name pattern with a surname list — measured on `dev` first.
4. Keep `LOC` → `ADDRESS` in the product; split “street” vs “place” in gold if we ever want a cleaner ADDRESS F1.
