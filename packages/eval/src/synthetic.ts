import {
  EntityType,
  generateEdrpou,
  generateIban,
  generateLuhn,
  generateRnokpp,
  generateUnzr,
} from "@ua-pii/core";
import type { Slot } from "./types.ts";

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: Rng, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)]!;
}

export function int(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function digits(rng: Rng, n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(rng() * 10);
  return s;
}

const OPS = ["50", "63", "66", "67", "68", "73", "91", "93", "95", "96", "97", "98", "99"] as const;
const NBU = ["305299", "320313", "322001", "300335", "351005"] as const;
const SERIES = ["АА", "КМ", "СМ", "ТН", "ВК", "НС", "СК"] as const;

export const FIRST = ["Олена", "Іван", "Марія", "Андрій", "Наталія", "Сергій", "Катерина", "Дмитро", "Юлія", "Тарас"] as const;
export const LAST = ["Петренко", "Коваленко", "Мельник", "Бондаренко", "Ткаченко", "Кравченко", "Олійник", "Шевченко"] as const;
export const FIRST_EN = ["Olena", "Ivan", "Maria", "Andrii", "Natalia", "Serhii", "Kateryna", "Dmytro", "Yulia", "Taras"] as const;
export const LAST_EN = ["Petrenko", "Kovalenko", "Melnyk", "Bondarenko", "Tkachenko", "Kravchenko", "Oliinyk", "Shevchenko"] as const;
export const EMAIL_LOCAL = ["olena", "ivan", "maria", "andrii", "natalia", "serhii", "kateryna", "dmytro", "yulia", "taras"] as const;
export const STREETS = ["Садова", "Хрещатик", "Шевченка", "Грушевського", "Лесі Українки", "Гагаріна", "Миру"] as const;
export const STREET_KIND = ["вул.", "просп.", "бульв."] as const;

export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export function randomDob(rng: Rng): Date {
  return utcDate(int(rng, 1965, 2002), int(rng, 1, 12), int(rng, 1, 28));
}

export function formatDob(d: Date, style: "dot" | "iso" | "uk"): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if (style === "iso") return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (style === "dot") return `${String(day).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
  const months = [
    "січня", "лютого", "березня", "квітня", "травня", "червня",
    "липня", "серпня", "вересня", "жовтня", "листопада", "грудня",
  ];
  return `${day} ${months[m - 1]} ${y}`;
}

export function makePhone(rng: Rng, style: "plus" | "national" | "grouped" | "parens"): string {
  const op = pick(rng, OPS);
  const rest = digits(rng, 7);
  if (style === "plus") return `+380${op}${rest}`;
  if (style === "national") return `0${op}${rest}`;
  if (style === "parens") return `(0${op}) ${rest.slice(0, 3)}-${rest.slice(3, 5)}-${rest.slice(5)}`;
  return `+380 ${op} ${rest.slice(0, 3)} ${rest.slice(3, 5)} ${rest.slice(5)}`;
}

export function group4(value: string): string {
  return value.replace(/\s+/g, "").match(/.{1,4}/g)!.join(" ");
}

export function makeIban(rng: Rng, grouped: boolean): string {
  const iban = generateIban(pick(rng, NBU), String(int(rng, 1, 1_000_000_000)));
  return grouped ? group4(iban) : iban;
}

export function makeCard(rng: Rng, grouped: boolean): string {
  const pan = generateLuhn("4" + digits(rng, 14));
  if (!grouped) return pan;
  return pan.match(/.{1,4}/g)!.join(" ");
}

export function makeRnokpp(rng: Rng): string {
  return generateRnokpp(randomDob(rng), int(rng, 1, 9999));
}

export function makeEdrpou(rng: Rng): string {
  return generateEdrpou(digits(rng, 7));
}

export function makeUnzr(rng: Rng, hyphen: boolean): string {
  const v = generateUnzr(randomDob(rng), int(rng, 1, 9999));
  return hyphen ? v : v.replace("-", "");
}

export function makeBooklet(rng: Rng, hyphen: boolean): string {
  const n = digits(rng, 6);
  const s = pick(rng, SERIES);
  return hyphen ? `${s}-${n}` : `${s}${n}`;
}

export function makeIdCard(rng: Rng): string {
  return digits(rng, 9);
}

export function makeEmail(rng: Rng): string {
  const domains = ["example.com", "example.org", "mail.test"] as const;
  const slug = `${pick(rng, EMAIL_LOCAL)}.${pick(rng, LAST_EN).toLowerCase()}${int(rng, 1, 99)}`;
  return `${slug}@${pick(rng, domains)}`;
}

export function makeAddress(rng: Rng): string {
  const kind = pick(rng, STREET_KIND);
  const street = pick(rng, STREETS);
  const bld = int(rng, 1, 120);
  const apt = int(rng, 1, 80);
  if (rng() < 0.3) return `${kind} ${street}, буд. ${bld}`;
  return `${kind} ${street}, буд. ${bld}, кв. ${apt}`;
}

export function makePerson(rng: Rng): string {
  return `${pick(rng, FIRST)} ${pick(rng, LAST)}`;
}

export function makePersonEn(rng: Rng): string {
  return `${pick(rng, FIRST_EN)} ${pick(rng, LAST_EN)}`;
}

export function slot(type: (typeof EntityType)[keyof typeof EntityType], value: string): Slot {
  return { type, value };
}

export function mutateLastDigit(digitsValue: string): string {
  const last = digitsValue[digitsValue.length - 1]!;
  const next = last === "0" ? "1" : "0";
  return digitsValue.slice(0, -1) + next;
}
