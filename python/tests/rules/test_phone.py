from __future__ import annotations

from ua_pii.rules.phone import find_phones


def _values(text: str) -> list[str]:
    return [e.value for e in find_phones(text)]


def test_international_and_national() -> None:
    assert _values("Передзвоніть +380501234567") == ["+380501234567"]
    assert _values("Мій номер 0501234567") == ["0501234567"]


def test_grouped_formats() -> None:
    assert _values("тел. +380 50 123 45 67") == ["+380 50 123 45 67"]
    assert _values("тел. (050) 123-45-67") == ["(050) 123-45-67"]
    assert _values("00 380 50 123 45 67") == ["00 380 50 123 45 67"]


def test_nbsp_and_dash_variants() -> None:
    text = "+380\u00a050\u2013123\u201345\u201367"
    found = find_phones(text)
    assert len(found) == 1
    assert found[0].start == 0


def test_not_a_random_digit_run() -> None:
    assert find_phones("код 1234567890") == []
    assert find_phones("380") == []
