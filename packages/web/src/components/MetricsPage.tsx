import { EntityType } from "@ua-pii/core";
import type { Locale } from "../i18n";
import { t, typeLabel } from "../i18n";
import { fmtScore, METRICS, type Report } from "../data/metrics";
import { ALL_TYPES } from "../lib/prefs";
import { Limitations } from "./Limitations";

export function MetricsPage({ locale }: { locale: Locale }) {
  return (
    <main id="main">
      <section className="panel">
        <h2>{t(locale, "metricsTitle")}</h2>
        <p className="status">{t(locale, "metricsLead")}</p>
        <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t(locale, "metricsLayer")}</th>
              <th>{t(locale, "metricsP")}</th>
              <th>{t(locale, "metricsR")}</th>
              <th>{t(locale, "metricsF1")}</th>
              <th>{t(locale, "metricsSupport")}</th>
            </tr>
          </thead>
          <tbody>
            <LayerRow locale={locale} report={METRICS.rules} labelKey="metricsRules" />
            <LayerRow locale={locale} report={METRICS.model} labelKey="metricsModel" />
            <LayerRow locale={locale} report={METRICS.hybrid} labelKey="metricsHybrid" />
          </tbody>
        </table>
        </div>
      </section>
      <section className="panel" style={{ marginTop: "1rem" }}>
        <h2>{t(locale, "metricsPerType")}</h2>
        <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t(locale, "entityType")}</th>
              <th>{t(locale, "metricsP")}</th>
              <th>{t(locale, "metricsR")}</th>
              <th>{t(locale, "metricsF1")}</th>
              <th>{t(locale, "metricsSupport")}</th>
            </tr>
          </thead>
          <tbody>
            {ALL_TYPES.map((type) => {
              const row = METRICS.hybrid.per_type[type];
              if (!row) return null;
              return (
                <tr key={type}>
                  <td>{typeLabel(locale, type as EntityType)}</td>
                  <td>{fmtScore(row.precision)}</td>
                  <td>{fmtScore(row.recall)}</td>
                  <td>{fmtScore(row.f1)}</td>
                  <td>{row.support}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <p className="status" style={{ marginTop: "0.8rem" }}>
          {t(locale, "metricsNote")}
        </p>
      </section>
      <Limitations locale={locale} />
    </main>
  );
}

function LayerRow({
  locale,
  report,
  labelKey,
}: {
  locale: Locale;
  report: Report;
  labelKey: "metricsRules" | "metricsModel" | "metricsHybrid";
}) {
  return (
    <tr>
      <td>{t(locale, labelKey)}</td>
      <td>{fmtScore(report.micro.precision)}</td>
      <td>{fmtScore(report.micro.recall)}</td>
      <td data-testid={`f1-${report.layer}`}>{fmtScore(report.micro.f1)}</td>
      <td>{report.micro.support}</td>
    </tr>
  );
}
