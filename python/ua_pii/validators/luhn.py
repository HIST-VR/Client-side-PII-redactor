"""ISO/IEC 7812 Luhn check digit (payment card PAN)."""

from __future__ import annotations

from ua_pii.textutil import only_digits


def checksum_valid(value: str) -> bool:
    digits = only_digits(value)
    if not (13 <= len(digits) <= 19):
        return False
    return _luhn_ok(digits)


def _luhn_ok(digits: str) -> bool:
    total = 0
    double = False
    for ch in reversed(digits):
        n = ord(ch) - 48
        if double:
            n *= 2
            if n > 9:
                n -= 9
        total += n
        double = not double
    return total % 10 == 0


def check_digit(payload: str) -> str:
    """Luhn check digit for a payload (PAN without the last digit)."""
    if not payload.isdigit():
        raise ValueError("payload must be digits")
    # Try 0–9; equivalently compute from doubled sum.
    body = payload + "0"
    total = 0
    double = False
    for ch in reversed(body):
        n = ord(ch) - 48
        if double:
            n *= 2
            if n > 9:
                n -= 9
        total += n
        double = not double
    return str((10 - (total % 10)) % 10)


def generate(payload: str) -> str:
    return payload + check_digit(payload)
