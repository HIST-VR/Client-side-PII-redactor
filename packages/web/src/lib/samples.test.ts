import { detect, EntityType } from "@ua-pii/core";
import { describe, expect, it } from "vitest";
import { filterEntities } from "./prefs";
import { sampleText } from "./samples";

describe("synthetic samples", () => {
  it("support chat hits phone email and card", () => {
    const types = new Set(detect(sampleText("support")).map((e) => e.type));
    expect(types.has(EntityType.PHONE)).toBe(true);
    expect(types.has(EntityType.EMAIL)).toBe(true);
    expect(types.has(EntityType.CARD)).toBe(true);
  });

  it("bank sample hits IBAN and EDRPOU", () => {
    const types = new Set(detect(sampleText("bank")).map((e) => e.type));
    expect(types.has(EntityType.IBAN)).toBe(true);
    expect(types.has(EntityType.EDRPOU)).toBe(true);
    expect(types.has(EntityType.PHONE)).toBe(true);
  });

  it("kyc sample hits passport UNZR RNOKPP DOB and address", () => {
    const types = new Set(detect(sampleText("kyc")).map((e) => e.type));
    expect(types.has(EntityType.PASSPORT)).toBe(true);
    expect(types.has(EntityType.UNZR)).toBe(true);
    expect(types.has(EntityType.RNOKPP)).toBe(true);
    expect(types.has(EntityType.DOB)).toBe(true);
    expect(types.has(EntityType.ADDRESS)).toBe(true);
  });

  it("negatives skip invalid card and uncontextual id", () => {
    const types = new Set(detect(sampleText("negatives")).map((e) => e.type));
    expect(types.has(EntityType.CARD)).toBe(false);
    expect(types.has(EntityType.IBAN)).toBe(false);
  });

  it("type filter drops disabled entities", () => {
    const found = detect(sampleText("support"));
    const onlyMail = filterEntities(found, new Set([EntityType.EMAIL]));
    expect(onlyMail.every((e) => e.type === EntityType.EMAIL)).toBe(true);
  });
});
