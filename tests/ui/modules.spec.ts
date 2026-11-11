import { expect, test } from "@playwright/test";

test("global modules menu exposes every process module and the reencoder", async ({ page }) => {
  await page.goto("/modules");
  await expect(page.getByRole("heading", { name: "One menu for every specialist tool." })).toBeVisible();

  for (const name of [
    "DistroNow / Content Studio",
    "accman",
    "Email Marketing",
    "ClipRO",
    "Video Generation",
    "AutoArt",
    "Streamwin",
    "MassCall",
    "SEO / GEO",
    "Launched",
    "Metadata Reencoder",
    "Leads Finder",
  ]) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
  for (const name of ["ACLIENTI", "Reclip", "LORO", "Orbit", "TTVfans", "AutoGTM", "fal-video-runner", "HeliosGen", "AI Marketing OS", "Script Generation", "Emailing / Lead Magnet", "Character Generation", "Slideshows", "Untapped Niches", "Clipping", "Growth Agent Hub", "Postiz", "Virality"]) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }

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


test("every directory entry has a dedicated page with integration details and tour navigation", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/modules");
  const links = await page.locator(".module-card-link").evaluateAll((items) => items.map((item) => item.getAttribute("href")!));
  expect(links.length).toBeGreaterThanOrEqual(30);
  expect(new Set(links).size).toBe(links.length);
  for (let index = 0; index < links.length; index++) {
    const response = await page.goto(links[index]);
    expect(response?.status(), links[index]).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Current integration" })).toBeVisible();
    const tour = page.getByRole("navigation", { name: "Browse modules" });
    await expect(tour.getByRole("link", { name: `All categories · ${index + 1} / ${links.length}` })).toBeVisible();
    if (index > 0) await expect(tour.locator(`a[href="${links[index - 1]}"]`)).toBeVisible();
    if (index < links.length - 1) await expect(tour.locator(`a[href="${links[index + 1]}"]`)).toBeVisible();
  }
  const missing = await page.goto("/modules/not-a-real-module");
  expect(missing?.status()).toBe(404);
});

test("contributing project pages retain separate identities and shared workflow links on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/modules/aclienti");
  await expect(page.getByText("Modules / ACLIENTI", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Leads Finder →" })).toHaveAttribute("href", "/leads-finder");
  await page.getByRole("navigation", { name: "Browse modules" }).getByRole("link", { name: "Reclip →" }).click();
  await expect(page).toHaveURL(/\/modules\/reclip$/);
  await expect(page.getByRole("link", { name: "Open ClipRO →" })).toHaveAttribute("href", "/modules/clipro");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto("/modules/postiz-app");
  await expect(page.getByText("No Postiz code was copied.", { exact: false })).toBeVisible();
});
