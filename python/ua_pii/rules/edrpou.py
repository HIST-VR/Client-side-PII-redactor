from __future__ import annotations

from ua_pii.textutil import iter_digit_groups
from ua_pii.types import Entity, EntityType, Source
from ua_pii.validators.edrpou import is_valid


def find_edrpou(text: str) -> list[Entity]:
    entities: list[Entity] = []
    for start, end, digits in iter_digit_groups(text, 8):
        if is_valid(digits):
            entities.append(
                Entity(
                    type=EntityType.EDRPOU,
                    start=start,
                    end=end,
                    value=text[start:end],
                    source=Source.RULE,
                )
            )
    return entities
