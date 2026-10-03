import { EntityType } from "@ua-pii/core";
import { en } from "./en";
import { uk } from "./uk";

export type Locale = "uk" | "en";
export type MessageKey = keyof typeof uk;

const dict = { uk, en } as const;

export function t(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  let out: string = dict[locale][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}

export function typeLabel(locale: Locale, type: EntityType): string {
  return t(locale, `type${type}` as MessageKey);
}

export const LOCALES: Locale[] = ["uk", "en"];
