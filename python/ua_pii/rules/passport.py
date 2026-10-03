"""Ukrainian passports: ID-card (9 digits, needs context) and booklet (2 letters + 6 digits)."""

from __future__ import annotations

import re

from ua_pii.textutil import fold_series_letter, fold_text, has_keyword_nearby, iter_digit_groups
from ua_pii.types import Entity, EntityType, Source

# Ukrainian uppercase letters after lookalike folding.
_UA_LETTERS = set("АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ")

_ID_CONTEXT = (
    "паспорт",
    "паспорту",
    "паспорта",
    "id-карт",
    "id карт",
    "ід-карт",
    "ідентифікаційн",
    "документ №",
    "документ no",
    "документ n",
    "документ#",
    "серія",
    "номер паспорта",
    "passport",
)

# Two letters (Cyrillic or Latin lookalikes) and six digits, optional hyphen/space.
_BOOKLET_RE = re.compile(
    r"(?<![A-Za-zА-Яа-яІіЇїЄєҐґЁё])"
    r"[A-Za-zА-Яа-яІіЇїЄєҐґЁё]{2}"
    r"[\s\-]*"
    r"\d{6}"
    r"(?!\d)"
)


def find_passports(text: str) -> list[Entity]:
    folded = fold_text(text)
    entities: list[Entity] = []
    entities.extend(_find_booklets(text, folded))
    entities.extend(_find_id_cards(text, folded))
    return entities


def _find_booklets(text: str, folded: str) -> list[Entity]:
    entities: list[Entity] = []
    for match in _BOOKLET_RE.finditer(folded):
        series = match.group(0)[:2]
        if not _valid_series(series):
            continue
        entities.append(
            Entity(
                type=EntityType.PASSPORT,
                start=match.start(),
                end=match.end(),
                value=text[match.start() : match.end()],
                source=Source.RULE,
                subtype="booklet",
            )
        )
    return entities


def _find_id_cards(text: str, folded: str) -> list[Entity]:
    entities: list[Entity] = []
    for start, end, _digits in iter_digit_groups(text, 9):
        if has_keyword_nearby(folded, start, end, _ID_CONTEXT):
            entities.append(
                Entity(
                    type=EntityType.PASSPORT,
                    start=start,
                    end=end,
                    value=text[start:end],
                    source=Source.RULE,
                    subtype="id_card",
                )
            )
    return entities


def _valid_series(letters: str) -> bool:
    if len(letters) != 2:
        return False
    a, b = fold_series_letter(letters[0]), fold_series_letter(letters[1])
    return a in _UA_LETTERS and b in _UA_LETTERS
