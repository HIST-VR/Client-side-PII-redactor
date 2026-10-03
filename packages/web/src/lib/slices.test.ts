import { entity, EntityType, Source } from "@ua-pii/core";
import { describe, expect, it } from "vitest";
import { slices, topEntity } from "./slices";

describe("slices", () => {
  it("returns the whole string when nothing is found", () => {
    const parts = slices("hello", []);
    expect(parts).toEqual([{ start: 0, end: 5, text: "hello", entities: [] }]);
  });

  it("splits around a span", () => {
    const text = "тел. 0501234567 кінець";
    const value = "0501234567";
    const start = text.indexOf(value);
    const phone = entity(EntityType.PHONE, start, start + value.length, value);
    const parts = slices(text, [phone]);
    expect(parts.map((p) => p.text)).toEqual(["тел. ", "0501234567", " кінець"]);
    expect(topEntity(parts[1]!)?.type).toBe(EntityType.PHONE);
  });

  it("keeps a nested identifier as the painted mark", () => {
    const iban = entity(EntityType.IBAN, 10, 39, "x".repeat(29));
    const addr = entity(EntityType.ADDRESS, 0, 50, "addr", undefined, Source.MODEL);
    const parts = slices("a".repeat(50), [iban, addr]);
    const inner = parts.find((p) => p.start === 10 && p.end === 39);
    expect(topEntity(inner!)?.type).toBe(EntityType.IBAN);
    expect(inner!.entities.map((e) => e.type)).toEqual([EntityType.IBAN, EntityType.ADDRESS]);
  });
});
