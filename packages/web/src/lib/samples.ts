import { generateEdrpou, generateIban, generateLuhn, generateRnokpp, generateUnzr } from "@ua-pii/core";

export type SampleId = "support" | "bank" | "kyc" | "mixed" | "negatives";

const DOB = new Date(Date.UTC(1990, 2, 12));

function values() {
  return {
    iban: generateIban("305299", "1234567890123456789"),
    card: generateLuhn("424242424242424"),
    rnokpp: generateRnokpp(DOB, 17),
    edrpou: generateEdrpou("3285596"),
    unzr: generateUnzr(DOB, 11),
  };
}

export function sampleText(id: SampleId): string {
  const v = values();
  switch (id) {
    case "support":
      return [
        "Доброго дня, мене звати Олена Коваленко.",
        "Передзвоніть, будь ласка, на +380671112233 або напишіть olena.kovalenko@example.com.",
        "Картка для повернення: 4242 4242 4242 4242.",
      ].join("\n");
    case "bank":
      return [
        "Платіж ТОВ «Дніпро». ЄДРПОУ " + v.edrpou + ".",
        "IBAN отримувача " + v.iban + ".",
        "Контакт: Іван Петренко, тел. 0501234567.",
      ].join("\n");
    case "kyc":
      return [
        "KYC: Юлія Олійник, паспорт АА123456, ID-картка документ № 001234567.",
        "Дата народження 12.03.1990, УНЗР " + v.unzr + ", РНОКПП " + v.rnokpp + ".",
        "Проживає за адресою вул. Хрещатик, буд. 22, кв. 15, м. Київ.",
      ].join("\n");
    case "mixed":
      return [
        "Client: Олена Коваленко / Elena Kovalenko.",
        "Phone +380 67 111 22 33, email olena@example.com.",
        "Проживає у місті Канів. Card " + v.card + ".",
      ].join("\n");
    case "negatives":
      return [
        "Замовлення 001234567 без слова паспорт.",
        "Оплата 12.03.2024 на рахунок UA00NOTANIBAN000000000000000.",
        "Картка 4242424242424243 (контрольна сума не сходиться).",
        "Parcel hw-025, це не паспорт.",
      ].join("\n");
  }
}
