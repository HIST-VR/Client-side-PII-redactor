import type { Locale } from "../i18n";
import { t } from "../i18n";
import type { Route, ThemePref } from "../lib/prefs";
import { hashFor } from "../lib/prefs";

export function Header({
  locale,
  theme,
  route,
  onLocale,
  onTheme,
}: {
  locale: Locale;
  theme: ThemePref;
  route: Route;
  onLocale: (locale: Locale) => void;
  onTheme: (theme: ThemePref) => void;
}) {
  return (
    <header className="header">
      <div className="brand">
        <h1>{t(locale, "title")}</h1>
        <p>{t(locale, "tagline")}</p>
      </div>
      <nav className="nav" aria-label="app">
        <a href={hashFor("redactor")} aria-current={route === "redactor" ? "page" : undefined}>
          {t(locale, "navRedactor")}
        </a>
        <a href={hashFor("metrics")} aria-current={route === "metrics" ? "page" : undefined}>
          {t(locale, "navMetrics")}
        </a>
        <label>
          <span className="visually-hidden">{t(locale, "lang")}</span>
          <select value={locale} onChange={(e) => onLocale(e.target.value as Locale)} aria-label={t(locale, "lang")}>
            <option value="uk">{t(locale, "langUk")}</option>
            <option value="en">{t(locale, "langEn")}</option>
          </select>
        </label>
        <label>
          <span className="visually-hidden">{t(locale, "theme")}</span>
          <select value={theme} onChange={(e) => onTheme(e.target.value as ThemePref)} aria-label={t(locale, "theme")}>
            <option value="system">{t(locale, "themeSystem")}</option>
            <option value="light">{t(locale, "themeLight")}</option>
            <option value="dark">{t(locale, "themeDark")}</option>
          </select>
        </label>
      </nav>
    </header>
  );
}
