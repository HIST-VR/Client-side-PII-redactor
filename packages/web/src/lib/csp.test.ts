import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CSP } from "./csp";

describe("CSP", () => {
  it("allows the nested Hugging Face Xet CDN that serves ONNX weights", () => {
    expect(CSP).toContain("https://us.aws.cdn.hf.co");
    expect(CSP).toContain("https://*.aws.cdn.hf.co");
    expect(CSP).toContain("https://cas-bridge.xethub.hf.co");
  });

  it("keeps Cloudflare _headers in lockstep with the HTML meta policy", () => {
    const headers = readFileSync(path.resolve(import.meta.dirname, "../../public/_headers"), "utf8");
    expect(headers).toContain(`Content-Security-Policy: ${CSP}`);
  });
});
