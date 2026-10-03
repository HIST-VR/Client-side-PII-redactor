import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

export const fixtures = JSON.parse(
  readFileSync(join(root, "fixtures/validators.json"), "utf8"),
) as {
  rnokpp: { valid: string[]; invalid_checksum: string[]; invalid_length: string[]; invalid_format: string[] };
  edrpou: { valid: string[]; invalid_checksum: string[]; invalid_length: string[] };
  unzr: { valid: string[]; invalid_checksum: string[]; invalid_date: string[] };
  luhn: { valid: string[]; invalid_checksum: string[]; invalid_length: string[] };
};
