from __future__ import annotations

from ua_pii.textutil import iter_digit_groups_range
from ua_pii.types import Entity, EntityType, Source
from ua_pii.validators.luhn import checksum_valid


def find_cards(text: str) -> list[Entity]:
    entities: list[Entity] = []
    for start, end, digits in iter_digit_groups_range(text, 13, 19):
        grouped = end - start != len(digits)
        # Ungrouped runs: only 16-digit PANs. Grouped 13–19 that pass Luhn.
        if not grouped and len(digits) != 16:
            continue
        if checksum_valid(digits):
            entities.append(
                Entity(
                    type=EntityType.CARD,
                    start=start,
                    end=end,
                    value=text[start:end],
                    source=Source.RULE,
                )
            )
    return entities
