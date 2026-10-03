import { describe, expect, it } from "vitest";
import { generateEdrpou, edrpouChecksumValid } from "../src/validators/edrpou.ts";
import { generateIban, isValidIban, mod97 } from "../src/validators/iban.ts";
import { generateLuhn, luhnValid } from "../src/validators/luhn.ts";
import {
  generateRnokpp,
  isValidRnokpp,
  rnokppBirthDate,
  rnokppCheckDigit,
  rnokppChecksumValid,
} from "../src/validators/rnokpp.ts";
import {
  generateUnzr,
  isValidUnzr,
  unzrBirthDate,
  unzrCheckDigit,
  unzrChecksumValid,
} from "../src/validators/unzr.ts";
import { fixtures } from "./fixtures.ts";

const TODAY = new Date(Date.UTC(2026, 9, 3));

describe("rnokpp", () => {
  it("accepts stdnum and wikipedia vectors", () => {
    for (const n of fixtures.rnokpp.valid) {
      expect(rnokppChecksumValid(n)).toBe(true);
      expect(isValidRnokpp(n, TODAY)).toBe(true);
    }
  });

  it("rejects bad checksums and lengths", () => {
    for (const n of fixtures.rnokpp.invalid_checksum) expect(rnokppChecksumValid(n)).toBe(false);
    for (const n of fixtures.rnokpp.invalid_length) expect(rnokppChecksumValid(n)).toBe(false);
    for (const n of fixtures.rnokpp.invalid_format) expect(rnokppChecksumValid(n)).toBe(false);
  });

  it("strips spaces", () => {
    expect(rnokppChecksumValid("1759 0137 76")).toBe(true);
  });

  it("round-trips generate", () => {
    const n = generateRnokpp(new Date(Date.UTC(1991, 7, 24)), 1235);
    expect(n).toHaveLength(10);
    expect(isValidRnokpp(n, TODAY)).toBe(true);
    const dob = rnokppBirthDate(n)!;
    expect(dob.getUTCFullYear()).toBe(1991);
    expect(dob.getUTCMonth()).toBe(7);
    expect(dob.getUTCDate()).toBe(24);
    expect(n[9]).toBe(rnokppCheckDigit(n.slice(0, 9)));
  });

  it("wikipedia birth date 1987-03-12", () => {
    const dob = rnokppBirthDate("3184710691")!;
    expect(dob.getUTCFullYear()).toBe(1987);
    expect(dob.getUTCMonth()).toBe(2);
    expect(dob.getUTCDate()).toBe(12);
  });
});

describe("edrpou", () => {
  it("stdnum vector", () => {
    expect(edrpouChecksumValid(fixtures.edrpou.valid[0]!)).toBe(true);
  });
  it("invalid checksum", () => {
    for (const n of fixtures.edrpou.invalid_checksum) expect(edrpouChecksumValid(n)).toBe(false);
  });
  it("generate 30M-range weights", () => {
    const n = generateEdrpou("3285596");
    expect(edrpouChecksumValid(n)).toBe(true);
  });
});

describe("unzr", () => {
  it("official worked example", () => {
    const n = fixtures.unzr.valid[0]!;
    expect(n).toBe("19550212-01110");
    expect(unzrChecksumValid(n)).toBe(true);
    expect(isValidUnzr(n, TODAY)).toBe(true);
    expect(unzrCheckDigit("195502120111")).toBe("0");
    const dob = unzrBirthDate(n)!;
    expect(dob.getUTCDate()).toBe(12);
    expect(dob.getUTCMonth()).toBe(1);
    expect(dob.getUTCFullYear()).toBe(1955);
  });
  it("rejects bad checksum and impossible date", () => {
    for (const n of fixtures.unzr.invalid_checksum) expect(isValidUnzr(n)).toBe(false);
    for (const n of fixtures.unzr.invalid_date) expect(isValidUnzr(n)).toBe(false);
  });
  it("round-trips generate", () => {
    const n = generateUnzr(new Date(Date.UTC(1991, 7, 24)), 1);
    expect(n.startsWith("19910824-")).toBe(true);
    expect(isValidUnzr(n, TODAY)).toBe(true);
  });
});

describe("iban", () => {
  it("generated iban is valid with spaces", () => {
    const iban = generateIban("305299", "26002661176318");
    expect(iban.startsWith("UA")).toBe(true);
    expect(isValidIban(iban)).toBe(true);
    const grouped = iban.match(/.{1,4}/g)!.join(" ");
    expect(isValidIban(grouped)).toBe(true);
    expect(isValidIban(iban.toLowerCase())).toBe(true);
  });
  it("rejects bad checksum and length", () => {
    const iban = generateIban("305299", "1");
    const mutated = iban.slice(0, 2) + (iban.slice(2, 4) === "00" ? "01" : "00") + iban.slice(4);
    expect(isValidIban(mutated)).toBe(false);
    expect(isValidIban("UA00")).toBe(false);
  });
  it("mod97 matches BigInt", () => {
    const numeric = "1312312321321321";
    expect(mod97(numeric)).toBe(Number(BigInt(numeric) % 97n));
  });
});

describe("luhn", () => {
  it("stripe test pans", () => {
    for (const pan of fixtures.luhn.valid) expect(luhnValid(pan)).toBe(true);
    for (const pan of fixtures.luhn.invalid_checksum) expect(luhnValid(pan)).toBe(false);
  });
  it("grouped and generate", () => {
    expect(luhnValid("4242 4242 4242 4242")).toBe(true);
    expect(luhnValid(generateLuhn("424242424242424"))).toBe(true);
  });
  it("fullwidth digits", () => {
    const full = [..."4242424242424242"].map((ch) => String.fromCharCode(0xff10 + Number(ch))).join("");
    expect(luhnValid(full)).toBe(true);
  });
});
