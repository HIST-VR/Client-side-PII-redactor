from __future__ import annotations

from collections.abc import Callable

from ua_pii.merge import merge
from ua_pii.rules.address import find_addresses
from ua_pii.rules.card import find_cards
from ua_pii.rules.dob import find_dobs
from ua_pii.rules.edrpou import find_edrpou
from ua_pii.rules.email import find_emails
from ua_pii.rules.iban import find_ibans
from ua_pii.rules.passport import find_passports
from ua_pii.rules.phone import find_phones
from ua_pii.rules.rnokpp import find_rnokpp
from ua_pii.rules.unzr import find_unzr
from ua_pii.types import Entity, EntityType

Detector = Callable[[str], list[Entity]]

# PERSON is model-only; the rule layer does not emit it.
_DETECTORS: tuple[tuple[EntityType, Detector], ...] = (
    (EntityType.PHONE, find_phones),
    (EntityType.IBAN, find_ibans),
    (EntityType.CARD, find_cards),
    (EntityType.RNOKPP, find_rnokpp),
    (EntityType.EDRPOU, find_edrpou),
    (EntityType.PASSPORT, find_passports),
    (EntityType.UNZR, find_unzr),
    (EntityType.EMAIL, find_emails),
    (EntityType.ADDRESS, find_addresses),
    (EntityType.DOB, find_dobs),
)


def detect(
    text: str,
    *,
    types: set[EntityType] | None = None,
) -> list[Entity]:
    """Run the rule layer and merge overlaps. No model, no I/O."""
    found: list[Entity] = []
    for entity_type, detector in _DETECTORS:
        if types is not None and entity_type not in types:
            continue
        found.extend(detector(text))
    return merge(found)
