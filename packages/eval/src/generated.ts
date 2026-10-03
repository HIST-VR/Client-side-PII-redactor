import { EntityType, generateRnokpp, generateUnzr } from "@ua-pii/core";
import { assignSplit, fill } from "./fill.ts";
import {
  formatDob,
  int,
  makeAddress,
  makeBooklet,
  makeCard,
  makeEdrpou,
  makeEmail,
  makeIban,
  makeIdCard,
  makePerson,
  makePersonEn,
  makePhone,
  makeRnokpp,
  makeUnzr,
  mulberry32,
  mutateLastDigit,
  pick,
  randomDob,
  slot,
  type Rng,
} from "./synthetic.ts";
import type { GoldDoc, Slot } from "./types.ts";

/** Frozen seed so `npm run generate` is reproducible. */
export const GENERATED_SEED = 20261003;

function gid(family: string, i: number): string {
  return `gen-${family}-${String(i).padStart(3, "0")}`;
}

function doc(id: string, template: string, slots: Record<string, Slot>): GoldDoc {
  const { text, entities } = fill(template, slots);
  return { id, split: assignSplit(id), source: "generated", text, entities };
}

const PHONE_STYLES = ["plus", "national", "grouped", "parens"] as const;
const DOB_STYLES = ["dot", "iso", "uk"] as const;

export function generatedDocs(seed = GENERATED_SEED): GoldDoc[] {
  const rng = mulberry32(seed);
  return [
    ...familyKyc(rng, 30),
    ...familyPay(rng, 30),
    ...familyCard(rng, 24),
    ...familyContact(rng, 24),
    ...familyDocs(rng, 24),
    ...familyAddress(rng, 20),
    ...familyMixed(rng, 30),
    ...familyNegative(rng, 30),
    ...familyTraps(rng, 20),
  ];
}

function familyKyc(rng: Rng, n: number): GoldDoc[] {
  const out: GoldDoc[] = [];
  for (let i = 0; i < n; i++) {
    const dob = randomDob(rng);
    const person = makePerson(rng);
    const dobStr = formatDob(dob, pick(rng, DOB_STYLES));
    const rnokpp = generateRnokpp(dob, int(rng, 1, 9999));
    const unzrValue = generateUnzr(dob, int(rng, 1, 9999));
    if (i % 2 === 0) {
      out.push(
        doc(
          gid("kyc", i),
          "Анкета клієнта {person}. Дата народження {dob}. Паспорт {passport}. РНОКПП {rnokpp}. УНЗР {unzr}.",
          {
            person: slot(EntityType.PERSON, person),
            dob: slot(EntityType.DOB, dobStr),
            passport: slot(EntityType.PASSPORT, makeBooklet(rng, i % 4 === 0)),
            rnokpp: slot(EntityType.RNOKPP, rnokpp),
            unzr: slot(EntityType.UNZR, unzrValue),
          },
        ),
      );
    } else {
      out.push(
        doc(
          gid("kyc", i),
          "ID-картка, документ № {passport}. ПІБ {person}, народився {dob}, ІПН {rnokpp}.",
          {
            passport: slot(EntityType.PASSPORT, makeIdCard(rng)),
            person: slot(EntityType.PERSON, person),
            dob: slot(EntityType.DOB, dobStr),
            rnokpp: slot(EntityType.RNOKPP, rnokpp),
          },
        ),
      );
    }
  }
  return out;
}

function familyPay(rng: Rng, n: number): GoldDoc[] {
  const out: GoldDoc[] = [];
  for (let i = 0; i < n; i++) {
    const amount = `${int(rng, 1, 9)} ${String(int(rng, 100, 999))}.${String(int(rng, 10, 99))}`;
    if (i % 3 === 0) {
      out.push(
        doc(
          gid("pay", i),
          `Платіж ${amount} грн на рахунок {iban} (ЄДРПОУ {edrpou}). Замовник {person}.`,
          {
            iban: slot(EntityType.IBAN, makeIban(rng, i % 2 === 0)),
            edrpou: slot(EntityType.EDRPOU, makeEdrpou(rng)),
            person: slot(EntityType.PERSON, makePerson(rng)),
          },
        ),
      );
    } else if (i % 3 === 1) {
      out.push(
        doc(
          gid("pay", i),
          "Шановний {person}, зарахування виконано на {iban}.",
          {
            person: slot(EntityType.PERSON, makePerson(rng)),
            iban: slot(EntityType.IBAN, makeIban(rng, true)),
          },
        ),
      );
    } else {
      out.push(
        doc(
          gid("pay", i),
          "Реквізити: IBAN {iban}, код ЄДРПОУ {edrpou}, призначення: оренда.",
          {
            iban: slot(EntityType.IBAN, makeIban(rng, false)),
            edrpou: slot(EntityType.EDRPOU, makeEdrpou(rng)),
          },
        ),
      );
    }
  }
  return out;
}

