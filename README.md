# Client-side PII redactor

[![CI](https://github.com/HIST-VR/Client-side-PII-redactor/actions/workflows/ci.yml/badge.svg)](https://github.com/HIST-VR/Client-side-PII-redactor/actions/workflows/ci.yml)

Paste Ukrainian (or mixed UA/RU/EN) text. The page finds personal data and masks it **in the browser**. There is no backend. Nothing you paste is uploaded.

**Demo:** [hist-vr.github.io/Client-side-PII-redactor](https://hist-vr.github.io/Client-side-PII-redactor/)

> **Українською.** Браузерний редактор персональних даних: IBAN, картки, РНОКПП, ЄДРПОУ, УНЗР, телефони, паспорти, пошта, імена та адреси. Правила спрацьовують одразу. Українська NER-модель [`onnx-community/uk-ner-ONNX`](https://huggingface.co/onnx-community/uk-ner-ONNX) (~110 МБ з Hugging Face) підвантажується за бажанням і працює у Web Worker. Текст не покидає вкладку. Це не сертифікований засіб відповідності.

## What it finds

- Ukrainian IBAN, payment cards, РНОКПП / ІПН, ЄДРПОУ, УНЗР
- Phone numbers and email
- Passports and dates of birth (when nearby words look like ID context)
- Street addresses, including two-word names such as *Лесі Українки*
- Person names, after you enable the model

Names and some place names come from [`onnx-community/uk-ner-ONNX`](https://huggingface.co/onnx-community/uk-ner-ONNX), an XLM-RoBERTa model trained for Ukrainian NER (`PER` / `LOC`). Click **Enable names** once: it downloads about 110 MB from Hugging Face Hub, caches on this device, and runs in a Web Worker. Your text stays in the tab. Only the model files are fetched.

IDs with a checksum (IBAN, cards, tax IDs, УНЗР) are handled by TypeScript rules, not the model.

## Run locally

```
npm ci
npm run dev
```

`npm test` and `npm run typecheck` cover the detector and the UI.

## Accuracy

Held-out synthetic set: 53 documents, 99 gold spans. The NER score threshold was set before this split.

| Layer | P | R | F1 | tp | fp | fn |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| rules | 0.987 | 0.778 | 0.870 | 77 | 1 | 22 |
| model | 0.850 | 0.172 | 0.286 | 17 | 3 | 82 |
| **hybrid** | **0.969** | **0.949** | **0.959** | 94 | 3 | 5 |

Hybrid PERSON F1 is 0.944 (17 of 19 names). IBAN, cards, tax IDs, УНЗР, phones, email, and street addresses match on this split. What still slips: two KYC-form names, three Russian *родился* dates, a hit on `не паспорт`, and city words the model tags as locations (`Києві`, `України`).

Full tables: [`docs/baseline.md`](docs/baseline.md). Misses: [`docs/error-analysis.md`](docs/error-analysis.md). In the demo: `#/metrics`.

## Limitations

This is not a legal or regulatory compliance tool.
