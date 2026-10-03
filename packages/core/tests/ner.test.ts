import { describe, expect, it } from "vitest";
import { EntityType, Source } from "../src/types.ts";
import { alignTokens } from "../src/ner/align.ts";
import { mapNerTag, parseBio } from "../src/ner/labels.ts";
import { tokensToEntities } from "../src/ner/postprocess.ts";
import { mergeWindowPreds, tokenWindows } from "../src/ner/windows.ts";
import { softmaxArgmax } from "../src/ner/engine.ts";

describe("parseBio mapNerTag", () => {
  it("splits BIO tags and maps PER/LOC", () => {
    expect(parseBio("B-PER")).toEqual({ prefix: "B", tag: "PER" });
    expect(parseBio("I-LOC")).toEqual({ prefix: "I", tag: "LOC" });
    expect(parseBio("O")).toEqual({ prefix: "O", tag: "O" });
    expect(mapNerTag("PER")).toBe(EntityType.PERSON);
    expect(mapNerTag("LOC")).toBe(EntityType.ADDRESS);
    expect(mapNerTag("ORG")).toBeNull();
  });
});

describe("alignTokens", () => {
  it("aligns SentencePiece pieces on Ukrainian text", () => {
    const text = "Мене звати Олена Коваленко.";
    const words = ["<s>", "▁Мене", "▁звати", "▁Олена", "▁Коваленко", ".", "</s>"];
    const aligned = alignTokens(text, words);
    expect(aligned[0]).toBeNull();
    expect(text.slice(aligned[1]!.start, aligned[1]!.end)).toBe("Мене");
    expect(text.slice(aligned[3]!.start, aligned[3]!.end)).toBe("Олена");
    expect(text.slice(aligned[4]!.start, aligned[4]!.end)).toBe("Коваленко");
    expect(text.slice(aligned[5]!.start, aligned[5]!.end)).toBe(".");
  });

  it("aligns decoded words with a leading space", () => {
    const text = "Hi Olena";
    const aligned = alignTokens(text, [" Hi", " Olena"]);
    expect(text.slice(aligned[0]!.start, aligned[0]!.end)).toBe("Hi");
    expect(text.slice(aligned[1]!.start, aligned[1]!.end)).toBe("Olena");
  });

  it("aligns XLM-R convert_ids_to_tokens pieces without a ▁ prefix", () => {
    const text = "Мене звати Олена Коваленко.";
    const words = ["Мен", "е", "з", "вати", "О", "лена", "Ковал", "енко", "."];
    const aligned = alignTokens(text, words);
    expect(aligned.every((a) => a !== null)).toBe(true);
    expect(text.slice(aligned[0]!.start, aligned[5]!.end)).toBe("Мене звати Олена");
    expect(text.slice(aligned[6]!.start, aligned[7]!.end)).toBe("Коваленко");
  });
});

describe("tokensToEntities", () => {
  it("fuses B-PER I-PER onto a character span with source model", () => {
    const text = "Клієнт Олена Коваленко чекає.";
    const ents = tokensToEntities(text, [
      { word: "▁Клієнт", entity: "O", score: 0.99 },
      { word: "▁Олена", entity: "B-PER", score: 0.97 },
      { word: "▁Коваленко", entity: "I-PER", score: 0.96 },
      { word: "▁чекає", entity: "O", score: 0.99 },
    ]);
    expect(ents).toHaveLength(1);
    expect(ents[0]!.type).toBe(EntityType.PERSON);
    expect(ents[0]!.source).toBe(Source.MODEL);
    expect(ents[0]!.value).toBe("Олена Коваленко");
  });

  it("drops ORG and low-score spans", () => {
    const text = "ПриватБанк і Іван";
    const ents = tokensToEntities(
      text,
      [
        { word: "▁ПриватБанк", entity: "B-ORG", score: 0.99 },
        { word: "▁і", entity: "O", score: 0.99 },
        { word: "▁Іван", entity: "B-PER", score: 0.2 },
      ],
      0.5,
    );
    expect(ents).toEqual([]);
  });

  it("maps LOC to ADDRESS", () => {
    const text = "місто Канів";
    const ents = tokensToEntities(text, [
      { word: "▁місто", entity: "O", score: 0.9 },
      { word: "▁Канів", entity: "B-LOC", score: 0.9 },
    ]);
    expect(ents[0]!.type).toBe(EntityType.ADDRESS);
    expect(ents[0]!.value).toBe("Канів");
  });

  it("snaps a subword PERSON back to the full word", () => {
    const text = "Мене звати Олена Коваленко.";
    const ents = tokensToEntities(text, [
      { word: "Мен", entity: "O", score: 0.99 },
      { word: "е", entity: "O", score: 0.99 },
      { word: "з", entity: "O", score: 0.99 },
      { word: "вати", entity: "O", score: 0.99 },
      { word: "О", entity: "O", score: 0.4 },
      { word: "лена", entity: "B-PER", score: 0.95 },
      { word: "Ковал", entity: "I-PER", score: 0.94 },
      { word: "енко", entity: "I-PER", score: 0.93 },
    ]);
    expect(ents).toHaveLength(1);
    expect(ents[0]!.value).toBe("Олена Коваленко");
  });

  it("merges abutting LOC pieces of the same word", () => {
    const text = "місто Канів";
    const ents = tokensToEntities(text, [
      { word: "місто", entity: "O", score: 0.9 },
      { word: "Кан", entity: "B-LOC", score: 0.9 },
      { word: "ів", entity: "B-LOC", score: 0.8 },
    ]);
    expect(ents).toHaveLength(1);
    expect(ents[0]!.value).toBe("Канів");
  });
});

describe("tokenWindows", () => {
  it("returns one window when the sequence fits", () => {
    expect(tokenWindows(10, 512, 128)).toEqual([{ start: 0, end: 10 }]);
  });

  it("slides with overlap", () => {
    const ws = tokenWindows(20, 12, 4); // maxContent = 10, step = 6
    expect(ws[0]).toEqual({ start: 0, end: 10 });
    expect(ws[ws.length - 1]!.end).toBe(20);
    expect(ws.length).toBeGreaterThan(1);
  });

  it("keeps the higher score on overlap", () => {
    const merged = mergeWindowPreds(3, [
      { start: 0, preds: [{ label: "B-PER", score: 0.4 }, { label: "O", score: 0.3 }, { label: "O", score: 0.9 }] },
      { start: 1, preds: [{ label: "B-PER", score: 0.8 }, { label: "I-PER", score: 0.7 }] },
    ]);
    expect(merged[1]!.label).toBe("B-PER");
    expect(merged[1]!.score).toBe(0.8);
  });
});

describe("softmaxArgmax", () => {
  it("picks the peak and scores in (0, 1]", () => {
    const { index, score } = softmaxArgmax([1, 5, 1]);
    expect(index).toBe(1);
    expect(score).toBeGreaterThan(0.9);
    expect(score).toBeLessThanOrEqual(1);
  });
});
