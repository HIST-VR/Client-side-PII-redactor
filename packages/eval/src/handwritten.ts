import { EntityType, generateIban, generateUnzr } from "@ua-pii/core";
import { assignSplit, fill } from "./fill.ts";
import { group4, slot, utcDate } from "./synthetic.ts";
import type { GoldDoc } from "./types.ts";

function iban(nbu: string, account: string, grouped = false): string {
  const value = generateIban(nbu, account);
  return grouped ? group4(value) : value;
}

function unzr(year: number, month: number, day: number, serial: number, hyphen = true): string {
  const value = generateUnzr(utcDate(year, month, day), serial);
  return hyphen ? value : value.replace("-", "");
}

/**
 * Hand-written realistic messages with fake PII.
 * Spans come from `{slot}` substitution so offsets are not counted by hand.
 */
const CASES: { id: string; template: string; slots: Record<string, ReturnType<typeof slot>> }[] = [
  {
    id: "hw-001",
    template:
      "Добрий день, мене звати {person}. Загубила картку, тел. {phone}.",
    slots: {
      person: slot(EntityType.PERSON, "Олена Коваленко"),
      phone: slot(EntityType.PHONE, "+380 67 111 22 33"),
    },
  },
  {
    id: "hw-002",
    template:
      "Шановний {person}, зарахування 2 450.00 грн на {iban} виконано.",
    slots: {
      person: slot(EntityType.PERSON, "Іване Петренку"),
      iban: slot(EntityType.IBAN, iban("305299", "1")),
    },
  },
  {
    id: "hw-003",
    template: "Передайте документи {person} до відділення.",
    slots: { person: slot(EntityType.PERSON, "Марії Мельник") },
  },
  {
    id: "hw-004",
    template: "Support chat: client {person}, email {email}, phone {phone}.",
    slots: {
      person: slot(EntityType.PERSON, "Andrii Bondarenko"),
      email: slot(EntityType.EMAIL, "andrii.bondarenko@example.com"),
      phone: slot(EntityType.PHONE, "+380501234567"),
    },
  },
  {
    id: "hw-005",
    template: "Перезвоните, пожалуйста, на {phone} после 18:00.",
    slots: { phone: slot(EntityType.PHONE, "050-123-45-67") },
  },
  {
    id: "hw-006",
    template: "IBAN для оплати: {iban}",
    slots: { iban: slot(EntityType.IBAN, iban("305299", "1", true)) },
  },
  {
    id: "hw-007",
    template: "Картка {card} (Visa). Якщо це не ви — заблокуйте в додатку.",
    slots: { card: slot(EntityType.CARD, "4242 4242 4242 4242") },
  },
  {
    id: "hw-008",
    template: "ІПН {rnokpp} внесено в анкету. Дата народження {dob}.",
    slots: {
      rnokpp: slot(EntityType.RNOKPP, "3184710691"),
      dob: slot(EntityType.DOB, "12.03.1987"),
    },
  },
  {
    id: "hw-009",
    template: "ЄДРПОУ отримувача {edrpou}, призначення платежу: оренда.",
    slots: { edrpou: slot(EntityType.EDRPOU, "32855961") },
  },
  {
    id: "hw-010",
    template: "Паспорт {passport}, виданий Шевченківським РВ УМВС.",
    slots: { passport: slot(EntityType.PASSPORT, "АА123456") },
  },
  {
    id: "hw-011",
    template: "passport series {passport} (Latin lookalikes of АА).",
    slots: { passport: slot(EntityType.PASSPORT, "AA123456") },
  },
  {
    id: "hw-012",
    template: "ID-картка, документ № {passport}. УНЗР {unzr}.",
    slots: {
      passport: slot(EntityType.PASSPORT, "001234567"),
      unzr: slot(EntityType.UNZR, "19550212-01110"),
    },
  },
  {
    id: "hw-013",
    template: "Проживає: {address}. Народилась {dob}.",
    slots: {
      address: slot(EntityType.ADDRESS, "вул. Хрещатик, буд. 22, кв. 15"),
      dob: slot(EntityType.DOB, "12 січня 1990"),
    },
  },
  {
    id: "hw-014",
    template: "Виписка: 12.03.2024 оплата 1 200.00 грн, код квитанції 1234567890.",
    slots: {},
  },
  {
    id: "hw-015",
    template: "Сума 32855968 грн (вісім цифр, невалідний ЄДРПОУ).",
    slots: {},
  },
  {
    id: "hw-016",
    template: "Замовлення QZ123456 відвантажено, трек 001234567.",
    slots: {},
  },
  {
    id: "hw-017",
    template: "Народився {dob} р., паспорт {passport}.",
    slots: {
      dob: slot(EntityType.DOB, "01.12.1988"),
      passport: slot(EntityType.PASSPORT, "КМ-654321"),
    },
  },
  {
    id: "hw-018",
    template: "тел. {phone}, резерв {phone2}.",
    slots: {
      phone: slot(EntityType.PHONE, "(067) 111-22-33"),
      phone2: slot(EntityType.PHONE, "+380 93 000 11 22"),
    },
  },
  {
    id: "hw-019",
    template: "Запис № {unzr} у демографічному реєстрі.",
    slots: { unzr: slot(EntityType.UNZR, unzr(1991, 8, 24, 1)) },
  },
  {
    id: "hw-020",
    template: "compact UNZR {unzr} without hyphen.",
    slots: { unzr: slot(EntityType.UNZR, unzr(1991, 8, 24, 1, false)) },
  },
  {
    id: "hw-021",
    template: "Hi {person}, wire to {iban} and ping me at {email}.",
    slots: {
      person: slot(EntityType.PERSON, "Yulia Tkachenko"),
      iban: slot(EntityType.IBAN, iban("322313", "9999")),
      email: slot(EntityType.EMAIL, "yulia.tkachenko+ops@example.org"),
    },
  },
  {
    id: "hw-022",
    template: "Клієнт {person} надав РНОКПП {rnokpp} з пробілами.",
    slots: {
      person: slot(EntityType.PERSON, "Сергій Олійник"),
      rnokpp: slot(EntityType.RNOKPP, "3184 7106 91"),
    },
  },
  {
    id: "hw-023",
    template: "Картка ****4242, повний номер {card}.",
    slots: { card: slot(EntityType.CARD, "4111111111111111") },
  },
  {
    id: "hw-024",
    template: "DOB {dob} / passport id-card {passport}.",
    slots: {
      dob: slot(EntityType.DOB, "1990-01-15"),
      passport: slot(EntityType.PASSPORT, "987654321"),
    },
  },
  {
    id: "hw-025",
    template: "номер 987654321 в системі обліку посилок (не паспорт).",
    slots: {},
  },
  {
    id: "hw-026",
    template: "Адреса доставки: {address}",
    slots: { address: slot(EntityType.ADDRESS, "просп. Миру, буд. 8") },
  },
  {
    id: "hw-027",
    template: "Будь ласка, виправте ІПН: було 1759013770 (контрольна цифра не сходиться).",
    slots: {},
  },
  {
    id: "hw-028",
    template: "Платіж 12.01.2026, рахунок одержувача {iban}, ЄДРПОУ {edrpou}.",
    slots: {
      iban: slot(EntityType.IBAN, iban("300335", "123456789")),
      edrpou: slot(EntityType.EDRPOU, "14360570"),
    },
  },
  {
    id: "hw-029",
    template: "Звернення від {person}: «мені надіслали смс на {phone}».",
    slots: {
      person: slot(EntityType.PERSON, "Катерини Бондаренко"),
      phone: slot(EntityType.PHONE, "0631234567"),
    },
  },
  {
    id: "hw-030",
    template: "Statement: -150.00 UAH POS UA KYIV {card}",
    slots: { card: slot(EntityType.CARD, "4242424242424242") },
  },
  {
    id: "hw-031",
    template: "Паспорт громадянина України {passport}, латинські літери як кирилиця.",
    slots: { passport: slot(EntityType.PASSPORT, "KM654321") },
  },
  {
    id: "hw-032",
    template: "Код товару AB12CD34, сума 1000 грн, без ПІБ.",
    slots: {},
  },
  {
    id: "hw-033",
    template: "Напишіть на {email} або зателефонуйте {phone}.",
    slots: {
      email: slot(EntityType.EMAIL, "support.client@example.com"),
      phone: slot(EntityType.PHONE, "+380 50 999 88 77"),
    },
  },
  {
    id: "hw-034",
    template: "УНЗР 19550212-01111 не збігається з датою в паспорті — перевірте контрольну цифру.",
    slots: {},
  },
  {
    id: "hw-035",
    template: "дата народження {dob}; проживає {address}.",
    slots: {
      dob: slot(EntityType.DOB, "24 серпня 1991"),
      address: slot(EntityType.ADDRESS, "вул. Садова, буд. 4, кв. 12"),
    },
  },
  {
    id: "hw-036",
    template: "Для {person} відкрито рахунок {iban}.",
    slots: {
      person: slot(EntityType.PERSON, "Дмитра Кравченка"),
      iban: slot(EntityType.IBAN, iban("320313", "42")),
    },
  },
  {
    id: "hw-037",
    template: "{phone_old} більше не обслуговується, новий номер {phone}.",
    slots: {
      phone_old: slot(EntityType.PHONE, "00 380 50 222 33 44"),
      phone: slot(EntityType.PHONE, "+380 67 222 33 44"),
    },
  },
  {
    id: "hw-038",
    template: "ЄДРПОУ {edrpou} (пробіл усередині).",
    slots: { edrpou: slot(EntityType.EDRPOU, "3285 5961") },
  },
  {
    id: "hw-039",
    template: "Російською: родился {dob}, паспорт {passport}.",
    slots: {
      dob: slot(EntityType.DOB, "15.05.1979"),
      passport: slot(EntityType.PASSPORT, "НС112233"),
    },
  },
  {
    id: "hw-040",
    template: "Форма: ПІБ {person}; РНОКПП {rnokpp}; паспорт {passport}; УНЗР {unzr}.",
    slots: {
      person: slot(EntityType.PERSON, "Тарас Шевченко"),
      rnokpp: slot(EntityType.RNOKPP, "3184710691"),
      passport: slot(EntityType.PASSPORT, "ТН000111"),
      unzr: slot(EntityType.UNZR, unzr(1984, 3, 9, 21)),
    },
  },
  {
    id: "hw-041",
    template: "Немає персональних даних, лише курс USD/UAH 41.20 на 03.10.2026.",
    slots: {},
  },
  {
    id: "hw-042",
    template: "Клієнт народився {dob}, IBAN {iban}, карта {card}.",
    slots: {
      dob: slot(EntityType.DOB, "03.11.1995"),
      iban: slot(EntityType.IBAN, iban("351005", "777777")),
      card: slot(EntityType.CARD, "4242-4242-4242-4242"),
    },
  },
  {
    id: "hw-043",
    template: "Документ № {passport} (ID-картка без слова паспорт у тому ж реченні, але є документ №).",
    slots: { passport: slot(EntityType.PASSPORT, "110011001") },
  },
  {
    id: "hw-044",
    template: "Вулиця без номера будинку в тексті: зустрінемось біля парку, не адреса.",
    slots: {},
  },
  {
    id: "hw-045",
    template: "{person} просить надіслати виписку на {email} і зателефонувати {phone}.",
    slots: {
      person: slot(EntityType.PERSON, "Наталія Ткаченко"),
      email: slot(EntityType.EMAIL, "n.tkachenko@mail.test"),
      phone: slot(EntityType.PHONE, "+380731234567"),
    },
  },
  {
    id: "hw-046",
    template: "ІПН 1234567890 не проходить перевірку контрольної цифри, не маскувати як РНОКПП.",
    slots: {},
  },
  {
    id: "hw-047",
    template: "Анкета: серія і номер паспорта {passport}, дата народження {dob}.",
    slots: {
      passport: slot(EntityType.PASSPORT, "ВК888777"),
      dob: slot(EntityType.DOB, "28 лютого 1984"),
    },
  },
  {
    id: "hw-048",
    template: "Mixed: рахунок {iban}, ЕГРПОУ/ЄДРПОУ {edrpou}, tel {phone}.",
    slots: {
      iban: slot(EntityType.IBAN, iban("300335", "9876543210")),
      edrpou: slot(EntityType.EDRPOU, "32855961"),
      phone: slot(EntityType.PHONE, "+380991112233"),
    },
  },
];

export function handwrittenDocs(): GoldDoc[] {
  return CASES.map((c) => {
    const { text, entities } = fill(c.template, c.slots);
    return {
      id: c.id,
      split: assignSplit(c.id),
      source: "handwritten" as const,
      text,
      entities,
    };
  });
}
