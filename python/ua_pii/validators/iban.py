"""UA IBAN: ISO 13616 / ISO 7064 MOD-97-10.

Ukrainian IBANs are 29 characters: UA + 2 check digits + 6-digit NBU ID + 19-digit account.
See docs/sources.md.
"""

from __future__ import annotations

from ua_pii.textutil import fold_text

UA_IBAN_LENGTH = 29


def compact(value: str) -> str:
    folded = fold_text(value).upper()
    return "".join(ch for ch in folded if ch.isalnum())


def _to_numeric(s: str) -> str:
    parts: list[str] = []
    for ch in s:
        if ch.isdigit():
            parts.append(ch)
        elif "A" <= ch <= "Z":
            parts.append(str(ord(ch) - 55))  # A=10
        else:
            raise ValueError(f"non-alphanumeric IBAN character: {ch!r}")
    return "".join(parts)


def mod97(numeric: str) -> int:
    """Chunked remainder so the TypeScript port can match without BigInt surprises."""
    remainder = 0
    for ch in numeric:
        remainder = (remainder * 10 + (ord(ch) - 48)) % 97
    return remainder


def check_remainder(compacted: str) -> int:
    rearranged = compacted[4:] + compacted[:4]
    return mod97(_to_numeric(rearranged))


def is_valid(value: str) -> bool:
    compacted = compact(value)
    if len(compacted) != UA_IBAN_LENGTH:
        return False
    if not compacted.startswith("UA"):
        return False
    if not compacted[2:].isdigit():
        return False
    return check_remainder(compacted) == 1


def generate(nbu_id: str, account: str) -> str:
    """Build a checksum-valid UA IBAN. `account` is padded to 19 digits on the left."""
    if not (nbu_id.isdigit() and len(nbu_id) == 6):
        raise ValueError("nbu_id must be 6 digits")
    if not account.isdigit() or len(account) > 19:
        raise ValueError("account must be 1–19 digits")
    bban = nbu_id + account.zfill(19)
    # Check digits are computed with UA00 as a placeholder.
    remainder = check_remainder("UA00" + bban)
    check = 98 - remainder
    return f"UA{check:02d}{bban}"
