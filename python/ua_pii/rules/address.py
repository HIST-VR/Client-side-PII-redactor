"""Best-effort Ukrainian (and mixed) street addresses. High recall is not the goal."""

from __future__ import annotations

import re

from ua_pii.textutil import fold_text
from ua_pii.types import Entity, EntityType, Source

_STREET_START = re.compile(
    r"(?:вул(?:иця|\.)|просп(?:ект|\.)|бульв(?:ар|\.)|пров(?:улок|\.)|"
    r"пл(?:оща|\.)|майдан|шосе|набережна|"
    r"street|str\.|avenue|ave\.)\s+",
    re.IGNORECASE,
)

_NAME = re.compile(
    r"[A-ZА-ЯІЇЄҐЁ][A-Za-zА-Яа-яІіЇїЄєҐґё''\-]{1,40}"
)

_BUILDING = re.compile(
    r"(?:\s*,\s*|\s+)(?:буд(?:инок|\.)|house|h\.)?\s*\d+\w?"
    r"(?:(?:\s*,\s*|\s+)(?:кв(?:артира|\.)|apt\.?)\s*\d+)?",
    re.IGNORECASE,
)


def find_addresses(text: str) -> list[Entity]:
    folded = fold_text(text)
    entities: list[Entity] = []
    for start_m in _STREET_START.finditer(folded):
        name_m = _NAME.match(folded, start_m.end())
        if not name_m:
            continue
        end = name_m.end()
        extra = _BUILDING.match(folded, end)
        if extra:
            end = extra.end()
        while end > start_m.start() and folded[end - 1] in " \t,":
            end -= 1
        if end - start_m.start() < 8:
            continue
        entities.append(
            Entity(
                type=EntityType.ADDRESS,
                start=start_m.start(),
                end=end,
                value=text[start_m.start() : end],
                source=Source.RULE,
            )
        )
    return entities