function familyCard(rng: Rng, n: number): GoldDoc[] {
  const out: GoldDoc[] = [];
  for (let i = 0; i < n; i++) {
    const grouped = i % 2 === 0;
    if (i % 3 === 0) {
      out.push(
        doc(
          gid("card", i),
          "Клієнт {person} просить заблокувати картку {card}, тел. {phone}.",
          {
            person: slot(EntityType.PERSON, makePerson(rng)),
            card: slot(EntityType.CARD, makeCard(rng, grouped)),
            phone: slot(EntityType.PHONE, makePhone(rng, pick(rng, PHONE_STYLES))),
          },
        ),
      );
    } else if (i % 3 === 1) {
      out.push(
        doc(
          gid("card", i),
          "POS KYIV UAH 150.00 CARD {card}",
          { card: slot(EntityType.CARD, makeCard(rng, grouped)) },
        ),
      );
    } else {
      out.push(
        doc(
          gid("card", i),
          "Картка {card} (Visa). Якщо це не ви — напишіть на {email}.",
          {
            card: slot(EntityType.CARD, makeCard(rng, grouped)),
            email: slot(EntityType.EMAIL, makeEmail(rng)),
          },
        ),
      );
    }
  }
  return out;
}

function familyContact(rng: Rng, n: number): GoldDoc[] {
  const out: GoldDoc[] = [];
  for (let i = 0; i < n; i++) {
    if (i % 4 === 0) {
      out.push(
        doc(gid("contact", i), "Передзвоніть {phone} після 18:00.", {
          phone: slot(EntityType.PHONE, makePhone(rng, pick(rng, PHONE_STYLES))),
        }),
      );
    } else if (i % 4 === 1) {
      out.push(
        doc(gid("contact", i), "Напишіть на {email} або зателефонуйте {phone}.", {
          email: slot(EntityType.EMAIL, makeEmail(rng)),
          phone: slot(EntityType.PHONE, makePhone(rng, pick(rng, PHONE_STYLES))),
        }),
      );
    } else if (i % 4 === 2) {
      out.push(
        doc(gid("contact", i), "{person}: тел. {phone}, email {email}.", {
          person: slot(EntityType.PERSON, makePerson(rng)),
          phone: slot(EntityType.PHONE, makePhone(rng, pick(rng, PHONE_STYLES))),
          email: slot(EntityType.EMAIL, makeEmail(rng)),
        }),
      );
    } else {
      out.push(
        doc(gid("contact", i), "Резервний номер {phone}, основний {phone2}.", {
          phone: slot(EntityType.PHONE, makePhone(rng, "plus")),
          phone2: slot(EntityType.PHONE, makePhone(rng, "national")),
        }),
      );
    }
  }
  return out;
}

function familyDocs(rng: Rng, n: number): GoldDoc[] {
  const out: GoldDoc[] = [];
  for (let i = 0; i < n; i++) {
    const dob = randomDob(rng);
    if (i % 4 === 0) {
      out.push(
        doc(gid("docs", i), "Паспорт {passport}, виданий у Києві.", {
          passport: slot(EntityType.PASSPORT, makeBooklet(rng, i % 8 === 0)),
        }),
      );
    } else if (i % 4 === 1) {
      out.push(
        doc(gid("docs", i), "ID-картка, документ № {passport}. УНЗР {unzr}.", {
          passport: slot(EntityType.PASSPORT, makeIdCard(rng)),
          unzr: slot(EntityType.UNZR, makeUnzr(rng, true)),
        }),
      );
    } else if (i % 4 === 2) {
      out.push(
        doc(gid("docs", i), "compact UNZR {unzr}; дата народження {dob}.", {
          unzr: slot(EntityType.UNZR, makeUnzr(rng, false)),
          dob: slot(EntityType.DOB, formatDob(dob, pick(rng, DOB_STYLES))),
        }),
      );
    } else {
      out.push(
        doc(gid("docs", i), "Клієнт народився {dob} р., ІПН {rnokpp}.", {
          dob: slot(EntityType.DOB, formatDob(dob, "dot")),
          rnokpp: slot(EntityType.RNOKPP, generateRnokpp(dob, int(rng, 1, 9999))),
        }),
      );
    }
  }
  return out;
}

function familyAddress(rng: Rng, n: number): GoldDoc[] {
  const out: GoldDoc[] = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      out.push(
        doc(gid("address", i), "Проживає за адресою {address}.", {
          address: slot(EntityType.ADDRESS, makeAddress(rng)),
        }),
      );
    } else {
      out.push(
        doc(gid("address", i), "Адреса доставки: {address}. Отримувач {person}.", {
          address: slot(EntityType.ADDRESS, makeAddress(rng)),
          person: slot(EntityType.PERSON, makePerson(rng)),
        }),
      );
    }
  }
  return out;
}

