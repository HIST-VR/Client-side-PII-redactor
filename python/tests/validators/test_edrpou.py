from __future__ import annotations

from ua_pii.validators.edrpou import calc_check_digit, checksum_valid, generate, is_valid


def test_stdnum_vector(fixtures: dict) -> None:
    assert checksum_valid(fixtures["edrpou"]["valid"][0])
    assert is_valid("32855961")


def test_invalid_checksum(fixtures: dict) -> None:
    for number in fixtures["edrpou"]["invalid_checksum"]:
        assert not checksum_valid(number)


def test_invalid_length(fixtures: dict) -> None:
    for number in fixtures["edrpou"]["invalid_length"]:
        assert not checksum_valid(number)


def test_alt_weights_for_30m_range() -> None:
    # First digit 3 uses weights [7,1,2,3,4,5,6].
    number = generate("3285596")
    assert number[0] == "3"
    assert checksum_valid(number)
    assert number[-1] == calc_check_digit("3285596")


def test_base_weights_and_retry_when_mod_is_10() -> None:
    # Search a first-7 that needs the +2 retry (remainder >= 10).
    found_retry = False
    for stem in range(1000000, 1000000 + 5000):
        first7 = f"{stem:07d}"
        if first7[0] in "345":
            continue
        weights = (1, 2, 3, 4, 5, 6, 7)
        total = sum(w * int(d) for w, d in zip(weights, first7, strict=True))
        if total % 11 >= 10:
            number = generate(first7)
            assert checksum_valid(number)
            found_retry = True
            break
    assert found_retry


def test_spaces() -> None:
    assert checksum_valid("3285 5961")
