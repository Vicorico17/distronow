import { test, expect } from "@playwright/test";

test("API rejects cross-origin and malformed writes before any provider action", async ({
  request,
}) => {
  const path = "/api/projects/00000000-0000-4000-8000-000000000000/acquisition";
  const crossOrigin = await request.post(path, {
    headers: { origin: "https://unrelated.example" },
    data: { action: "send" },
  });
  expect(crossOrigin.status()).toBe(403);
  const malformed = await request.post(path, {
    data: { action: "replace_state", state: { prospects: [] } },
  });
  expect(malformed.status()).toBe(400);
});

test("demo completes review, outreach, reply, meeting and customer lifecycle without network writes", async ({
  page,
}) => {
  const errors: string[] = [];
  const writes: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (request) => {
    if (request.method() === "POST") writes.push(request.url());
  });
  await page.goto("/leads-finder");
  await expect(
    page.getByRole("heading", { name: "Your pipeline, in motion." }),
  ).toBeVisible();
  await expect(page.getByText("DEMO · NO LIVE SENDS")).toBeVisible();
  await page.screenshot({
    path: "test-results/agency-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("navigation", { name: "Acquisition navigation" })
    .getByRole("button", { name: "Buyers" })
    .click();
  await page
    .getByRole("row")
    .filter({ hasText: "Alex Morgan" })
    .getByRole("button", { name: "Review" })
    .click();
  const detail = page.getByRole("region", { name: "Review Alex Morgan" });
  await expect(
    detail.getByRole("button", { name: "Generate template draft" }),
  ).toBeDisabled();
  await detail.getByRole("button", { name: "Approve buyer" }).click();
  await detail.getByRole("button", { name: "Simulate verification" }).click();
  await detail.getByRole("button", { name: "Generate template draft" }).click();
  await expect(detail.getByLabel("Message", { exact: true })).not.toHaveValue(
    "",
  );
  await detail
    .getByRole("button", { name: "Approve draft", exact: true })
    .click();
  await detail
    .getByLabel("Message", { exact: true })
    .fill("A reviewed, relevant test offer. Reply no thanks to opt out.");
  await expect(
    detail.getByRole("button", { name: "Simulate send", exact: true }),
  ).toBeDisabled();
  await detail.getByRole("button", { name: "Save edits", exact: true }).click();
  await detail
    .getByRole("button", { name: "Approve draft", exact: true })
    .click();
  await detail
    .getByRole("button", { name: "Simulate send", exact: true })
    .click();
  await detail
    .getByRole("button", { name: "Confirm simulation", exact: true })
    .click();
  await detail
    .getByLabel("Reply text", { exact: true })
    .fill("Interested. Let's meet next week.");
  await detail.getByRole("button", { name: "Save reply", exact: true }).click();
  await detail
    .getByLabel("Meeting time", { exact: true })
    .fill("2026-09-21T10:00");
  await detail
    .getByRole("button", { name: "Save meeting outcome", exact: true })
    .click();
  await detail.getByLabel("Outcome", { exact: true }).selectOption("held");
  await detail
    .getByRole("button", { name: "Save meeting outcome", exact: true })
    .click();
  await detail.getByLabel("Closed revenue (EUR)", { exact: true }).fill("1200");
  await detail
    .getByRole("button", { name: "Mark customer won", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Acquisition navigation" })
    .getByRole("button", { name: "Results" })
    .click();
  await expect(
    page
      .locator(".agency-funnel article")
      .filter({ hasText: "Customers won" })
      .locator("strong"),
  ).toHaveText("1");
  await expect(page.getByText("€1,200", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator(".agency-funnel article")
      .filter({ hasText: "Customers won" })
      .locator("strong"),
  ).toHaveText("1");
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});

test("campaign creation, filtering, export, and suppression", async ({
  page,
}) => {
  await page.goto("/agency");
  await page
    .getByRole("button", { name: "+ New campaign", exact: true })
    .click();
  await page.getByLabel("Campaign name", { exact: true }).fill("Test campaign");
  await page
    .getByRole("button", { name: "Create campaign", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Test campaign", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Filter by campaign", { exact: true })
    .selectOption({ label: "Boutique hospitality · autumn" });
  await page
    .getByRole("navigation", { name: "Acquisition navigation" })
    .getByRole("button", { name: "Buyers" })
    .click();
  await page.getByLabel("Search buyers", { exact: true }).fill("Stillwater");
  await expect(page.getByRole("row")).toHaveCount(2);
  await page.getByRole("button", { name: "Review →", exact: true }).click();
  await page
    .getByRole("button", { name: "Suppress contact", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Approve buyer", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("row").filter({ hasText: "Sam Taylor" }),
  ).toContainText("suppressed");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export buyers", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("distronow-buyers.csv");
});

test("mobile overview and navigation fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/agency");
  await expect(
    page.getByRole("heading", { name: "Your pipeline, in motion." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "+ New campaign", exact: true }),
  ).toBeEnabled();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    width: document.documentElement.scrollWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  await page.screenshot({
    path: "test-results/agency-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("navigation", { name: "Acquisition navigation" })
    .getByRole("button", { name: "Connections" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connect your agency." }),
  ).toBeVisible();
});
