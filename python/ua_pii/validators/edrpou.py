"""ЄДРПОУ (8-digit legal-entity code).

Weights [1..7], or [7,1..6] when the first digit is 3, 4, or 5.
If sum % 11 is 10 or more, retry with every weight + 2.
See docs/sources.md and python-stdnum stdnum.ua.edrpou.
"""

from __future__ import annotations

from ua_pii.textutil import only_digits

BASE_WEIGHTS = (1, 2, 3, 4, 5, 6, 7)
ALT_WEIGHTS = (7, 1, 2, 3, 4, 5, 6)


def _digits8(value: str) -> str | None:
    digits = only_digits(value)
    if len(digits) != 8:
        return None
    return digits


def calc_check_digit(first7: str) -> str:
    if len(first7) != 7 or not first7.isdigit():
        raise ValueError("need 7 digits")
    weights = ALT_WEIGHTS if first7[0] in "345" else BASE_WEIGHTS
    total = sum(w * int(d) for w, d in zip(weights, first7, strict=True))
    remainder = total % 11
    if remainder < 10:
        return str(remainder)
    weights = tuple(w + 2 for w in weights)
    total = sum(w * int(d) for w, d in zip(weights, first7, strict=True))
    return str((total % 11) % 10)


def checksum_valid(value: str) -> bool:
    digits = _digits8(value)
    if digits is None:
        return False
    return digits[7] == calc_check_digit(digits[:7])


def is_valid(value: str) -> bool:
    return checksum_valid(value)


def generate(first7: str) -> str:
    if len(first7) != 7 or not first7.isdigit():
        raise ValueError("need 7 digits")
    return first7 + calc_check_digit(first7)
