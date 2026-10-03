from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class EntityType(StrEnum):
    PERSON = "PERSON"
    PHONE = "PHONE"
    IBAN = "IBAN"
    CARD = "CARD"
    RNOKPP = "RNOKPP"
    EDRPOU = "EDRPOU"
    PASSPORT = "PASSPORT"
    UNZR = "UNZR"
    EMAIL = "EMAIL"
    ADDRESS = "ADDRESS"
    DOB = "DOB"


class Source(StrEnum):
    RULE = "rule"
    MODEL = "model"


# Higher number wins on overlapping structured identifiers.
PRIORITY: dict[EntityType, int] = {
    EntityType.IBAN: 100,
    EntityType.CARD: 90,
    EntityType.UNZR: 85,
    EntityType.RNOKPP: 80,
    EntityType.EDRPOU: 80,
    EntityType.EMAIL: 75,
    EntityType.PHONE: 70,
    EntityType.PASSPORT: 60,
    EntityType.DOB: 50,
    EntityType.ADDRESS: 40,
    EntityType.PERSON: 30,
}

# May contain a structured identifier without being dropped.
CONTAINER_TYPES = frozenset({EntityType.ADDRESS, EntityType.PERSON})


@dataclass(frozen=True)
class Entity:
    type: EntityType
    start: int
    end: int
    value: str
    source: Source = Source.RULE
    subtype: str | None = None

    def __post_init__(self) -> None:
        if self.start < 0 or self.end < self.start:
            raise ValueError(f"invalid span [{self.start}, {self.end})")
