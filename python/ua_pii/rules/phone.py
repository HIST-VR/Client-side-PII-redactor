"""Ukrainian phone numbers: +380XXXXXXXXX or 0XXXXXXXXX (9-digit NSN)."""

from __future__ import annotations

import re

from ua_pii.textutil import fold_text, only_digits
from ua_pii.types import Entity, EntityType, Source

# International (+/00) 380 + 9 digits, or national 0 + 9 digits, separators allowed.
_PHONE_RE = re.compile(
    r"(?<!\d)(?:\+|00\s*)?380(?:[\s\-()]*\d){9}(?!\d)|(?<!\d)\(?0(?:[\s\-()]*\d){9}(?!\d)"
)


def find_phones(text: str) -> list[Entity]:
    folded = fold_text(text)
    entities: list[Entity] = []
    for match in _PHONE_RE.finditer(folded):
        digits = only_digits(match.group(0))
        if digits.startswith("00"):
            digits = digits[2:]
        if _is_ua_phone(digits):
            entities.append(
                Entity(
                    type=EntityType.PHONE,
                    start=match.start(),
                    end=match.end(),
                    value=text[match.start() : match.end()],
                    source=Source.RULE,
                )
            )
    return entities


def _is_ua_phone(digits: str) -> bool:
    if digits.startswith("380") and len(digits) == 12:
        return True
    if digits.startswith("0") and len(digits) == 10:
        return True
    return False
