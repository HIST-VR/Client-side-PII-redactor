"""УНЗР — unique record number in the Unified State Demographic Register.

Format: YYYYMMDD-XXXXC (13 digits, hyphen after the date).
Check digit: ICAO Doc 9303 MRZ, weights 7-3-1 repeating, sum mod 10.

Worked example from the official calculation annex: 19550212-01110.
See docs/sources.md.
"""

from __future__ import annotations

from datetime import date

from ua_pii.textutil import fold_text, only_digits

WEIGHTS_12 = (7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1)
MIN_BIRTH = date(1900, 1, 1)


def compact(value: str) -> str:
    return only_digits(value)


def calc_check_digit(first12: str) -> str:
    if len(first12) != 12 or not first12.isdigit():
        raise ValueError("need 12 digits")
    total = sum(w * int(d) for w, d in zip(WEIGHTS_12, first12, strict=True))
    return str(total % 10)


def checksum_valid(value: str) -> bool:
    digits = compact(value)
    if len(digits) != 13:
        return False
    return digits[12] == calc_check_digit(digits[:12])


def encoded_birth_date(value: str) -> date | None:
    digits = compact(value)
    if len(digits) != 13:
        return None
    year, month, day = int(digits[0:4]), int(digits[4:6]), int(digits[6:8])
    try:
        return date(year, month, day)
    except ValueError:
        return None


def is_valid(value: str, today: date | None = None) -> bool:
    if not checksum_valid(value):
        return False
    dob = encoded_birth_date(value)
    if dob is None:
        return False
    limit = today or date.today()
    if not (MIN_BIRTH <= dob <= limit):
        return False
    serial = int(compact(value)[8:12])
    return 1 <= serial <= 9999


def looks_formatted(value: str) -> bool:
    """Official display form: 8 digits, hyphen, 5 digits."""
    folded = fold_text(value).strip()
    return len(folded) == 14 and folded[8] == "-" and compact(folded) == folded[:8] + folded[9:]


def generate(dob: date, serial: int) -> str:
    if not (1 <= serial <= 9999):
        raise ValueError("serial must be 0001–9999")
    first12 = f"{dob.strftime('%Y%m%d')}{serial:04d}"
    return f"{first12[:8]}-{first12[8:]}{calc_check_digit(first12)}"
