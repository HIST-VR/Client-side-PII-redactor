import { describe, expect, it } from "vitest";
import { hashFor, resolveTheme, routeFromHash } from "./prefs";

describe("prefs", () => {
  it("maps hashes to routes", () => {
    expect(routeFromHash("")).toBe("redactor");
    expect(routeFromHash("#/")).toBe("redactor");
    expect(routeFromHash("#/metrics")).toBe("metrics");
    expect(hashFor("metrics")).toBe("#/metrics");
  });

  it("resolves system theme", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });
});
