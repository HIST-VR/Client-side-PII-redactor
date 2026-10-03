import type { Locale } from "../i18n";
import { t } from "../i18n";

export function Limitations({ locale }: { locale: Locale }) {
  return (
    <aside className="limitations">
      <h2>{t(locale, "limitationsTitle")}</h2>
      <p>{t(locale, "limitationsBody")}</p>
    </aside>
  );
}
