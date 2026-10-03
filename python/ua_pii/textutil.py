"""Length-preserving folds and digit-run scanners.

Folds map one character to one character so spans in the original text stay valid.
"""

from __future__ import annotations

import re
from collections.abc import Iterator

# Latin/Cyrillic lookalikes seen in passport series and mixed chat.
_LOOKALIKE_TO_CYR = str.maketrans(
    {
        "A": "А",
        "a": "А",
        "B": "В",
        "b": "В",
        "C": "С",
        "c": "С",
        "E": "Е",
        "e": "Е",
        "H": "Н",
        "h": "Н",
        "I": "І",
        "i": "І",
        "K": "К",
        "k": "К",
        "M": "М",
        "m": "М",
        "O": "О",
        "o": "О",
        "P": "Р",
        "p": "Р",
        "T": "Т",
        "t": "Т",
        "X": "Х",
        "x": "Х",
        "Y": "У",
        "y": "У",
    }
)

_SPACEISH = {
    "\u00a0": " ",  # nbsp
    "\u202f": " ",  # narrow nbsp
    "\u2007": " ",
    "\u2009": " ",
    "\u200a": " ",
    "\u200b": " ",  # zero-width space → space (length 1)
    "\ufeff": " ",
}
_DASHISH = {
    "−": "-",
    "–": "-",
    "—": "-",
    "‐": "-",
    "‑": "-",
    "‒": "-",
}

DIGIT_SEPS = frozenset(" \t-()/")


def fold_char(ch: str) -> str:
    if ch in _SPACEISH:
        return _SPACEISH[ch]
    if ch in _DASHISH:
        return _DASHISH[ch]
    # Fullwidth digits ０-９
    code = ord(ch)
    if 0xFF10 <= code <= 0xFF19:
        return chr(ord("0") + (code - 0xFF10))
    return ch


def fold_text(text: str) -> str:
    return "".join(fold_char(ch) for ch in text)


def only_digits(text: str) -> str:
    return "".join(ch for ch in fold_text(text) if ch.isdigit())


def fold_series_letter(ch: str) -> str:
    """Map a passport-series letter to uppercase Cyrillic when it is a lookalike."""
    folded = ch.translate(_LOOKALIKE_TO_CYR)
    return folded.upper()


def has_keyword_nearby(
    text: str,
    start: int,
    end: int,
    keywords: tuple[str, ...],
    window: int = 48,
) -> bool:
    lo = max(0, start - window)
    hi = min(len(text), end + window)
    snippet = fold_text(text[lo:hi]).lower()
    return any(key in snippet for key in keywords)


def iter_digit_groups(
    text: str,
    count: int,
    seps: frozenset[str] = DIGIT_SEPS,
) -> Iterator[tuple[int, int, str]]:
    """Yield (start, end, digits) for runs whose compact digit length equals `count`.

    The run must be bounded by a non-digit (separators allowed inside). A 27-digit
    IBAN therefore does not yield ten-digit РНОКПП windows from its interior.
    """
    folded = fold_text(text)
    i = 0
    n = len(folded)
    while i < n:
        ch = folded[i]
        if ch.isdigit():
            j = i
            digits: list[str] = []
            while j < n and (folded[j].isdigit() or folded[j] in seps):
                if folded[j].isdigit():
                    digits.append(folded[j])
                j += 1
            end = j
            while end > i and folded[end - 1] in seps:
                end -= 1
            if len(digits) == count:
                yield i, end, "".join(digits)
            i = j
        else:
            i += 1


def iter_digit_groups_range(
    text: str,
    min_count: int,
    max_count: int,
    seps: frozenset[str] = DIGIT_SEPS,
) -> Iterator[tuple[int, int, str]]:
    folded = fold_text(text)
    i = 0
    n = len(folded)
    while i < n:
        if folded[i].isdigit():
            j = i
            digits: list[str] = []
            while j < n and (folded[j].isdigit() or folded[j] in seps):
                if folded[j].isdigit():
                    digits.append(folded[j])
                j += 1
            end = j
            while end > i and folded[end - 1] in seps:
                end -= 1
            length = len(digits)
            if min_count <= length <= max_count:
                yield i, end, "".join(digits)
            i = j
        else:
            i += 1


def compile_ci(pattern: str) -> re.Pattern[str]:
    return re.compile(pattern, re.IGNORECASE | re.UNICODE)
