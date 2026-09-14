import { expect, test } from "@playwright/test";

test("global modules menu exposes every process module and the reencoder", async ({ page }) => {
  await page.goto("/modules");
  await expect(page.getByRole("heading", { name: "One menu for every specialist tool." })).toBeVisible();

  for (const name of [
    "Content Studio",
    "accman",
    "Email Marketing",
    "ClipRO",
    "Video Generation",
    "AutoArt",
    "Twitch Stream Users",
    "MassCall",
    "SEO / GEO",
    "Launched",
    "Metadata Reencoder",
    "Leads Finder",
  ]) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText("AClienti", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Reclip", { exact: true })).toHaveCount(0);

  await page.locator('a[href="/modules/metadata-reencoder"]').click();
  await expect(page).toHaveURL(/\/modules\/metadata-reencoder$/);
  await expect(page.getByRole("heading", { name: "Re-encode the image" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Screen-record the media" })).toBeVisible();
});

test("Leads Finder contains the consolidated customer research area", async ({ page }) => {
  await page.goto("/leads-finder");
  await page.getByRole("button", { name: "Research" }).click();
  await expect(page.getByRole("heading", { name: "Research is part of Leads Finder." })).toBeVisible();
});
