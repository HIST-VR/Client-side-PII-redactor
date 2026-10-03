import { useEffect, useState } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { MetricsPage } from "./components/MetricsPage";
import { RedactorPage } from "./components/RedactorPage";
import type { Locale } from "./i18n";
import { t } from "./i18n";
import {
  loadLocale,
  loadTheme,
  resolveTheme,
  routeFromHash,
  saveLocale,
  saveTheme,
  type Route,
  type ThemePref,
} from "./lib/prefs";

export function App() {
  const [locale, setLocale] = useState<Locale>(loadLocale);
  const [theme, setTheme] = useState<ThemePref>(loadTheme);
  const [route, setRoute] = useState<Route>(() => routeFromHash(window.location.hash));
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const resolved = resolveTheme(theme, systemDark);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = resolved;
    document.title = t(locale, "title");
  }, [locale, resolved]);

  return (
    <div className="shell">
      <a className="skip" href="#main">
        {t(locale, "skip")}
      </a>
      <Header
        locale={locale}
        theme={theme}
        route={route}
        onLocale={(next) => {
          setLocale(next);
          saveLocale(next);
        }}
        onTheme={(next) => {
          setTheme(next);
          saveTheme(next);
        }}
      />
      {route === "metrics" ? <MetricsPage locale={locale} /> : <RedactorPage locale={locale} />}
      <Footer locale={locale} />
    </div>
  );
}
