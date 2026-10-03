from __future__ import annotations

from ua_pii.validators.iban import compact, generate, is_valid, mod97


def test_generated_iban_is_valid() -> None:
    iban = generate("305299", "26002661176318")
    assert len(compact(iban)) == 29
    assert iban.startswith("UA")
    assert is_valid(iban)


def test_spaces_and_lowercase() -> None:
    iban = generate("320313", "123456789012345")
    grouped = " ".join(iban[i : i + 4] for i in range(0, len(iban), 4))
    assert is_valid(grouped)
    assert is_valid(iban.lower())


def test_wrong_length() -> None:
    assert not is_valid("UA00")
    assert not is_valid("UA" + "0" * 30)


def test_wrong_country() -> None:
    ua = generate("305299", "1")
    assert not is_valid("DE" + ua[2:])


def test_bad_checksum() -> None:
    iban = generate("305299", "1")
    mutated = iban[:2] + ("00" if iban[2:4] != "00" else "01") + iban[4:]
    assert not is_valid(mutated)


def test_mod97_chunked_matches_int() -> None:
    numeric = "1312312321321321"
    assert mod97(numeric) == int(numeric) % 97


def test_non_digit_account_rejected() -> None:
    iban = generate("305299", "1")
    broken = iban[:10] + "X" + iban[11:]
    assert not is_valid(broken)
