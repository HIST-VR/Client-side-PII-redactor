from __future__ import annotations

from ua_pii.textutil import iter_digit_groups
from ua_pii.types import Entity, EntityType, Source
from ua_pii.validators.rnokpp import is_valid


def find_rnokpp(text: str) -> list[Entity]:
    entities: list[Entity] = []
    for start, end, digits in iter_digit_groups(text, 10):
        if is_valid(digits):
            entities.append(
                Entity(
                    type=EntityType.RNOKPP,
                    start=start,
                    end=end,
                    value=text[start:end],
                    source=Source.RULE,
                )
            )
    return entities
