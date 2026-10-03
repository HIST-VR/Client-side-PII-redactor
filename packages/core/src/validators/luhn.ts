import { onlyDigits } from "../textutil.ts";

export function luhnOk(digits: string): boolean {
  let total = 0;
  let twice = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (twice) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    total += n;
    twice = !twice;
  }
  return total % 10 === 0;
}

export function luhnValid(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length < 13 || digits.length > 19) return false;
  return luhnOk(digits);
}

export function luhnCheckDigit(payload: string): string {
  if (!/^\d+$/.test(payload)) throw new Error("payload must be digits");
  const body = payload + "0";
  let total = 0;
  let twice = false;
  for (let i = body.length - 1; i >= 0; i--) {
    let n = body.charCodeAt(i) - 48;
    if (twice) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    total += n;
    twice = !twice;
  }
  return String((10 - (total % 10)) % 10);
}

export function generateLuhn(payload: string): string {
  return payload + luhnCheckDigit(payload);
}
