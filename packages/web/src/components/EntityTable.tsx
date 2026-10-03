import type { Entity } from "@ua-pii/core";
import type { Locale } from "../i18n";
import { t, typeLabel } from "../i18n";

export function EntityTable({ entities, locale }: { entities: Entity[]; locale: Locale }) {
  if (entities.length === 0) {
    return <p className="status">{t(locale, "noEntities")}</p>;
  }
  return (
    <div className="panel">
      <h2>{t(locale, "entities")}</h2>
      <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t(locale, "entityType")}</th>
            <th>{t(locale, "entityValue")}</th>
            <th>{t(locale, "entitySource")}</th>
            <th>{t(locale, "entitySpan")}</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((e, i) => (
            <tr key={`${e.type}-${e.start}-${e.end}-${i}`}>
              <td>
                <span className="swatch" style={{ ["--ent-color" as string]: `var(--ent-${e.type})` }}>
                  <i />
                  {typeLabel(locale, e.type)}
                </span>
              </td>
              <td className="mono">{e.value}</td>
              <td>{e.source === "model" ? t(locale, "sourceModel") : t(locale, "sourceRule")}</td>
              <td className="mono">
                {e.start}–{e.end}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
