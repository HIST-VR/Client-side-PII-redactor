import {
  EntityType,
  isValidEdrpou,
  isValidIban,
  isValidRnokpp,
  isValidUnzr,
  luhnValid,
} from "@ua-pii/core";
import { describe, expect, it } from "vitest";
import { buildCorpus } from "../src/corpus.ts";
import { assertGold } from "../src/fill.ts";
import { handwrittenDocs } from "../src/handwritten.ts";
import { generatedDocs } from "../src/generated.ts";

describe("synthetic gold", () => {
  const docs = buildCorpus();

  it("has handwritten cases and at least 200 generated docs", () => {
    expect(handwrittenDocs()).toHaveLength(48);
    expect(generatedDocs().length).toBeGreaterThanOrEqual(200);
    expect(docs.length).toBeGreaterThanOrEqual(248);
  });

  it("has unique ids, valid spans, and a non-empty held-out split", () => {
    const ids = new Set<string>();
    let heldout = 0;
    for (const d of docs) {
      expect(ids.has(d.id)).toBe(false);
      ids.add(d.id);
      assertGold(d.text, d.entities);
      if (d.split === "heldout") heldout += 1;
      for (const e of d.entities) {
        expect(d.text.slice(e.start, e.end).length).toBeGreaterThan(0);
      }
    }
    expect(heldout / docs.length).toBeGreaterThan(0.1);
    expect(heldout / docs.length).toBeLessThan(0.3);
  });

  it("only gold-annotates checksum types when the value is valid", () => {
    for (const d of docs) {
      for (const e of d.entities) {
        const value = d.text.slice(e.start, e.end);
        if (e.type === EntityType.IBAN) expect(isValidIban(value), `${d.id} ${value}`).toBe(true);
        if (e.type === EntityType.CARD) expect(luhnValid(value), `${d.id} ${value}`).toBe(true);
        if (e.type === EntityType.RNOKPP) expect(isValidRnokpp(value), `${d.id} ${value}`).toBe(true);
        if (e.type === EntityType.EDRPOU) expect(isValidEdrpou(value), `${d.id} ${value}`).toBe(true);
        if (e.type === EntityType.UNZR) expect(isValidUnzr(value), `${d.id} ${value}`).toBe(true);
      }
    }
  });

  it("keeps invalid checksum examples as negatives", () => {
    const hw034 = handwrittenDocs().find((d) => d.id === "hw-034")!;
    expect(hw034.text).toContain("19550212-01111");
    expect(hw034.entities).toEqual([]);
  });
});