function familyMixed(rng: Rng, n: number): GoldDoc[] {
  const out: GoldDoc[] = [];
  for (let i = 0; i < n; i++) {
    const kind = i % 5;
    if (kind === 0) {
      out.push(
        doc(
          gid("mixed", i),
          "Support chat: client {person}, email {email}, phone {phone}.",
          {
            person: slot(EntityType.PERSON, makePersonEn(rng)),
            email: slot(EntityType.EMAIL, makeEmail(rng)),
            phone: slot(EntityType.PHONE, makePhone(rng, "plus")),
          },
        ),
      );
    } else if (kind === 1) {
      out.push(
        doc(gid("mixed", i), "Hi {person}, wire to {iban} and ping me at {email}.", {
          person: slot(EntityType.PERSON, makePersonEn(rng)),
          iban: slot(EntityType.IBAN, makeIban(rng, false)),
          email: slot(EntityType.EMAIL, makeEmail(rng)),
        }),
      );
    } else if (kind === 2) {
      out.push(
        doc(gid("mixed", i), "Клиент {person} просит перезвонить на {phone}.", {
          person: slot(EntityType.PERSON, makePerson(rng)),
          phone: slot(EntityType.PHONE, makePhone(rng, "national")),
        }),
      );
    } else if (kind === 3) {
      out.push(
        doc(gid("mixed", i), "Російською: родился {dob}, паспорт {passport}.", {
          dob: slot(EntityType.DOB, formatDob(randomDob(rng), "dot")),
          passport: slot(EntityType.PASSPORT, makeBooklet(rng, false)),
        }),
      );
    } else {
      out.push(
        doc(
          gid("mixed", i),
          "Mixed: рахунок {iban}, ЄДРПОУ {edrpou}, tel {phone}, картка {card}.",
          {
            iban: slot(EntityType.IBAN, makeIban(rng, true)),
            edrpou: slot(EntityType.EDRPOU, makeEdrpou(rng)),
            phone: slot(EntityType.PHONE, makePhone(rng, "plus")),
            card: slot(EntityType.CARD, makeCard(rng, true)),
          },
        ),
      );
    }
  }
  return out;
}

function familyNegative(rng: Rng, n: number): GoldDoc[] {
  const out: GoldDoc[] = [];
  const templates = [
    () => `Виписка: ${int(rng, 1, 28).toString().padStart(2, "0")}.03.2024 оплата ${int(rng, 1, 9)} 200.00 грн, код квитанції 1234567890.`,
    () => `Сума 32855968 грн (вісім цифр, невалідний ЄДРПОУ).`,
    () => `Замовлення QZ123456 відвантажено, трек ${String(int(rng, 100000000, 999999999))}.`,
    () => `Немає персональних даних, лише курс USD/UAH 41.20 на 03.10.2026.`,
    () => `Код товару AB12CD34, сума ${int(rng, 100, 900)} грн, без ПІБ.`,
    () => `Вулиця без номера будинку в тексті: зустрінемось біля парку, не адреса.`,
    () => `ІПН 1234567890 не проходить перевірку контрольної цифри, не маскувати як РНОКПП.`,
    () => `номер ${String(int(rng, 100000000, 999999999))} в системі обліку посилок (не паспорт).`,
    () => `Платіж 12.01.2026, призначення: канцтовари, без рахунку.`,
    () => `Будь ласка, виправте ІПН: було 1759013770 (контрольна цифра не сходиться).`,
  ];
  for (let i = 0; i < n; i++) {
    const text = templates[i % templates.length]!();
    out.push({
      id: gid("negative", i),
      split: assignSplit(gid("negative", i)),
      source: "generated",
      text,
      entities: [],
    });
  }
  return out;
}

function familyTraps(rng: Rng, n: number): GoldDoc[] {
  const out: GoldDoc[] = [];
  for (let i = 0; i < n; i++) {
    const kind = i % 5;
    if (kind === 0) {
      const bad = mutateLastDigit(makeIban(rng, false));
      out.push({
        id: gid("traps", i),
        split: assignSplit(gid("traps", i)),
        source: "generated",
        text: `Рахунок ${bad} відхилено (контрольна сума IBAN).`,
        entities: [],
      });
    } else if (kind === 1) {
      const bad = mutateLastDigit(makeCard(rng, false));
      out.push({
        id: gid("traps", i),
        split: assignSplit(gid("traps", i)),
        source: "generated",
        text: `Картка ${bad} не проходить Luhn.`,
        entities: [],
      });
    } else if (kind === 2) {
      const bad = mutateLastDigit(makeRnokpp(rng));
      out.push({
        id: gid("traps", i),
        split: assignSplit(gid("traps", i)),
        source: "generated",
        text: `ІПН ${bad} (контрольна цифра не сходиться).`,
        entities: [],
      });
    } else if (kind === 3) {
      const bad = mutateLastDigit(makeEdrpou(rng));
      out.push({
        id: gid("traps", i),
        split: assignSplit(gid("traps", i)),
        source: "generated",
        text: `ЄДРПОУ ${bad} відхилено реєстром.`,
        entities: [],
      });
    } else {
      const bad = mutateLastDigit(makeUnzr(rng, true));
      out.push({
        id: gid("traps", i),
        split: assignSplit(gid("traps", i)),
        source: "generated",
        text: `УНЗР ${bad} — перевірте контрольну цифру.`,
        entities: [],
      });
    }
  }
  return out;
}
