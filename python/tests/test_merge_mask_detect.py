from __future__ import annotations

from datetime import date

from ua_pii.detect import detect
from ua_pii.mask import MaskMode, mask
from ua_pii.merge import merge
from ua_pii.types import Entity, EntityType, Source
from ua_pii.validators.iban import generate as gen_iban
from ua_pii.validators.rnokpp import generate as gen_rnokpp
from ua_pii.validators.unzr import generate as gen_unzr


def _e(typ: EntityType, start: int, end: int, value: str) -> Entity:
    return Entity(type=typ, start=start, end=end, value=value, source=Source.RULE)


def test_iban_beats_card_inside_same_digits() -> None:
    iban = gen_iban("305299", "4242424242424242")
    # 16-digit Luhn-valid payload sits inside the IBAN account.
    text = f"рахунок {iban}"
    entities = detect(text)
    types = {e.type for e in entities}
    assert EntityType.IBAN in types
    assert EntityType.CARD not in types


def test_nested_address_keeps_inner_iban() -> None:
    iban_ent = _e(EntityType.IBAN, 20, 49, "X" * 29)
    addr = _e(EntityType.ADDRESS, 0, 60, "addr")
    merged = merge([iban_ent, addr])
    types = {e.type for e in merged}
    assert types == {EntityType.IBAN, EntityType.ADDRESS}


def test_partial_overlap_drops_address() -> None:
    phone = _e(EntityType.PHONE, 10, 22, "0501234567")
    addr = _e(EntityType.ADDRESS, 15, 40, "addr")
    merged = merge([phone, addr])
    assert [e.type for e in merged] == [EntityType.PHONE]


def test_same_type_keeps_longer() -> None:
    a = _e(EntityType.PHONE, 0, 10, "a")
    b = _e(EntityType.PHONE, 0, 13, "abc")
    merged = merge([a, b])
    assert merged == [b]


def test_placeholder_and_partial_and_pseudonym() -> None:
    number = gen_rnokpp(date(1992, 5, 1), 17)
    text = f"ІПН {number} ще раз {number}"
    entities = detect(text)
    assert len(entities) == 2
    assert mask(text, entities, MaskMode.PLACEHOLDER).count("[RNOKPP]") == 2
    partial = mask(text, entities, MaskMode.PARTIAL)
    assert number[-4:] in partial
    assert number[:6] not in partial
    pseudo = mask(text, entities, MaskMode.PSEUDONYM)
    assert pseudo.count("RNOKPP_1") == 2
    assert "RNOKPP_2" not in pseudo


def test_detect_mixed_message() -> None:
    iban = gen_iban("320313", "999")
    unzr = gen_unzr(date(1988, 12, 1), 3)
    phone = "+380 67 111 22 33"
    text = (
        f"Добрий день, я Олена. Тел. {phone}, IBAN {iban}, "
        f"УНЗР {unzr}, email olena@example.com. "
        f"Паспорт АА123456. Народилась 01.12.1988. "
        f"Адреса: вул. Садова, буд. 4."
    )
    entities = detect(text)
    types = {e.type for e in entities}
    assert EntityType.PHONE in types
    assert EntityType.IBAN in types
    assert EntityType.UNZR in types
    assert EntityType.EMAIL in types
    assert EntityType.PASSPORT in types
    assert EntityType.DOB in types
    assert EntityType.ADDRESS in types


def test_type_filter() -> None:
    text = "email a@b.com and +380501234567"
    entities = detect(text, types={EntityType.EMAIL})
    assert [e.type for e in entities] == [EntityType.EMAIL]


def test_id_card_not_flagged_without_context_in_detect() -> None:
    text = "сума 001234567 грн"
    assert all(e.type is not EntityType.PASSPORT for e in detect(text))
