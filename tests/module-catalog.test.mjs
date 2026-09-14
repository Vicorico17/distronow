import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CORE_MARKETING_MODULES,
  getMarketingModule,
} from "../src/lib/module-catalog.ts";

test("metadata reencoder is available in the core module menu", () => {
  const metadata = getMarketingModule("metadata-reencoder");
  assert.ok(metadata);
  assert.equal(metadata.status, "Image utility connected");
  assert.ok(
    metadata.workflows.some((workflow) =>
      workflow.title.toLowerCase().includes("screen-recording"),
    ),
  );
  assert.ok(
    CORE_MARKETING_MODULES.some(
      (module) => module.slug === "metadata-reencoder",
    ),
  );
});

test("SEO/GEO and Launched are available in the core module menu", () => {
  for (const slug of ["seo-geo", "launched"]) {
    assert.ok(getMarketingModule(slug));
    assert.ok(CORE_MARKETING_MODULES.some((module) => module.slug === slug));
  }
  assert.ok(
    getMarketingModule("seo-geo").importedCapabilities.includes(
      "No guaranteed rankings or GEO hacks",
    ),
  );
  assert.ok(
    getMarketingModule("launched").importedCapabilities.includes(
      "Anti-spam and authentic-engagement checks",
    ),
  );
});
