import { detect, detectHybrid, mask, MaskMode, type Entity, type EntityType } from "@ua-pii/core";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale, MessageKey } from "../i18n";
import { t, typeLabel } from "../i18n";
import { copyText, pasteText } from "../lib/clipboard";
import {
  ALL_TYPES,
  filterEntities,
  loadEnabledTypes,
  loadMaskMode,
  loadNerEnabled,
  MAX_CHARS,
  saveEnabledTypes,
  saveMaskMode,
  saveNerEnabled,
} from "../lib/prefs";
import { sampleText, type SampleId } from "../lib/samples";
import { NerClient } from "../workers/client";
import { EntityTable } from "./EntityTable";
import { HighlightedText } from "./HighlightedText";
import { Hint } from "./Hint";
import { Limitations } from "./Limitations";

const SAMPLES: SampleId[] = ["support", "bank", "kyc", "mixed", "negatives"];
const NER_DEBOUNCE_MS = 250;
const MASKS: Array<[MaskMode, MessageKey, MessageKey]> = [
  [MaskMode.PLACEHOLDER, "maskPlaceholder", "maskPlaceholderHint"],
  [MaskMode.PARTIAL, "maskPartial", "maskPartialHint"],
  [MaskMode.PSEUDONYM, "maskPseudonym", "maskPseudonymHint"],
];

export function RedactorPage({ locale }: { locale: Locale }) {
  const [ner] = useState(() => new NerClient());
  const [, rerender] = useState(0);
  const [text, setText] = useState("");
  const [trimmed, setTrimmed] = useState(false);
  const [maskMode, setMaskMode] = useState<MaskMode>(loadMaskMode);
  const [enabled, setEnabled] = useState<Set<EntityType>>(loadEnabledTypes);
  const [ruleEntities, setRuleEntities] = useState<Entity[]>([]);
  const [hybridEntities, setHybridEntities] = useState<Entity[] | null>(null);
  const requestGen = useRef(0);

  useEffect(() => {
    const unsub = ner.subscribe(() => rerender((n) => n + 1));
    if (loadNerEnabled()) void ner.load().catch(() => undefined);
    return () => {
      unsub();
      ner.dispose();
    };
  }, [ner]);

  useEffect(() => {
    setHybridEntities(null);
    if (ner.status !== "ready" || !text.trim()) return;
    const gen = ++requestGen.current;
    const timer = window.setTimeout(() => {
      void ner
        .detect(text)
        .then((model) => {
          if (gen !== requestGen.current) return;
          setHybridEntities(detectHybrid(text, model));
        })
        .catch(() => undefined);
    }, NER_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [text, ner, ner.status]);

  function applyText(next: string) {
    const cut = next.length > MAX_CHARS;
    const value = cut ? next.slice(0, MAX_CHARS) : next;
    setTrimmed(cut);
    setText(value);
    setRuleEntities(detect(value));
  }

  const entities = useMemo(
    () => filterEntities(hybridEntities ?? ruleEntities, enabled),
    [hybridEntities, ruleEntities, enabled],
  );
  const masked = useMemo(() => mask(text, entities, maskMode), [text, entities, maskMode]);
  const layer = hybridEntities ? "hybrid" : "rules";

  function toggleType(type: EntityType) {
    const next = new Set(enabled);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setEnabled(next);
    saveEnabledTypes(next);
  }

  async function onPaste() {
    const value = await pasteText();
    if (value === null) return false;
    applyText(value);
    return true;
  }

  return (
    <main id="main">
      <NerBanner locale={locale} ner={ner} />

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <div className="row" style={{ marginBottom: "0.6rem" }}>
          <strong>{t(locale, "samples")}</strong>
          {SAMPLES.map((id) => (
            <button key={id} type="button" className="chip" onClick={() => applyText(sampleText(id))}>
              {t(locale, sampleKey(id))}
            </button>
          ))}
        </div>
        <div className="field-head">
          <label className="field" htmlFor="source-text">
            {t(locale, "inputLabel")}
          </label>
          <div className="field-actions">
            <ActionButton locale={locale} kind="paste" testId="paste-input" onAction={onPaste} />
            <ActionButton locale={locale} kind="copy" testId="copy-input" disabled={!text} text={text} />
          </div>
        </div>
        <textarea
          id="source-text"
          value={text}
          placeholder={t(locale, "inputPlaceholder")}
          onChange={(e) => applyText(e.target.value)}
          spellCheck={false}
        />
        {trimmed ? <p className="warn">{t(locale, "tooLong", { n: MAX_CHARS })}</p> : null}
      </div>

      <div className="grid">
        <section className="panel">
          <div className="field-head">
            <h2>{t(locale, "previewLabel")}</h2>
            <div className="field-actions">
              <ActionButton locale={locale} kind="paste" testId="paste-preview" onAction={onPaste} />
              <ActionButton locale={locale} kind="copy" testId="copy-preview" disabled={!text} text={text} />
            </div>
          </div>
          <HighlightedText text={text} entities={entities} locale={locale} empty={t(locale, "emptyPreview")} />
          <p className="status" aria-live="polite">
            {t(locale, "count", { n: entities.length })} · {t(locale, layer === "hybrid" ? "layerHybrid" : "layerRules")}
          </p>
        </section>
        <section className="panel">
          <div className="field-head">
            <h2>{t(locale, "maskedLabel")}</h2>
            <div className="field-actions">
              <ActionButton locale={locale} kind="paste" testId="paste-masked" onAction={onPaste} />
              <ActionButton locale={locale} kind="copy" testId="copy-masked" disabled={!masked} text={masked} />
            </div>
          </div>
          <pre className="masked" data-testid="masked">
            {masked}
          </pre>
        </section>
      </div>

      <div className="panel" style={{ margin: "1rem 0" }}>
        <h2>{t(locale, "maskMode")}</h2>
        <div className="row" role="group" aria-label={t(locale, "maskMode")}>
          {MASKS.map(([mode, key, hint]) => (
            <Hint key={mode} text={t(locale, hint)}>
              <button
                type="button"
                className="chip"
                aria-pressed={maskMode === mode}
                onClick={() => {
                  setMaskMode(mode);
                  saveMaskMode(mode);
                }}
              >
                {t(locale, key)}
              </button>
            </Hint>
          ))}
        </div>
        <Hint text={t(locale, "typesHint")} block>
          <h2 style={{ marginTop: "0.9rem" }}>{t(locale, "types")}</h2>
        </Hint>
        <div className="row">
          <button
            type="button"
            className="chip"
            onClick={() => {
              const next = new Set(ALL_TYPES);
              setEnabled(next);
              saveEnabledTypes(next);
            }}
          >
            {t(locale, "typesAll")}
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              const next = new Set<EntityType>();
              setEnabled(next);
              saveEnabledTypes(next);
            }}
          >
            {t(locale, "typesNone")}
          </button>
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="chip"
              aria-pressed={enabled.has(type)}
              onClick={() => toggleType(type)}
            >
              {typeLabel(locale, type)}
            </button>
          ))}
        </div>
      </div>

      <EntityTable entities={entities} locale={locale} />
      <Limitations locale={locale} />
    </main>
  );
}

