"""РНОКПП / ІПН (10-digit Ukrainian individual tax number).

Weights [-1, 5, 7, 9, 4, 6, 10, 5, 7] on the first nine digits;
check digit = (sum % 11) % 10.

Digits 1–5 encode days since 1899-12-31. That date check is extra FP control,
not part of the statutory checksum. See docs/sources.md.
"""

from __future__ import annotations

from datetime import date, timedelta

from ua_pii.textutil import only_digits

WEIGHTS = (-1, 5, 7, 9, 4, 6, 10, 5, 7)
EPOCH = date(1899, 12, 31)
MIN_BIRTH = date(1920, 1, 1)


def _digits10(value: str) -> str | None:
    digits = only_digits(value)
    if len(digits) != 10:
        return None
    return digits


def calc_check_digit(first9: str) -> str:
    if len(first9) != 9 or not first9.isdigit():
        raise ValueError("need 9 digits")
    total = sum(w * int(d) for w, d in zip(WEIGHTS, first9, strict=True))
    return str((total % 11) % 10)


def checksum_valid(value: str) -> bool:
    digits = _digits10(value)
    if digits is None:
        return False
    return digits[9] == calc_check_digit(digits[:9])


def encoded_birth_date(value: str) -> date | None:
    digits = _digits10(value)
    if digits is None:
        return None
    days = int(digits[:5])
    try:
        return EPOCH + timedelta(days=days)
    except OverflowError:
        return None


def is_valid(value: str, today: date | None = None) -> bool:
    """Checksum plus a plausible encoded date of birth."""
    if not checksum_valid(value):
        return False
    dob = encoded_birth_date(value)
    if dob is None:
        return False
    limit = today or date.today()
    return MIN_BIRTH <= dob <= limit


def generate(dob: date, sequence: int) -> str:
    """`sequence` is the 4-digit block (digits 6–9). 9th digit encodes sex: odd=male."""
    if not (0 <= sequence <= 9999):
        raise ValueError("sequence must be 0–9999")
    days = (dob - EPOCH).days
    if days < 0 or days > 99999:
        raise ValueError("date out of 5-digit day range")
    first9 = f"{days:05d}{sequence:04d}"
    return first9 + calc_check_digit(first9)
