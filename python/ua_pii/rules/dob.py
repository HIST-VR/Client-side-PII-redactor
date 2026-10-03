"""Dates of birth: numeric and month-name dates, only with a nearby cue."""

from __future__ import annotations

import re
from datetime import date

from ua_pii.textutil import fold_text, has_keyword_nearby
from ua_pii.types import Entity, EntityType, Source

_DOB_CONTEXT = (
    "народив",
    "народила",
    "народження",
    "дата нар",
    "д.н",
    "д. н",
    "дн:",
    "дн ",
    "р.н",
    "dob",
    "date of birth",
    "birthday",
    "born",
    "д/н",
)

_MONTHS: dict[str, int] = {
    "січня": 1,
    "січень": 1,
    "января": 1,
    "январь": 1,
    "january": 1,
    "jan": 1,
    "лютого": 2,
    "лютий": 2,
    "февраля": 2,
    "февраль": 2,
    "february": 2,
    "feb": 2,
    "березня": 3,
    "березень": 3,
    "марта": 3,
    "март": 3,
    "march": 3,
    "mar": 3,
    "квітня": 4,
    "квітень": 4,
    "апреля": 4,
    "апрель": 4,
    "april": 4,
    "apr": 4,
    "травня": 5,
    "травень": 5,
    "мая": 5,
    "май": 5,
    "may": 5,
    "червня": 6,
    "червень": 6,
    "июня": 6,
    "июнь": 6,
    "june": 6,
    "jun": 6,
    "липня": 7,
    "липень": 7,
    "июля": 7,
    "июль": 7,
    "july": 7,
    "jul": 7,
    "серпня": 8,
    "серпень": 8,
    "августа": 8,
    "август": 8,
    "august": 8,
    "aug": 8,
    "вересня": 9,
    "вересень": 9,
    "сентября": 9,
    "сентябрь": 9,
    "september": 9,
    "sep": 9,
    "sept": 9,
    "жовтня": 10,
    "жовтень": 10,
    "октября": 10,
    "октябрь": 10,
    "october": 10,
    "oct": 10,
    "листопада": 11,
    "листопад": 11,
    "ноября": 11,
    "ноябрь": 11,
    "november": 11,
    "nov": 11,
    "грудня": 12,
    "грудень": 12,
    "декабря": 12,
    "декабрь": 12,
    "december": 12,
    "dec": 12,
}

_MONTH_ALT = "|".join(sorted((_MONTHS), key=len, reverse=True))

_NUMERIC = re.compile(
    r"(?<!\d)(\d{1,2})[./](\d{1,2})[./]((?:19|20)\d{2})(?!\d)"
)
_ISO = re.compile(r"(?<!\d)((?:19|20)\d{2})-(\d{2})-(\d{2})(?!\d)")
_NAMED = re.compile(
    rf"(?<!\d)(\d{{1,2}})\s+({_MONTH_ALT})\s+((?:19|20)\d{{2}})(?!\d)",
    re.IGNORECASE,
)


def find_dobs(text: str, today: date | None = None) -> list[Entity]:
    folded = fold_text(text)
    limit = today or date.today()
    entities: list[Entity] = []
    seen: set[tuple[int, int]] = set()

    for match, parsed in _iter_dates(folded):
        if parsed is None:
            continue
        if parsed.year < 1920 or parsed > limit:
            continue
        start, end = match.start(), match.end()
        if (start, end) in seen:
            continue
        if has_keyword_nearby(folded, start, end, _DOB_CONTEXT):
            seen.add((start, end))
            entities.append(
                Entity(
                    type=EntityType.DOB,
                    start=start,
                    end=end,
                    value=text[start:end],
                    source=Source.RULE,
                )
            )
    return entities


def _iter_dates(folded: str):
    for match in _NUMERIC.finditer(folded):
        day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
        yield match, _safe_date(year, month, day)
    for match in _ISO.finditer(folded):
        year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
        yield match, _safe_date(year, month, day)
    for match in _NAMED.finditer(folded):
        day = int(match.group(1))
        month = _MONTHS[match.group(2).lower()]
        year = int(match.group(3))
        yield match, _safe_date(year, month, day)


def _safe_date(year: int, month: int, day: int) -> date | None:
    try:
        return date(year, month, day)
    except ValueError:
        return None
