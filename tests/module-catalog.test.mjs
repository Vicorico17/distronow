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
