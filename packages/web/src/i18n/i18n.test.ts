import { EntityType } from "@ua-pii/core";
import { describe, expect, it } from "vitest";
import { t, typeLabel } from "./index";
import { en } from "./en";
import { uk } from "./uk";

describe("i18n", () => {
  it("en covers every uk key", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(uk).sort());
  });

  it("interpolates counts", () => {
    expect(t("uk", "count", { n: 3 })).toContain("3");
    expect(t("en", "count", { n: 3 })).toContain("3");
  });

  it("labels every entity type", () => {
    for (const type of Object.values(EntityType)) {
      expect(typeLabel("uk", type).length).toBeGreaterThan(0);
      expect(typeLabel("en", type).length).toBeGreaterThan(0);
    }
  });
});
