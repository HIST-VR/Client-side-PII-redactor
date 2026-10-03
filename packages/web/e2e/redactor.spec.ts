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

  await page.getByTestId("copy-masked").click();
  await expect(page.getByTestId("copy-masked")).toHaveText("Скопійовано");

  await page.getByRole("link", { name: "Метрики" }).click();
  await expect(page.getByTestId("f1-hybrid")).toHaveText("0.959");
  await expect(page.getByTestId("f1-rules")).toHaveText("0.870");

  await page.getByRole("button", { name: "EN", exact: true }).click();
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
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Limitations" })).toBeVisible();
  await page.getByRole("button", { name: "Support chat" }).click();
  await expect(page.getByTestId("masked")).toContainText("[PHONE]");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/HIST-VR",
  );
});

test("mask hints are a single custom tooltip and stay on-screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const chip = page.getByRole("button", { name: "Псевдоніми" });
  await expect(chip).not.toHaveAttribute("title");
  await chip.hover();
  const tip = page.getByRole("tooltip");
  await expect(tip).toHaveCount(1);
  const box = await tip.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);

  await page.evaluate(() => window.scrollTo(0, 200));
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("metrics has no status class and inactive nav is outlined", async ({ page }) => {
  await page.goto("/#/metrics");
  await expect(page.locator("main .status")).toHaveCount(0);
  await expect(page.getByTestId("f1-hybrid")).toHaveText("0.959");
  const redactor = page.getByRole("link", { name: "Редактор" });
  await expect(redactor).not.toHaveAttribute("aria-current", "page");
  const border = await redactor.evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(Number.parseFloat(border)).toBeGreaterThan(0);
});
