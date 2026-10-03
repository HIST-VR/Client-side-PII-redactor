from __future__ import annotations

import re

from ua_pii.textutil import fold_text
from ua_pii.types import Entity, EntityType, Source
from ua_pii.validators.iban import is_valid as is_valid_iban

# UA + 27 digits with optional spaces/hyphens between groups.
_IBAN_RE = re.compile(r"UA(?:[\s\-]*\d){27}", re.IGNORECASE)


def find_ibans(text: str) -> list[Entity]:
    folded = fold_text(text)
    entities: list[Entity] = []
    for match in _IBAN_RE.finditer(folded):
        raw = text[match.start() : match.end()]
        if is_valid_iban(raw):
            entities.append(
                Entity(
                    type=EntityType.IBAN,
                    start=match.start(),
                    end=match.end(),
                    value=raw,
                    source=Source.RULE,
                )
            )
    return entities
