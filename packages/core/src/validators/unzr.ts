import { foldText, onlyDigits } from "../textutil.ts";

export const UNZR_WEIGHTS = [7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1] as const;
const MIN_YEAR = 1900;

export function compactUnzr(value: string): string {
  return onlyDigits(value);
}

export function unzrCheckDigit(first12: string): string {
  if (!/^\d{12}$/.test(first12)) throw new Error("need 12 digits");
  let total = 0;
  for (let i = 0; i < 12; i++) total += UNZR_WEIGHTS[i]! * (first12.charCodeAt(i) - 48);
  return String(total % 10);
}

export function unzrChecksumValid(value: string): boolean {
  const digits = compactUnzr(value);
  if (digits.length !== 13) return false;
  return digits[12] === unzrCheckDigit(digits.slice(0, 12));
}

export function unzrBirthDate(value: string): Date | null {
  const digits = compactUnzr(value);
  if (digits.length !== 13) return null;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return d;
}

export function isValidUnzr(value: string, today = new Date()): boolean {
  if (!unzrChecksumValid(value)) return false;
  const dob = unzrBirthDate(value);
  if (!dob) return false;
  const year = dob.getUTCFullYear();
  if (year < MIN_YEAR) return false;
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dobUtc = Date.UTC(dob.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate());
  if (dobUtc > todayUtc) return false;
  const serial = Number(compactUnzr(value).slice(8, 12));
  return serial >= 1 && serial <= 9999;
}

export function generateUnzr(dob: Date, serial: number): string {
  if (serial < 1 || serial > 9999) throw new Error("serial must be 0001–9999");
  const y = dob.getUTCFullYear();
  const m = String(dob.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dob.getUTCDate()).padStart(2, "0");
  const first12 = `${y}${m}${d}${String(serial).padStart(4, "0")}`;
  return `${first12.slice(0, 8)}-${first12.slice(8)}${unzrCheckDigit(first12)}`;
}

export function unzrLooksFormatted(value: string): boolean {
  const folded = foldText(value).trim();
  return folded.length === 14 && folded[8] === "-" && compactUnzr(folded) === folded.slice(0, 8) + folded.slice(9);
}
