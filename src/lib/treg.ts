import { z } from "zod";

const tregMeta = z
  .object({
    served_by: z.string().optional(),
    charged_micro: z.number().nonnegative().optional(),
    ignored_filters: z.array(z.string()).optional(),
  })
  .passthrough()
  .optional();

export const tregPeopleResponse = z
  .object({
    output: z
      .object({ people: z.array(z.record(z.unknown())).default([]) })
      .passthrough(),
    _treg: tregMeta,
  })
  .passthrough();

export const tregEmailFindResponse = z
  .object({
    output: z
      .object({
        email: z.string().email().nullable().optional(),
        verified: z.boolean().optional(),
      })
      .passthrough(),
    _treg: tregMeta,
  })
  .passthrough();

export const tregEmailVerifyResponse = z
  .object({
    output: z
      .object({
        valid: z.boolean().optional(),
        status: z.string().nullable().optional(),
      })
      .passthrough(),
    _treg: tregMeta,
  })
  .passthrough();

function stringAt(value: unknown, paths: string[][]) {
  for (const path of paths) {
    let current = value;
    for (const key of path) {
      if (!current || typeof current !== "object") {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[key];
    }
    if (typeof current === "string" && current.trim()) return current.trim();
  }
  return "";
}

function domainFrom(value: string) {
  if (!value) return "";
  try {
    const host = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
      .hostname.toLowerCase()
      .replace(/^www\./, "");
    return /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(host) ? host : "";
  } catch {
    return "";
  }
}

export function normalizeTregPerson(row: Record<string, unknown>) {
  const first = stringAt(row, [["first_name"], ["firstName"]]);
  const last = stringAt(row, [["last_name"], ["lastName"]]);
  const name =
    stringAt(row, [["full_name"], ["fullName"], ["name"]]) ||
    [first, last].filter(Boolean).join(" ");
  const role = stringAt(row, [
    ["title"],
    ["job_title"],
    ["headline"],
    ["current_title"],
    ["current_employment", "title"],
  ]);
  const company = stringAt(row, [
    ["company_name"],
    ["company", "name"],
    ["current_employer", "name"],
    ["organization", "name"],
  ]);
  const domain = domainFrom(
    stringAt(row, [
      ["company_domain"],
      ["domain"],
      ["company", "domain"],
      ["current_employer", "domain"],
      ["company_website"],
    ]),
  );
  const linkedin = stringAt(row, [
    ["linkedin_url"],
    ["linkedinUrl"],
    ["profile_url"],
    ["socials", "linkedin_url"],
  ]);
  const sourceUrl = /^https?:\/\//i.test(linkedin)
    ? linkedin
    : domain
      ? `https://${domain}`
      : "";
  const location = stringAt(row, [
    ["location"],
    ["location_name"],
    ["country"],
  ]);
  return { name, role, company: company || domain, domain, sourceUrl, location };
}

export function tregCost(meta: z.infer<typeof tregMeta>) {
  return (meta?.charged_micro ?? 0) / 1_000_000;
}

export function tregEmailStatus(output: {
  valid?: boolean;
  status?: string | null;
}) {
  const status = output.status?.toLowerCase().replaceAll("-", "_") ?? "";
  if (output.valid === true || ["valid", "deliverable", "safe"].includes(status))
    return "valid" as const;
  if (["accept_all", "catch_all", "risky", "unknown"].includes(status))
    return "catch_all" as const;
  return "not_found" as const;
}
