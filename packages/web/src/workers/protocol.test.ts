import { describe, expect, it } from "vitest";
import { parseDownloadPercent } from "./protocol";

describe("parseDownloadPercent", () => {
  it("reads a trailing percent", () => {
    expect(parseDownloadPercent("download onnx/model_int8.onnx 42%")).toBe(42);
    expect(parseDownloadPercent("cached tokenizer.json")).toBeNull();
    expect(parseDownloadPercent("download x 100%")).toBe(100);
  });
});
