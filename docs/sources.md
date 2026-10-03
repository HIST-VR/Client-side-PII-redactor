# Algorithm sources

Checksums and identifier formats are taken from the documents below, not from memory. Each validator docstring repeats the formula we implemented.

## IBAN (UA)

- Structure: `UA` + 2 check digits + 6-digit NBU ID + 19-character account = **29 characters**.
- Check: ISO 7064 MOD-97-10 as used by ISO 13616 (rearrange first 4 chars to the end, A=10…Z=35, remainder must be 1).
- Sources:
  - National Bank of Ukraine, [Generation and Validation of Ukrainian IBANs](https://bank.gov.ua/en/iban)
  - NBU Board Resolution No. 158 of 26 July 2022 (IBAN scheme `UA KK YYYYYY AAAAAAAAAAAAAAAAAAA`, check via MOD 97-10)

## Payment cards (Luhn)

- ISO/IEC 7812 PAN check digit (Luhn).
- We accept 13–19 digits that pass Luhn. Continuous 16-digit runs and grouped 13–19 digit runs are detected; shorter ungrouped runs are skipped to limit false positives.

## РНОКПП / ІПН

- 10 digits. Digits 1–5: days since 1899-12-31 (birth date). Digits 6–9: sequence (9th digit odd = male, even = female). Digit 10: check.
- Check: weights `[-1, 5, 7, 9, 4, 6, 10, 5, 7]` on the first 9 digits; `K = (sum % 11) % 10`.
- Sources:
  - [Ukrainian Wikipedia: РНОКПП](https://uk.wikipedia.org/wiki/РНОКПП) (weights and `(sum % 11) % 10`)
  - [OECD Ukraine TIN information sheet](https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Ukraine-TIN.pdf) (structure `XXXXXNNNNK`)
  - Independent implementation: [python-stdnum `stdnum.ua.rntrc`](https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/ua/rntrc.py)
- Extra (ours, for false-positive control): the encoded date must be a real calendar day in 1920…today. Checksum-only validity is still exposed as `checksum_valid()`.

## ЄДРПОУ

- 8 digits, last is the check digit.
- Weights `[1,2,3,4,5,6,7]`, or `[7,1,2,3,4,5,6]` when the first digit is 3, 4, or 5 (codes 30 000 000–59 999 999).
- `r = sum % 11`; if `r < 10` that is the check digit; otherwise retry with every weight `+2` and take `(sum % 11) % 10`.
- Sources:
  - [python-stdnum `stdnum.ua.edrpou`](https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/ua/edrpou.py)
  - Algorithm description commonly cited from 1C: [Перевірка коду за ЄДРПОУ](https://1cinfo.com.ua/Articles/Proverka_koda_po_EDRPOU.aspx)

## УНЗР

- Display format `YYYYMMDD-XXXXC` (8 digits, hyphen, 5 digits). 13 digits total.
- Digits 1–8: date of birth. Digits 9–12: sequence 0001–9999 (odd ≈ male, even ≈ female per DMS). Digit 13: check.
- Check: ICAO Doc 9303 MRZ method — weights `7,3,1` repeating, sum mod 10.
- Sources:
  - State Migration Service descriptions of format (8+5 digits, hyphen, date prefix, ICAO check)
  - NAZK declaration guidance: format `XXXXXXXX-XXXXX`, first eight digits = date of birth
  - Worked example in the annex on calculating the 13th digit (ICAO 731 weights): `19550212-01110` (sum 100, remainder 0)

## Passport

- ID-card (since 2016): **9 digits, no series**. Source: [State Migration Service](https://dmsu.gov.ua/news/region/175.html) / [MVS](https://mvs.gov.ua/en/news/nomer-ta-seriia-pasportu-de-sukati).
- Booklet (1994): **two Cyrillic letters + six digits**, perforated on the cover.

## Phone

- Ukraine E.164: country code `380` + 9-digit national number. National format: `0` + 9 digits.
- We do not call any numbering-plan API; length and prefix (`+380` / `0`) are the rule.

## NER model

- [`ukr-models/uk-ner`](https://huggingface.co/ukr-models/uk-ner): XLM-RoBERTa-Uk fine-tuned on [`ukr-models/Ukr-Synth`](https://huggingface.co/datasets/ukr-models/Ukr-Synth) with `B/I-PER`, `B/I-LOC`, `B/I-ORG`.
- Browser/Node weights: [`onnx-community/uk-ner-ONNX`](https://huggingface.co/onnx-community/uk-ner-ONNX) (`model_int8.onnx` ≈ 110 MB).
- Runtime: [Transformers.js](https://huggingface.co/docs/transformers.js) `AutoModelForTokenClassification` + ONNX Runtime.

## Dates of birth

- No checksum. Detected only with a nearby cue (`народився`, `дата народження`, `DOB`, …) so random dates in statements are not flagged.
