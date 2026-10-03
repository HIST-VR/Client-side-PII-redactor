import { EntityType } from "@ua-pii/core";
import { describe, expect, it } from "vitest";
import { assertGold, assignSplit, fill } from "../src/fill.ts";
import { slot } from "../src/synthetic.ts";

describe("fill", () => {
  it("records character spans for each slot", () => {
    const { text, entities } = fill("A {phone} B {email}.", {
      phone: slot(EntityType.PHONE, "0501234567"),
      email: slot(EntityType.EMAIL, "a@example.com"),
    });
    expect(text).toBe("A 0501234567 B a@example.com.");
    expect(text.slice(entities[0]!.start, entities[0]!.end)).toBe("0501234567");
    expect(text.slice(entities[1]!.start, entities[1]!.end)).toBe("a@example.com");
    expect(entities[0]!.type).toBe(EntityType.PHONE);
  });

  it("throws on an unknown slot", () => {
    expect(() => fill("hello {missing}", {})).toThrow(/unknown slot/);
  });

  it("rejects empty and duplicate gold spans", () => {
    expect(() => assertGold("ab", [{ type: EntityType.PHONE, start: 1, end: 1 }])).toThrow(/bad span/);
    expect(() =>
      assertGold("abcd", [
        { type: EntityType.PHONE, start: 0, end: 2 },
        { type: EntityType.PHONE, start: 0, end: 2 },
      ]),
    ).toThrow(/duplicate gold/);
  });
});

describe("assignSplit", () => {
  it("is stable for a given id", () => {
    expect(assignSplit("hw-001")).toBe(assignSplit("hw-001"));
  });

  it("holds out about 20% of ids", () => {
    let held = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      if (assignSplit(`gen-kyc-${String(i).padStart(3, "0")}`) === "heldout") held += 1;
    }
    const rate = held / n;
    expect(rate).toBeGreaterThan(0.12);
    expect(rate).toBeLessThan(0.28);
  });
});
