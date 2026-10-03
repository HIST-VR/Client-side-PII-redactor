from __future__ import annotations

from datetime import date

from ua_pii.rules.card import find_cards
from ua_pii.rules.edrpou import find_edrpou
from ua_pii.rules.email import find_emails
from ua_pii.rules.iban import find_ibans
from ua_pii.rules.rnokpp import find_rnokpp
from ua_pii.rules.unzr import find_unzr
from ua_pii.validators.edrpou import generate as gen_edrpou
from ua_pii.validators.iban import generate as gen_iban
from ua_pii.validators.rnokpp import generate as gen_rnokpp
from ua_pii.validators.unzr import generate as gen_unzr


def test_iban_in_sentence() -> None:
    iban = gen_iban("305299", "26002661176318")
    text = f"Оплата на {iban} до кінця дня."
    found = find_ibans(text)
    assert len(found) == 1
    assert found[0].value == iban
    grouped = " ".join(iban[i : i + 4] for i in range(0, len(iban), 4))
    text2 = f"IBAN: {grouped}"
    assert find_ibans(text2)[0].value == grouped


def test_invalid_iban_ignored() -> None:
    iban = gen_iban("305299", "1")
    broken = iban[:4] + "00" + iban[6:]
    assert find_ibans(f"рахунок {broken}") == []


def test_rnokpp_valid_and_random_ten_digits() -> None:
    number = gen_rnokpp(date(1990, 1, 15), 2223)
    found = find_rnokpp(f"ІПН {number} в анкеті")
    assert [e.value for e in found] == [number]
    assert find_rnokpp("випадкові 1234567890 цифри") == []


def test_edrpou() -> None:
    code = gen_edrpou("1436057")
    assert find_edrpou(f"ЄДРПОУ {code}")[0].value == code
    # Checksum rejects a mutated copy of a valid code.
    assert find_edrpou(code[:-1] + ("0" if code[-1] != "0" else "1")) == []


def test_unzr_formatted_and_compact() -> None:
    number = gen_unzr(date(1991, 8, 24), 7)
    assert find_unzr(f"Запис № {number}")[0].value == number
    compact = number.replace("-", "")
    assert find_unzr(compact)[0].value == compact
    assert find_unzr("19910824-00000") == []  # serial 0 rejected


def test_card_grouped_and_ungrouped() -> None:
    pan = "4242424242424242"
    assert find_cards(f"картка {pan}")[0].value == pan
    grouped = "4242 4242 4242 4242"
    assert find_cards(grouped)[0].value == grouped
    assert find_cards("4242424242424243") == []
    # 13 ungrouped digits even if Luhn-valid are ignored.
    found = find_cards("1234567890123")
    assert all(len(e.value) >= 16 or " " in e.value or "-" in e.value for e in found)


def test_email() -> None:
    found = find_emails("Напишіть на iva.petrenko+ops@example.com будь ласка")
    assert found[0].value == "iva.petrenko+ops@example.com"
    assert find_emails("not-an-email@") == []