function sampleKey(id: SampleId) {
  switch (id) {
    case "support":
      return "sampleSupport" as const;
    case "bank":
      return "sampleBank" as const;
    case "kyc":
      return "sampleKyc" as const;
    case "mixed":
      return "sampleMixed" as const;
    case "negatives":
      return "sampleNegatives" as const;
  }
}

function ActionButton({
  locale,
  kind,
  testId,
  text,
  disabled,
  onAction,
}: {
  locale: Locale;
  kind: "copy" | "paste";
  testId: string;
  text?: string;
  disabled?: boolean;
  onAction?: () => Promise<boolean>;
}) {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  async function run() {
    const ok = onAction ? await onAction() : await copyText(text ?? "");
    setState(ok ? "ok" : "err");
    window.setTimeout(() => setState("idle"), 1500);
  }
  const label =
    state === "ok"
      ? t(locale, kind === "copy" ? "copied" : "pasted")
      : state === "err"
        ? t(locale, kind === "copy" ? "copyFailed" : "pasteFailed")
        : t(locale, kind);
  return (
    <button type="button" className="btn btn-compact" data-testid={testId} disabled={disabled} onClick={() => void run()}>
      {label}
    </button>
  );
}

function NerBanner({ locale, ner }: { locale: Locale; ner: NerClient }) {
  if (ner.status === "ready") {
    return (
      <div className="banner">
        <p className="ok">{t(locale, "nerReady")}</p>
      </div>
    );
  }
  if (ner.status === "loading") {
    return (
      <div className="banner" aria-live="polite">
        <p>
          {t(locale, "nerLoading")} {ner.progressMessage}
        </p>
        <progress max={100} value={ner.progressPercent ?? undefined} />
      </div>
    );
  }
  if (ner.status === "error") {
    return (
      <div className="banner">
        <p className="warn">
          {t(locale, "nerError")} {ner.lastError}
        </p>
        <p className="status">{t(locale, "nerRefreshHint")}</p>
        <Hint text={t(locale, "nerLoadHint")}>
          <button
            type="button"
            className="btn"
            onClick={() => {
              saveNerEnabled(true);
              void ner.load().catch(() => undefined);
            }}
          >
            {t(locale, "nerRetry")}
          </button>
        </Hint>
      </div>
    );
  }
  return (
    <div className="banner">
      <p>{t(locale, "nerIdle")}</p>
      <Hint text={t(locale, "nerLoadHint")}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            saveNerEnabled(true);
            void ner.load().catch(() => undefined);
          }}
        >
          {t(locale, "nerLoad")}
        </button>
      </Hint>
    </div>
  );
}
