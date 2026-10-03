export const EntityType = {
  PERSON: "PERSON",
  PHONE: "PHONE",
  IBAN: "IBAN",
  CARD: "CARD",
  RNOKPP: "RNOKPP",
  EDRPOU: "EDRPOU",
  PASSPORT: "PASSPORT",
  UNZR: "UNZR",
  EMAIL: "EMAIL",
  ADDRESS: "ADDRESS",
  DOB: "DOB",
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const Source = {
  RULE: "rule",
  MODEL: "model",
} as const;

export type Source = (typeof Source)[keyof typeof Source];

export interface Entity {
  type: EntityType;
  start: number;
  end: number;
  value: string;
  source: Source;
  subtype?: string;
}

export const PRIORITY: Record<EntityType, number> = {
  IBAN: 100,
  CARD: 90,
  UNZR: 85,
  RNOKPP: 80,
  EDRPOU: 80,
  EMAIL: 75,
  PHONE: 70,
  PASSPORT: 60,
  DOB: 50,
  ADDRESS: 40,
  PERSON: 30,
};

export const CONTAINER_TYPES = new Set<EntityType>(["ADDRESS", "PERSON"]);

export function entity(
  type: EntityType,
  start: number,
  end: number,
  value: string,
  subtype?: string,
): Entity {
  if (start < 0 || end < start) {
    throw new Error(`invalid span [${start}, ${end})`);
  }
  const e: Entity = { type, start, end, value, source: Source.RULE };
  if (subtype !== undefined) e.subtype = subtype;
  return e;
}
