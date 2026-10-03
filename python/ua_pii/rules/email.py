from __future__ import annotations

import re

from ua_pii.types import Entity, EntityType, Source

# Conservative practical pattern; not a full RFC 5322 parser.
_EMAIL_RE = re.compile(
    r"(?<![A-Za-z0-9._%+\-])"
    r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,24}"
    r"(?![A-Za-z0-9])"
)


def find_emails(text: str) -> list[Entity]:
    entities: list[Entity] = []
    for match in _EMAIL_RE.finditer(text):
        entities.append(
            Entity(
                type=EntityType.EMAIL,
                start=match.start(),
                end=match.end(),
                value=match.group(0),
                source=Source.RULE,
            )
        )
    return entities
