from __future__ import annotations

from collections import defaultdict
from enum import StrEnum

from ua_pii.textutil import fold_text, only_digits
from ua_pii.types import Entity, EntityType


class MaskMode(StrEnum):
    PLACEHOLDER = "placeholder"
    PARTIAL = "partial"
    PSEUDONYM = "pseudonym"


_PLACEHOLDER = {
    EntityType.PERSON: "[PERSON]",
    EntityType.PHONE: "[PHONE]",
    EntityType.IBAN: "[IBAN]",
    EntityType.CARD: "[CARD]",
    EntityType.RNOKPP: "[RNOKPP]",
    EntityType.EDRPOU: "[EDRPOU]",
    EntityType.PASSPORT: "[PASSPORT]",
    EntityType.UNZR: "[UNZR]",
    EntityType.EMAIL: "[EMAIL]",
    EntityType.ADDRESS: "[ADDRESS]",
    EntityType.DOB: "[DOB]",
}


def mask(text: str, entities: list[Entity], mode: MaskMode = MaskMode.PLACEHOLDER) -> str:
    if not entities:
        return text
    # Apply from the right so earlier offsets stay valid.
    ordered = sorted(entities, key=lambda e: e.start, reverse=True)
    counters: dict[EntityType, int] = defaultdict(int)
    aliases: dict[tuple[EntityType, str], str] = {}
    result = text
    # Pseudonyms must be stable left-to-right, so pre-assign in reading order.
    if mode is MaskMode.PSEUDONYM:
        for entity in sorted(entities, key=lambda e: e.start):
            key = (entity.type, _norm_key(entity))
            if key not in aliases:
                counters[entity.type] += 1
                aliases[key] = f"{entity.type.value}_{counters[entity.type]}"
    for entity in ordered:
        replacement = _replace(entity, mode, aliases)
        result = result[: entity.start] + replacement + result[entity.end :]
    return result


def _replace(
    entity: Entity,
    mode: MaskMode,
    aliases: dict[tuple[EntityType, str], str],
) -> str:
    if mode is MaskMode.PLACEHOLDER:
        return _PLACEHOLDER[entity.type]
    if mode is MaskMode.PSEUDONYM:
        return aliases[(entity.type, _norm_key(entity))]
    return _partial(entity)


def _norm_key(entity: Entity) -> str:
    folded = fold_text(entity.value).casefold()
    digits = only_digits(folded)
    if entity.type in {
        EntityType.PHONE,
        EntityType.IBAN,
        EntityType.CARD,
        EntityType.RNOKPP,
        EntityType.EDRPOU,
        EntityType.UNZR,
    }:
        return digits
    return " ".join(folded.split())


def _partial(entity: Entity) -> str:
    if entity.type is EntityType.EMAIL:
        return _partial_email(entity.value)
    if entity.type is EntityType.PERSON:
        return _partial_name(entity.value)
    if entity.type is EntityType.ADDRESS:
        return "[ADDRESS]"
    if entity.type is EntityType.DOB:
        return "[DOB]"
    digits = only_digits(entity.value)
    if len(digits) >= 4:
        return "*" * (len(digits) - 4) + digits[-4:]
    return _PLACEHOLDER[entity.type]


def _partial_email(value: str) -> str:
    local, _, domain = value.partition("@")
    if not domain:
        return "[EMAIL]"
    head = local[:1] if local else "*"
    return f"{head}***@{domain}"


def _partial_name(value: str) -> str:
    parts = value.split()
    masked = []
    for part in parts:
        if not part:
            continue
        masked.append(part[0] + "*" * max(1, len(part) - 1))
    return " ".join(masked) if masked else "[PERSON]"
