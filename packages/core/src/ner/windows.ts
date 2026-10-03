export interface TokenWindow {
  /** Inclusive start in the content-token sequence (no special tokens). */
  start: number;
  /** Exclusive end. */
  end: number;
}

/** Sliding windows over content tokens. XLM-R uses 512 including <s> and </s>. */
export function tokenWindows(
  contentTokens: number,
  maxWithSpecial = 512,
  stride = 128,
): TokenWindow[] {
  const maxContent = Math.max(1, maxWithSpecial - 2);
  if (contentTokens <= maxContent) return [{ start: 0, end: contentTokens }];
  const step = Math.max(1, maxContent - stride);
  const out: TokenWindow[] = [];
  for (let start = 0; start < contentTokens; start += step) {
    const end = Math.min(contentTokens, start + maxContent);
    out.push({ start, end });
    if (end === contentTokens) break;
  }
  return out;
}

export interface TokenPred {
  label: string;
  score: number;
}

/** Keep the higher-scoring label when windows overlap. */
export function mergeWindowPreds(length: number, windows: { start: number; preds: TokenPred[] }[]): TokenPred[] {
  const best: Array<TokenPred | undefined> = Array.from({ length });
  for (const w of windows) {
    for (let i = 0; i < w.preds.length; i++) {
      const idx = w.start + i;
      const pred = w.preds[i]!;
      const prev = best[idx];
      if (!prev || pred.score > prev.score) best[idx] = pred;
    }
  }
  return best.map((p) => p ?? { label: "O", score: 0 });
}
