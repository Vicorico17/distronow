import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTregPerson,
  tregCost,
  tregEmailStatus,
  tregPeopleResponse,
} from "../src/lib/treg.ts";

test("normalizes common flat and nested Treg provider rows", () => {
  assert.deepEqual(
    normalizeTregPerson({
      first_name: "Ada",
      last_name: "Lovelace",
      job_title: "Founder",
      company: { name: "Analytical", domain: "https://www.analytical.co/path" },
      socials: { linkedin_url: "https://linkedin.com/in/ada" },
      location_name: "London",
    }),
    {
      name: "Ada Lovelace",
      role: "Founder",
      company: "Analytical",
      domain: "analytical.co",
      sourceUrl: "https://linkedin.com/in/ada",
      location: "London",
    },
  );
  assert.equal(
    normalizeTregPerson({ full_name: "Grace Hopper", company_domain: "navy.mil" })
      .sourceUrl,
    "https://navy.mil",
  );
});

test("maps only deliverable verification verdicts to valid", () => {
  assert.equal(tregEmailStatus({ valid: true, status: "unknown" }), "valid");
  assert.equal(tregEmailStatus({ valid: false, status: "accept_all" }), "catch_all");
  assert.equal(tregEmailStatus({ valid: false, status: "invalid" }), "not_found");
  assert.equal(tregEmailStatus({}), "not_found");
});

test("validates routed envelopes and converts micro-USD cost", () => {
  const result = tregPeopleResponse.parse({
    output: { people: [] },
    _treg: { served_by: "quickenrich.people.search", charged_micro: 4834 },
  });
  assert.equal(result._treg?.served_by, "quickenrich.people.search");
  assert.equal(tregCost(result._treg), 0.004834);
  assert.throws(() => tregPeopleResponse.parse({ output: { people: "bad" } }));
});
