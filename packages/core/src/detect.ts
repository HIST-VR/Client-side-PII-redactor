import { merge } from "./merge.ts";
import { findAddresses } from "./rules/address.ts";
import { findCards } from "./rules/card.ts";
import { findDobs } from "./rules/dob.ts";
import { findEdrpou } from "./rules/edrpou.ts";
import { findEmails } from "./rules/email.ts";
import { findIbans } from "./rules/iban.ts";
import { findPassports } from "./rules/passport.ts";
import { findPhones } from "./rules/phone.ts";
import { findRnokpp } from "./rules/rnokpp.ts";
import { findUnzr } from "./rules/unzr.ts";
import { EntityType, type Entity } from "./types.ts";

const DETECTORS: [EntityType, (text: string) => Entity[]][] = [
  [EntityType.PHONE, findPhones],
  [EntityType.IBAN, findIbans],
  [EntityType.CARD, findCards],
  [EntityType.RNOKPP, findRnokpp],
  [EntityType.EDRPOU, findEdrpou],
  [EntityType.PASSPORT, findPassports],
  [EntityType.UNZR, findUnzr],
  [EntityType.EMAIL, findEmails],
  [EntityType.ADDRESS, findAddresses],
  [EntityType.DOB, findDobs],
];

export function detect(text: string, types?: ReadonlySet<EntityType>): Entity[] {
  const found: Entity[] = [];
  for (const [type, detector] of DETECTORS) {
    if (types && !types.has(type)) continue;
    found.push(...detector(text));
  }
  return merge(found);
}
