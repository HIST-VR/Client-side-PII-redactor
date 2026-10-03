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
      <div className="toolbar">
        <nav className="nav" aria-label="app">
          <a
            className="nav-link"
            href={hashFor("redactor")}
            aria-current={route === "redactor" ? "page" : undefined}
          >
            {t(locale, "navRedactor")}
          </a>
          <a
            className="nav-link"
            href={hashFor("metrics")}
            aria-current={route === "metrics" ? "page" : undefined}
          >
            {t(locale, "navMetrics")}
          </a>
        </nav>
        <div className="seg" role="group" aria-label={t(locale, "lang")}>
          <button type="button" aria-pressed={locale === "uk"} onClick={() => onLocale("uk")}>
            {t(locale, "langUk")}
          </button>
          <button type="button" aria-pressed={locale === "en"} onClick={() => onLocale("en")}>
            {t(locale, "langEn")}
          </button>
        </div>
        <div className="seg" role="group" aria-label={t(locale, "theme")}>
          <button
            type="button"
            aria-label={t(locale, "themeLight")}
            aria-pressed={theme === "light"}
            onClick={() => onTheme("light")}
          >
            <SunIcon />
          </button>
          <button
            type="button"
            aria-label={t(locale, "themeDark")}
            aria-pressed={theme === "dark"}
            onClick={() => onTheme("dark")}
          >
            <MoonIcon />
          </button>
          <button
            type="button"
            aria-label={t(locale, "themeSystem")}
            aria-pressed={theme === "system"}
            onClick={() => onTheme("system")}
          >
            <SystemIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
      <path
        d="M16.2 13.2A6.2 6.2 0 0 1 10.8 4.5 7 7 0 1 0 19.5 13a6.2 6.2 0 0 1-3.3.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
      <rect x="4" y="5" width="16" height="11" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 19h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
