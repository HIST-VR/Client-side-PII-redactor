from __future__ import annotations

from datetime import date

from ua_pii.validators.unzr import (
    calc_check_digit,
    checksum_valid,
    encoded_birth_date,
    generate,
    is_valid,
)


def test_official_worked_example(fixtures: dict) -> None:
    number = fixtures["unzr"]["valid"][0]
    assert number == "19550212-01110"
    assert checksum_valid(number)
    assert is_valid(number, today=date(2026, 10, 3))
    assert encoded_birth_date(number) == date(1955, 2, 12)
    assert calc_check_digit("195502120111") == "0"


def test_invalid_checksum(fixtures: dict) -> None:
    for number in fixtures["unzr"]["invalid_checksum"]:
        assert not checksum_valid(number)
        assert not is_valid(number)


def test_impossible_date(fixtures: dict) -> None:
    for number in fixtures["unzr"]["invalid_date"]:
        assert not is_valid(number)


def test_generate_roundtrip() -> None:
    number = generate(date(1991, 8, 24), 1)
    assert number.startswith("19910824-")
    assert len(number) == 14
    assert is_valid(number, today=date(2026, 10, 3))
    assert checksum_valid(number.replace("-", ""))


def test_compact_13_digits() -> None:
    assert is_valid("1955021201110", today=date(2026, 10, 3))


def test_serial_zero_rejected() -> None:
    first12 = "199108240000"
    number = first12 + calc_check_digit(first12)
    assert checksum_valid(number)
    assert not is_valid(number, today=date(2026, 10, 3))
