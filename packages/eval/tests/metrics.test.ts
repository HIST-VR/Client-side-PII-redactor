import { EntityType, Source, type Entity } from "@ua-pii/core";
import { describe, expect, it } from "vitest";
import { countDoc, scoreOf } from "../src/metrics.ts";
import { evaluate } from "../src/evaluate.ts";
import type { GoldDoc } from "../src/types.ts";

function ent(type: Entity["type"], start: number, end: number): Entity {
  return { type, start, end, value: "x", source: Source.RULE };
}

describe("countDoc", () => {
  it("counts a strict span+type match as tp", () => {
    expect(countDoc([{ type: EntityType.PHONE, start: 0, end: 3 }], [ent(EntityType.PHONE, 0, 3)])).toEqual({
      tp: 1,
      fp: 0,
      fn: 0,
    });
  });

  it("treats type mismatch as fp and fn", () => {
    expect(countDoc([{ type: EntityType.PHONE, start: 0, end: 3 }], [ent(EntityType.IBAN, 0, 3)])).toEqual({
      tp: 0,
      fp: 1,
      fn: 1,
    });
  });

  it("treats a shifted span as fp and fn", () => {
    expect(countDoc([{ type: EntityType.PHONE, start: 0, end: 3 }], [ent(EntityType.PHONE, 1, 4)])).toEqual({
      tp: 0,
      fp: 1,
      fn: 1,
    });
  });
});

describe("scoreOf", () => {
  it("is zero when there are no predictions and no gold", () => {
    expect(scoreOf({ tp: 0, fp: 0, fn: 0 }, 0)).toMatchObject({ precision: 0, recall: 0, f1: 0 });
  });

  it("computes precision recall f1", () => {
    const s = scoreOf({ tp: 2, fp: 1, fn: 1 }, 3);
    expect(s.precision).toBeCloseTo(2 / 3);
    expect(s.recall).toBeCloseTo(2 / 3);
    expect(s.f1).toBeCloseTo(2 / 3);
  });
});

describe("evaluate model layer", () => {
  it("predicts nothing", async () => {
    const docs: GoldDoc[] = [
      {
        id: "t-1",
        split: "dev",
        source: "handwritten",
        text: "тел. 0501234567",
        entities: [{ type: EntityType.PHONE, start: 5, end: 15 }],
      },
    ];
    const report = await evaluate(docs, "model", "dev", async () => []);
    expect(report.micro).toMatchObject({ tp: 0, fp: 0, fn: 1, recall: 0, precision: 0 });
  });
});
