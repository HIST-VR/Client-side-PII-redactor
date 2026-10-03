import { onlyDigits } from "../textutil.ts";

const BASE = [1, 2, 3, 4, 5, 6, 7] as const;
const ALT = [7, 1, 2, 3, 4, 5, 6] as const;

function digits8(value: string): string | null {
  const digits = onlyDigits(value);
  return digits.length === 8 ? digits : null;
}

export function edrpouCheckDigit(first7: string): string {
  if (!/^\d{7}$/.test(first7)) throw new Error("need 7 digits");
  let weights: readonly number[] = "345".includes(first7[0]!) ? ALT : BASE;
  let total = 0;
  for (let i = 0; i < 7; i++) total += weights[i]! * (first7.charCodeAt(i) - 48);
  let remainder = total % 11;
  if (remainder < 10) return String(remainder);
  weights = weights.map((w) => w + 2);
  total = 0;
  for (let i = 0; i < 7; i++) total += weights[i]! * (first7.charCodeAt(i) - 48);
  return String((total % 11) % 10);
}

export function edrpouChecksumValid(value: string): boolean {
  const digits = digits8(value);
  if (!digits) return false;
  return digits[7] === edrpouCheckDigit(digits.slice(0, 7));
}

export function isValidEdrpou(value: string): boolean {
  return edrpouChecksumValid(value);
}

export function generateEdrpou(first7: string): string {
  return first7 + edrpouCheckDigit(first7);
}
