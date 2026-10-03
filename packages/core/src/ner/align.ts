const SPIECE = "\u2581";
const SPECIAL = new Set(["<s>", "</s>", "<pad>", "<unk>", "<mask>", "[CLS]", "[SEP]", "[PAD]", "[UNK]"]);

export interface AlignedToken {
  start: number;
  end: number;
}

/**
 * Map tokenizer pieces onto `text` with a left-to-right greedy scan.
 * Accepts SentencePiece `▁` pieces or already-decoded words with a leading space.
 */
export function alignTokens(text: string, words: readonly string[]): Array<AlignedToken | null> {
  let cursor = 0;
  const out: Array<AlignedToken | null> = [];
  for (const raw of words) {
    const parsed = parsePiece(raw);
    if (!parsed) {
      out.push(null);
      continue;
    }
    while (cursor < text.length && isSpace(text[cursor]!)) cursor += 1;
    if (parsed.piece.length === 0) {
      out.push(null);
      continue;
    }
    const start = indexOfFrom(text, parsed.piece, cursor, parsed.skipSpace);
    if (start < 0) {
      out.push(null);
      continue;
    }
    const end = start + parsed.piece.length;
    out.push({ start, end });
    cursor = end;
  }
  return out;
}

function parsePiece(raw: string): { skipSpace: boolean; piece: string } | null {
  if (!raw || SPECIAL.has(raw)) return null;
  let piece = raw;
  let skipSpace = false;
  if (piece.startsWith(SPIECE)) {
    skipSpace = true;
    piece = piece.slice(1);
  } else if (piece[0] === " ") {
    skipSpace = true;
    piece = piece.slice(1);
  }
  return { skipSpace, piece };
}

function isSpace(ch: string): boolean {
  return ch === " " || ch === "\n" || ch === "\t" || ch === "\r" || ch === "\u00a0";
}

function indexOfFrom(text: string, piece: string, cursor: number, allowGap: boolean): number {
  if (text.startsWith(piece, cursor)) return cursor;
  if (!allowGap) {
    // Continuation subword: skip a short run of punctuation, then retry.
    let i = cursor;
    while (i < text.length && i - cursor < 4 && isPunct(text[i]!)) i += 1;
    if (i !== cursor && text.startsWith(piece, i)) return i;
    return -1;
  }
  const idx = text.indexOf(piece, cursor);
  return idx;
}

function isPunct(ch: string): boolean {
  return ".,;:!?…«»\"'()[]-–—/".includes(ch);
}
