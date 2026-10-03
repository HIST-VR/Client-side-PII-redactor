import { describe, expect, it } from "vitest";
import { detectHybrid } from "../src/hybrid.ts";
import { merge } from "../src/merge.ts";
import { entity, EntityType, Source } from "../src/types.ts";

describe("detectHybrid", () => {
  it("keeps a model PERSON next to a rule phone", () => {
    const text = "Олена Коваленко, тел. +380671112233";
    const person = entity(EntityType.PERSON, 0, 15, "Олена Коваленко", undefined, Source.MODEL);
    const found = detectHybrid(text, [person]);
    const types = new Set(found.map((e) => e.type));
    expect(types.has(EntityType.PERSON)).toBe(true);
    expect(types.has(EntityType.PHONE)).toBe(true);
    expect(found.find((e) => e.type === EntityType.PERSON)?.source).toBe(Source.MODEL);
  });
});

describe("merge model containers", () => {
  it("keeps a structured identifier nested in PERSON", () => {
    const phone = entity(EntityType.PHONE, 10, 22, "0501234567");
    const person = entity(EntityType.PERSON, 0, 40, "x".repeat(40), undefined, Source.MODEL);
    const types = new Set(merge([phone, person]).map((e) => e.type));
    expect(types).toEqual(new Set([EntityType.PHONE, EntityType.PERSON]));
  });
});
