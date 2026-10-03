from __future__ import annotations

from ua_pii.rules.address import find_addresses
from ua_pii.rules.dob import find_dobs
from ua_pii.rules.passport import find_passports


def test_booklet_cyrillic_and_latin_lookalikes() -> None:
    found = find_passports("паспорт АА123456 виданий у Києві")
    assert len(found) == 1
    assert found[0].subtype == "booklet"
    assert found[0].value == "АА123456"

    latin = find_passports("passport AA123456")
    assert len(latin) == 1
    assert latin[0].value == "AA123456"

    assert find_passports("code QZ123456") == []


def test_booklet_with_hyphen() -> None:
    found = find_passports("серія КМ-654321")
    assert found[0].value == "КМ-654321"


def test_id_card_requires_context() -> None:
    assert find_passports("номер 001234567 в системі") == []
    found = find_passports("ID-картка, документ № 001234567")
    assert len(found) == 1
    assert found[0].subtype == "id_card"
    assert found[0].value == "001234567"


def test_dob_requires_context_and_valid_calendar() -> None:
    assert find_dobs("оплата 12.03.2024 на рахунок") == []
    found = find_dobs("Клієнт народився 12.03.1990 у Львові")
    assert [e.value for e in found] == ["12.03.1990"]

    named = find_dobs("дата народження 12 січня 1990")
    assert named[0].value == "12 січня 1990"

    assert find_dobs("народився 31.02.1990") == []


def test_iso_dob() -> None:
    found = find_dobs("DOB 1990-01-15")
    assert found[0].value == "1990-01-15"


def test_address_street() -> None:
    text = "Проживає за адресою вул. Хрещатик, буд. 22, кв. 15"
    found = find_addresses(text)
    assert found
    assert "Хрещатик" in found[0].value
    assert "22" in found[0].value
    assert find_addresses("просто розмова без вулиці") == []
