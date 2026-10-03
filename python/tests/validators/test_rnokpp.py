from __future__ import annotations

from datetime import date

from ua_pii.validators.rnokpp import (
    calc_check_digit,
    checksum_valid,
    encoded_birth_date,
    generate,
    is_valid,
)


def test_stdnum_and_wikipedia_vectors(fixtures: dict) -> None:
    for number in fixtures["rnokpp"]["valid"]:
        assert checksum_valid(number)
        assert is_valid(number, today=date(2026, 10, 3))


def test_invalid_checksum(fixtures: dict) -> None:
    for number in fixtures["rnokpp"]["invalid_checksum"]:
        assert not checksum_valid(number)
        assert not is_valid(number)


def test_invalid_length_and_format(fixtures: dict) -> None:
    for number in fixtures["rnokpp"]["invalid_length"]:
        assert not checksum_valid(number)
    for number in fixtures["rnokpp"]["invalid_format"]:
        assert not checksum_valid(number)


def test_spaces_stripped() -> None:
    assert checksum_valid("1759 0137 76")
    assert checksum_valid("1759-013776")


def test_generate_roundtrip() -> None:
    number = generate(date(1991, 8, 24), 1235)
    assert len(number) == 10
    assert checksum_valid(number)
    assert is_valid(number, today=date(2026, 10, 3))
    assert encoded_birth_date(number) == date(1991, 8, 24)
    assert number[9] == calc_check_digit(number[:9])


def test_implausible_old_date_fails_is_valid_not_checksum() -> None:
    # Days=1 → 1900-01-01, before our 1920 floor.
    first9 = "000010001"
    number = first9 + calc_check_digit(first9)
    assert checksum_valid(number)
    assert not is_valid(number, today=date(2026, 10, 3))


def test_future_encoded_date_rejected() -> None:
    number = generate(date(2090, 1, 1), 11)
    assert checksum_valid(number)
    assert not is_valid(number, today=date(2026, 10, 3))


def test_wikipedia_birth_date() -> None:
    # 3184710691 — Wikipedia / inn-parser example, 1987-03-12.
    assert encoded_birth_date("3184710691") == date(1987, 3, 12)
