import { describe, expect, it } from "vitest";
import { detect } from "../src/detect.ts";
import { mask, MaskMode } from "../src/mask.ts";
import { merge } from "../src/merge.ts";
import { findAddresses } from "../src/rules/address.ts";
import { findCards } from "../src/rules/card.ts";
import { findDobs } from "../src/rules/dob.ts";
import { findEmails } from "../src/rules/email.ts";
import { findPassports } from "../src/rules/passport.ts";
import { findPhones } from "../src/rules/phone.ts";
import { entity, EntityType, type Entity } from "../src/types.ts";
import { generateIban } from "../src/validators/iban.ts";
import { generateRnokpp } from "../src/validators/rnokpp.ts";
import { generateUnzr } from "../src/validators/unzr.ts";

describe("phones", () => {
  it("international national and grouped", () => {
    expect(findPhones("Передзвоніть +380501234567").map((e) => e.value)).toEqual(["+380501234567"]);
    expect(findPhones("Мій номер 0501234567").map((e) => e.value)).toEqual(["0501234567"]);
    expect(findPhones("тел. +380 50 123 45 67").map((e) => e.value)).toEqual(["+380 50 123 45 67"]);
    expect(findPhones("тел. (050) 123-45-67").map((e) => e.value)).toEqual(["(050) 123-45-67"]);
    expect(findPhones("00 380 50 123 45 67").map((e) => e.value)).toEqual(["00 380 50 123 45 67"]);
  });
});

describe("passports dob address", () => {
  it("booklet cyrillic and latin lookalikes", () => {
    const found = findPassports("паспорт АА123456 виданий у Києві");
    expect(found).toHaveLength(1);
    expect(found[0]!.subtype).toBe("booklet");
    expect(findPassports("passport AA123456")).toHaveLength(1);
    expect(findPassports("code QZ123456")).toHaveLength(0);
  });
  it("id card needs context", () => {
    expect(findPassports("номер 001234567 в системі")).toHaveLength(0);
    const found = findPassports("ID-картка, документ № 001234567");
    expect(found[0]!.subtype).toBe("id_card");
  });
  it("dob needs context", () => {
    expect(findDobs("оплата 12.03.2024 на рахунок")).toHaveLength(0);
    expect(findDobs("Клієнт народився 12.03.1990 у Львові").map((e) => e.value)).toEqual(["12.03.1990"]);
    expect(findDobs("дата народження 12 січня 1990")[0]!.value).toBe("12 січня 1990");
    expect(findDobs("народився 31.02.1990")).toHaveLength(0);
  });
  it("address", () => {
    const found = findAddresses("Проживає за адресою вул. Хрещатик, буд. 22, кв. 15");
    expect(found[0]!.value).toContain("Хрещатик");
    expect(found[0]!.value).toContain("22");
  });
});

describe("cards emails", () => {
  it("cards", () => {
    expect(findCards("картка 4242424242424242")).toHaveLength(1);
    expect(findCards("4242424242424243")).toHaveLength(0);
  });
  it("email with trailing period", () => {
    expect(findEmails("Напишіть olena@example.com. Дякую")[0]!.value).toBe("olena@example.com");
  });
});

describe("merge mask detect", () => {
  it("iban beats card", () => {
    const iban = generateIban("305299", "4242424242424242");
    const types = new Set(detect(`рахунок ${iban}`).map((e) => e.type));
    expect(types.has(EntityType.IBAN)).toBe(true);
    expect(types.has(EntityType.CARD)).toBe(false);
  });

  it("nested address keeps iban", () => {
    const ibanE = entity(EntityType.IBAN, 20, 49, "x".repeat(29));
    const addr = entity(EntityType.ADDRESS, 0, 60, "addr");
    const types = new Set(merge([ibanE, addr]).map((e) => e.type));
    expect(types).toEqual(new Set([EntityType.IBAN, EntityType.ADDRESS]));
  });

  it("pseudonyms are stable in-document", () => {
    const n = generateRnokpp(new Date(Date.UTC(1992, 4, 1)), 17);
    const text = `ІПН ${n} ще раз ${n}`;
    const entities = detect(text);
    expect(entities).toHaveLength(2);
    const pseudo = mask(text, entities, MaskMode.PSEUDONYM);
    expect(pseudo.split("RNOKPP_1").length - 1).toBe(2);
    expect(pseudo.includes("RNOKPP_2")).toBe(false);
  });

  it("mixed message", () => {
    const iban = generateIban("320313", "999");
    const unzr = generateUnzr(new Date(Date.UTC(1988, 11, 1)), 3);
    const text =
      `Добрий день, я Олена. Тел. +380 67 111 22 33, IBAN ${iban}, ` +
      `УНЗР ${unzr}, email olena@example.com. ` +
      `Паспорт АА123456. Народилась 01.12.1988. ` +
      `Адреса: вул. Садова, буд. 4.`;
    const types = new Set(detect(text).map((e: Entity) => e.type));
    for (const t of [
      EntityType.PHONE,
      EntityType.IBAN,
      EntityType.UNZR,
      EntityType.EMAIL,
      EntityType.PASSPORT,
      EntityType.DOB,
      EntityType.ADDRESS,
    ]) {
      expect(types.has(t), t).toBe(true);
    }
  });
});
