from __future__ import annotations

from ua_pii.validators.luhn import checksum_valid, generate


def test_stripe_test_pans(fixtures: dict) -> None:
    for pan in fixtures["luhn"]["valid"]:
        assert checksum_valid(pan)


def test_invalid_checksum(fixtures: dict) -> None:
    for pan in fixtures["luhn"]["invalid_checksum"]:
        assert not checksum_valid(pan)


def test_invalid_length(fixtures: dict) -> None:
    for pan in fixtures["luhn"]["invalid_length"]:
        assert not checksum_valid(pan)


def test_grouped_digits() -> None:
    assert checksum_valid("4242 4242 4242 4242")
    assert checksum_valid("4242-4242-4242-4242")


def test_generate_roundtrip() -> None:
    pan = generate("424242424242424")
    assert len(pan) == 16
    assert checksum_valid(pan)


def test_fullwidth_digits() -> None:
    # ４ is U+FF14
    fullwidth = "".join(chr(0xFF10 + int(ch)) for ch in "4242424242424242")
    assert checksum_valid(fullwidth)
