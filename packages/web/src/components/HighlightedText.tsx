import type { Entity } from "@ua-pii/core";
import { slices, topEntity } from "../lib/slices";
import type { Locale } from "../i18n";
import { typeLabel } from "../i18n";

export function HighlightedText({
  text,
  entities,
  locale,
  empty,
}: {
  text: string;
  entities: Entity[];
  locale: Locale;
  empty: string;
}) {
  if (!text) return <div className="preview">{empty}</div>;
  const parts = slices(text, entities);
  return (
    <div className="preview" data-testid="preview">
      {parts.map((part, i) => {
        const ent = topEntity(part);
        if (!ent) return <span key={i}>{part.text}</span>;
        const types = [...new Set(part.entities.map((e) => e.type))];
        const title = types.map((ty) => typeLabel(locale, ty)).join(" · ");
        return (
          <mark
            key={i}
            className="ent"
            style={{ ["--ent-color" as string]: `var(--ent-${ent.type})` }}
            title={title}
          >
            {part.text}
          </mark>
        );
      })}
    </div>
  );
}
