import { expect, test } from "@playwright/test";

test("global modules menu exposes every process module and the reencoder", async ({ page }) => {
  await page.goto("/modules");
  await expect(page.getByRole("heading", { name: "One menu for every specialist tool." })).toBeVisible();

  for (const name of [
    "DistroNow",
    "AClienti",
    "accman",
    "Email Marketing",
    "ClipRO",
    "Video Generation",
    "Reclip",
    "AutoArt",
    "Streamwin",
    "MassCall",
    "Metadata Reencoder",
    "Leads Finder",
  ]) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }

  await page.locator('a[href="/modules/metadata-reencoder"]').click();
  await expect(page).toHaveURL(/\/modules\/metadata-reencoder$/);
  await expect(page.getByRole("heading", { name: "Re-encode the image" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Screen-record the media" })).toBeVisible();
});
