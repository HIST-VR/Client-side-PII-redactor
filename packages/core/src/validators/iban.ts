import { foldText } from "../textutil.ts";

export const UA_IBAN_LENGTH = 29;

export function compactIban(value: string): string {
  const folded = foldText(value).toUpperCase();
  let out = "";
  for (const ch of folded) {
    if ((ch >= "0" && ch <= "9") || (ch >= "A" && ch <= "Z")) out += ch;
  }
  return out;
}

function toNumeric(s: string): string {
  let out = "";
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch >= "A" && ch <= "Z") out += String(ch.charCodeAt(0) - 55);
    else throw new Error(`non-alphanumeric IBAN character: ${ch}`);
  }
  return out;
}

export function mod97(numeric: string): number {
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + (ch.charCodeAt(0) - 48)) % 97;
  }
  return remainder;
}

export function checkRemainder(compacted: string): number {
  const rearranged = compacted.slice(4) + compacted.slice(0, 4);
  return mod97(toNumeric(rearranged));
}

export function isValidIban(value: string): boolean {
  const compacted = compactIban(value);
  if (compacted.length !== UA_IBAN_LENGTH) return false;
  if (!compacted.startsWith("UA")) return false;
  if (!/^\d+$/.test(compacted.slice(2))) return false;
  return checkRemainder(compacted) === 1;
}

export function generateIban(nbuId: string, account: string): string {
  if (!/^\d{6}$/.test(nbuId)) throw new Error("nbu_id must be 6 digits");
  if (!/^\d{1,19}$/.test(account)) throw new Error("account must be 1–19 digits");
  const bban = nbuId + account.padStart(19, "0");
  const remainder = checkRemainder("UA00" + bban);
  const check = (98 - remainder).toString().padStart(2, "0");
  return `UA${check}${bban}`;
}
