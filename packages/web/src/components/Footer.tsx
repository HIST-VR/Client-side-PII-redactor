import type { Locale } from "../i18n";
import { t } from "../i18n";

export const GITHUB_URL = "https://github.com/HIST-VR";

export function Footer({ locale }: { locale: Locale }) {
  return (
    <footer className="footer">
      <p>{t(locale, "footerBlurb")}</p>
      <p>
        {t(locale, "footerContact")}{" "}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          {t(locale, "footerGithub")}
        </a>
      </p>
    </footer>
  );
}
