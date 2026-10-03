import { EntityType, MaskMode } from "@ua-pii/core";
import { readJson, writeJson } from "./storage";
import type { Locale } from "../i18n";

export type ThemePref = "light" | "dark" | "system";
export type Route = "redactor" | "metrics";

const KEY = {
  locale: "ua-pii.locale",
  theme: "ua-pii.theme",
  mask: "ua-pii.maskMode",
  types: "ua-pii.enabledTypes",
  ner: "ua-pii.nerEnabled",
} as const;

export const ALL_TYPES: EntityType[] = Object.values(EntityType);

export const MAX_CHARS = 20_000;

export function loadLocale(): Locale {
  const v = readJson<string>(KEY.locale, "uk");
  return v === "en" ? "en" : "uk";
}

export function saveLocale(locale: Locale): void {
  writeJson(KEY.locale, locale);
}

export function loadTheme(): ThemePref {
  const v = readJson<string>(KEY.theme, "system");
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export function saveTheme(theme: ThemePref): void {
  writeJson(KEY.theme, theme);
}

export function loadMaskMode(): MaskMode {
  const v = readJson<string>(KEY.mask, MaskMode.PLACEHOLDER);
  if (v === MaskMode.PLACEHOLDER || v === MaskMode.PARTIAL || v === MaskMode.PSEUDONYM) return v;
  return MaskMode.PLACEHOLDER;
}

export function saveMaskMode(mode: MaskMode): void {
  writeJson(KEY.mask, mode);
}

export function loadEnabledTypes(): Set<EntityType> {
  const v = readJson<string[] | null>(KEY.types, null);
  if (!v) return new Set(ALL_TYPES);
  const allowed = new Set<string>(ALL_TYPES);
  return new Set(v.filter((t): t is EntityType => allowed.has(t)));
}

export function saveEnabledTypes(types: ReadonlySet<EntityType>): void {
  writeJson(KEY.types, [...types]);
}

export function loadNerEnabled(): boolean {
  return readJson<boolean>(KEY.ner, false);
}

export function saveNerEnabled(on: boolean): void {
  writeJson(KEY.ner, on);
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): "light" | "dark" {
  if (pref === "system") return systemDark ? "dark" : "light";
  return pref;
}

export function routeFromHash(hash: string): Route {
  const path = hash.replace(/^#/, "");
  return path.startsWith("/metrics") ? "metrics" : "redactor";
}

export function hashFor(route: Route): string {
  return route === "metrics" ? "#/metrics" : "#/";
}

export function filterEntities<T extends { type: EntityType }>(
  entities: readonly T[],
  enabled: ReadonlySet<EntityType>,
): T[] {
  if (enabled.size === ALL_TYPES.length) return [...entities];
  return entities.filter((e) => enabled.has(e.type));
}
