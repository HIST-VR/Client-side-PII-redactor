import { expect, test } from "@playwright/test";

test("rules-first sample, mask, copy, metrics", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Чат підтримки" }).click();
  await expect(page.getByTestId("preview").locator("mark")).toHaveCount(3, { timeout: 10_000 });
  await expect(page.getByTestId("masked")).toContainText("[PHONE]");
  await expect(page.getByTestId("masked")).toContainText("[EMAIL]");
  await expect(page.getByTestId("masked")).toContainText("[CARD]");

  await page.getByRole("button", { name: "Частково" }).click();
  await expect(page.getByTestId("masked")).toContainText("2233");

  await page.getByRole("button", { name: "Копіювати" }).click();
  await expect(page.getByRole("button", { name: "Скопійовано" })).toBeVisible();

  await page.getByRole("link", { name: "Метрики" }).click();
  await expect(page.getByTestId("f1-hybrid")).toHaveText("0.959");
  await expect(page.getByTestId("f1-rules")).toHaveText("0.870");

  await page.getByLabel("Мова").selectOption("en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("On-device PII redactor");
  await expect(page.getByRole("link", { name: "Metrics" })).toBeVisible();
});

test("mobile layout still redacts a sample", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Платіж" }).click();
  await expect(page.getByTestId("masked")).toContainText("[IBAN]");
  await expect(page.getByTestId("masked")).toContainText("[EDRPOU]");
  await expect(page.getByRole("button", { name: "Увімкнути імена" })).toBeVisible();
});

test("limitations stay visible and English sample path works", async ({ page }) => {
  await page.goto("/#/");
  await page.getByLabel("Мова").selectOption("en");
  await expect(page.getByRole("heading", { name: "Limitations" })).toBeVisible();
  await page.getByRole("button", { name: "Support chat" }).click();
  await expect(page.getByTestId("masked")).toContainText("[PHONE]");
});
