import { onlyDigits } from "../textutil.ts";

export const RNOKPP_WEIGHTS = [-1, 5, 7, 9, 4, 6, 10, 5, 7] as const;
const EPOCH_UTC = Date.UTC(1899, 11, 31);
const MIN_BIRTH_UTC = Date.UTC(1920, 0, 1);
const MS_PER_DAY = 86_400_000;

function digits10(value: string): string | null {
  const digits = onlyDigits(value);
  return digits.length === 10 ? digits : null;
}

export function rnokppCheckDigit(first9: string): string {
  if (!/^\d{9}$/.test(first9)) throw new Error("need 9 digits");
  let total = 0;
  for (let i = 0; i < 9; i++) {
    total += RNOKPP_WEIGHTS[i]! * (first9.charCodeAt(i) - 48);
  }
  return String(((total % 11) + 11) % 11 % 10);
}

export function rnokppChecksumValid(value: string): boolean {
  const digits = digits10(value);
  if (!digits) return false;
  return digits[9] === rnokppCheckDigit(digits.slice(0, 9));
}

export function rnokppBirthDate(value: string): Date | null {
  const digits = digits10(value);
  if (!digits) return null;
  const days = Number(digits.slice(0, 5));
  const ms = EPOCH_UTC + days * MS_PER_DAY;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function isValidRnokpp(value: string, today = new Date()): boolean {
  if (!rnokppChecksumValid(value)) return false;
  const dob = rnokppBirthDate(value);
  if (!dob) return false;
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dobUtc = Date.UTC(dob.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate());
  return dobUtc >= MIN_BIRTH_UTC && dobUtc <= todayUtc;
}

export function generateRnokpp(dob: Date, sequence: number): string {
  if (sequence < 0 || sequence > 9999) throw new Error("sequence must be 0–9999");
  const dobUtc = Date.UTC(dob.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate());
  const days = Math.round((dobUtc - EPOCH_UTC) / MS_PER_DAY);
  if (days < 0 || days > 99999) throw new Error("date out of 5-digit day range");
  const first9 = String(days).padStart(5, "0") + String(sequence).padStart(4, "0");
  return first9 + rnokppCheckDigit(first9);
}
