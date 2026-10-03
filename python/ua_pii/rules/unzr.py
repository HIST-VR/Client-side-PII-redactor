from __future__ import annotations

import re

from ua_pii.textutil import fold_text, iter_digit_groups
from ua_pii.types import Entity, EntityType, Source
from ua_pii.validators.unzr import is_valid

# Official display form: YYYYMMDD-XXXXC
_FORMATTED = re.compile(r"(?<!\d)\d{8}-\d{5}(?!\d)")


def find_unzr(text: str) -> list[Entity]:
    folded = fold_text(text)
    seen: set[tuple[int, int]] = set()
    entities: list[Entity] = []

    for match in _FORMATTED.finditer(folded):
        raw = text[match.start() : match.end()]
        if is_valid(raw):
            seen.add((match.start(), match.end()))
            entities.append(
                Entity(
                    type=EntityType.UNZR,
                    start=match.start(),
                    end=match.end(),
                    value=raw,
                    source=Source.RULE,
                )
            )

    for start, end, digits in iter_digit_groups(text, 13):
        if (start, end) in seen:
            continue
        if is_valid(digits):
            entities.append(
                Entity(
                    type=EntityType.UNZR,
                    start=start,
                    end=end,
                    value=text[start:end],
                    source=Source.RULE,
                )
            )
    return entities
