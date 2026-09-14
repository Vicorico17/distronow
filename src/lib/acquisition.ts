import { z } from "zod";

export const webUrl = z
  .string()
  .url()
  .max(2000)
  .refine((value) => /^https?:\/\//i.test(value), "Use an http or https URL");
const text = z.string().trim().min(1).max(5000);
export const campaignInput = z.object({
  name: text.max(120),
  offer: text,
  audience: text,
  roles: text.max(300),
  countries: z
    .string()
    .max(100)
    .refine(
      (s) => !s || s.split(",").every((v) => /^[A-Z]{2}$/.test(v.trim())),
      "Use country codes, for example RO, GB",
    ),
  exclusions: z.string().max(1000),
  bookingUrl: webUrl.or(z.literal("")),
  dailyLimit: z.number().int().min(1).max(50),
  budget: z.number().min(0).max(1000000),
});
export const campaignSchema = campaignInput.extend({
  id: z.string().uuid(),
  status: z.enum(["draft", "active", "paused", "completed"]),
  createdAt: z.string(),
  searchPage: z.number().int().default(1),
});
export const prospectInput = z.object({
  campaignId: z.string().uuid(),
  company: text.max(200),
  name: text.max(200),
  role: z.string().max(300),
  domain: z
    .string()
    .trim()
    .max(250)
    .regex(
      /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$|^$/,
      "Use a domain such as company.com",
    ),
  email: z.string().trim().email().max(254).or(z.literal("")),
  sourceUrl: webUrl,
  evidence: text,
  fit: z.number().int().min(0).max(100),
});
export const prospectSchema = prospectInput.extend({
  id: z.string().uuid(),
  source: z.enum(["manual", "explee", "demo"]),
  createdAt: z.string(),
  emailStatus: z.enum(["unverified", "valid", "catch_all", "not_found"]),
  status: z.enum([
    "candidate",
    "approved",
    "contacted",
    "replied",
    "meeting",
    "won",
    "suppressed",
  ]),
  subject: z.string().max(500),
  body: z.string().max(15000),
  draftStatus: z.enum([
    "empty",
    "draft",
    "approved",
    "sending",
    "sent",
    "uncertain",
  ]),
  reply: z.string().max(15000),
  replyKind: z.string().max(100),
  meetingAt: z.string(),
  meetingOutcome: z.enum(["", "booked", "held", "cancelled", "no_show"]),
  revenue: z.number().min(0),
});
export const eventSchema = z.object({
  id: z.string().uuid(),
  at: z.string(),
  campaignId: z.string(),
  prospectId: z.string(),
  type: z.string(),
  detail: z.string(),
  origin: z.enum(["operator", "provider", "demo"]),
  amount: z.number().default(0),
});
export const stateSchema = z.object({
  campaigns: z.array(campaignSchema).max(200),
  prospects: z.array(prospectSchema).max(3000),
  events: z.array(eventSchema).max(20000),
});
export type AcquisitionState = z.infer<typeof stateSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type Prospect = z.infer<typeof prospectSchema>;
export type BrandContext = {
  name: string;
  description: string;
  website: string;
  audience: string;
};
export const emptyAcquisition = (): AcquisitionState => ({
  campaigns: [],
  prospects: [],
  events: [],
});
export const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_campaign"), value: campaignInput }),
  z.object({
    action: z.literal("campaign_status"),
    campaignId: z.string().uuid(),
    status: z.enum(["active", "paused", "completed"]),
  }),
  z.object({ action: z.literal("add_prospect"), value: prospectInput }),
  z.object({
    action: z.literal("approve_prospect"),
    prospectId: z.string().uuid(),
  }),
  z.object({ action: z.literal("draft"), prospectId: z.string().uuid() }),
  z.object({
    action: z.literal("save_draft"),
    prospectId: z.string().uuid(),
    subject: text.max(500),
    body: text.max(15000),
  }),
  z.object({
    action: z.literal("approve_draft"),
    prospectId: z.string().uuid(),
  }),
  z.object({ action: z.literal("suppress"), prospectId: z.string().uuid() }),
  z.object({
    action: z.literal("reply"),
    prospectId: z.string().uuid(),
    body: text.max(15000),
    kind: z.enum([
      "interested",
      "objection",
      "not_now",
      "wrong_person",
      "unsubscribe",
      "out_of_office",
    ]),
  }),
  z.object({
    action: z.literal("meeting"),
    prospectId: z.string().uuid(),
    at: z.string().datetime(),
    outcome: z.enum(["booked", "held", "cancelled", "no_show"]),
  }),
  z.object({
    action: z.literal("won"),
    prospectId: z.string().uuid(),
    revenue: z.number().min(0).max(100000000),
  }),
  z.object({ action: z.literal("discover"), campaignId: z.string().uuid() }),
  z.object({ action: z.literal("enrich"), prospectId: z.string().uuid() }),
  z.object({ action: z.literal("send"), prospectId: z.string().uuid() }),
  z.object({
    action: z.literal("reconcile_send"),
    prospectId: z.string().uuid(),
    result: z.enum(["sent", "not_sent"]),
    evidence: text,
  }),
]);
export type AcquisitionAction = z.infer<typeof actionSchema>;

export function logEvent(
  state: AcquisitionState,
  campaignId: string,
  prospectId: string,
  type: string,
  detail: string,
  origin: "operator" | "provider" | "demo" = "operator",
  amount = 0,
) {
  state.events.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    campaignId,
    prospectId,
    type,
    detail,
    origin,
    amount,
  });
}
export function samePerson(
  a: Pick<Prospect, "email" | "domain" | "name" | "sourceUrl">,
  b: Pick<Prospect, "email" | "domain" | "name" | "sourceUrl">,
) {
  const norm = (s: string) => s.trim().toLowerCase();
  return Boolean(
    (a.email && b.email && norm(a.email) === norm(b.email)) ||
    (a.domain &&
      b.domain &&
      norm(a.domain) === norm(b.domain) &&
      norm(a.name) === norm(b.name)) ||
    (a.sourceUrl &&
      b.sourceUrl &&
      /linkedin.com\/in\//.test(a.sourceUrl) &&
      norm(a.sourceUrl).replace(/\/$/, "") ===
        norm(b.sourceUrl).replace(/\/$/, "")),
  );
}
export function addProspect(
  state: AcquisitionState,
  value: z.infer<typeof prospectInput>,
  source: Prospect["source"] = "manual",
) {
  if (!state.campaigns.some((c) => c.id === value.campaignId))
    throw new Error("Campaign not found.");
  if (state.prospects.some((p) => samePerson(p, value)))
    throw new Error(
      "This buyer already exists in this project. Open their existing conversation.",
    );
  const prospect: Prospect = {
    ...value,
    id: crypto.randomUUID(),
    source,
    createdAt: new Date().toISOString(),
    emailStatus: "unverified",
    status: "candidate",
    subject: "",
    body: "",
    draftStatus: "empty",
    reply: "",
    replyKind: "",
    meetingAt: "",
    meetingOutcome: "",
    revenue: 0,
  };
  state.prospects.push(prospect);
  logEvent(
    state,
    value.campaignId,
    prospect.id,
    "buyer_found",
    `${value.name} at ${value.company}`,
    source === "explee" ? "provider" : source === "demo" ? "demo" : "operator",
  );
  return prospect;
}
export function draftFor(
  prospect: Prospect,
  campaign: Campaign,
  brand: BrandContext,
) {
  return {
    subject: `A question for ${prospect.company}`,
    body: `Hi ${prospect.name.split(" ")[0]},\n\n${campaign.offer}\n\nWould it be useful to discuss whether this fits ${prospect.company}?${campaign.bookingUrl ? ` You can choose a time here: ${campaign.bookingUrl}` : ""}\n\n${brand.name}\n${brand.website}\n\nIf this is not relevant, reply “no thanks” and we will stop contacting you.`,
  };
}
export function assertSendable(
  state: AcquisitionState,
  p: Prospect,
  now = new Date(),
) {
  const c = state.campaigns.find((item) => item.id === p.campaignId);
  if (!c || c.status !== "active")
    throw new Error("Activate the campaign before sending.");
  if (p.status !== "approved" || p.reply || p.meetingAt)
    throw new Error(
      "Only approved buyers without a reply or meeting can be contacted.",
    );
  if (!p.email || p.emailStatus !== "valid")
    throw new Error(
      "A verified email is required. Use Find verified email first.",
    );
  if (
    state.prospects.some(
      (other) => other.status === "suppressed" && samePerson(other, p),
    )
  )
    throw new Error("This contact is suppressed.");
  if (p.draftStatus !== "approved" || !p.subject.trim() || !p.body.trim())
    throw new Error("Review and approve the current draft first.");
  const sent = state.events.filter(
    (e) =>
      e.campaignId === c.id &&
      ["email_sent", "send_started"].includes(e.type) &&
      e.at.slice(0, 10) === now.toISOString().slice(0, 10),
  );
  if (new Set(sent.map((e) => e.prospectId)).size >= c.dailyLimit)
    throw new Error("Campaign daily sending limit reached.");
}
export function applyAction(
  input: AcquisitionState,
  action: AcquisitionAction,
  brand: BrandContext,
): AcquisitionState {
  const state = structuredClone(input);
  if (action.action === "create_campaign") {
    const c: Campaign = {
      ...action.value,
      id: crypto.randomUUID(),
      status: "draft",
      createdAt: new Date().toISOString(),
      searchPage: 1,
    };
    state.campaigns.push(c);
    logEvent(state, c.id, "", "campaign_created", c.name);
    return state;
  }
  if (action.action === "campaign_status") {
    const c = state.campaigns.find((item) => item.id === action.campaignId);
    if (!c) throw new Error("Campaign not found.");
    c.status = action.status;
    logEvent(state, c.id, "", "campaign_status", action.status);
    return state;
  }
  if (action.action === "add_prospect") {
    addProspect(state, action.value);
    return state;
  }
  if (!("prospectId" in action))
    throw new Error("This action requires a connected provider.");
  const p = state.prospects.find((item) => item.id === action.prospectId);
  if (!p) throw new Error("Buyer not found.");
  const c = state.campaigns.find((item) => item.id === p.campaignId)!;
  if (p.status === "suppressed")
    throw new Error(
      "This buyer is suppressed. No further outreach actions are allowed.",
    );
  if (
    ["sending", "uncertain"].includes(p.draftStatus) &&
    !["reconcile_send", "suppress"].includes(action.action)
  )
    throw new Error(
      "Reconcile the previous send against your mailbox before continuing.",
    );
  switch (action.action) {
    case "approve_prospect":
      if (p.status !== "candidate")
        throw new Error("Only candidates can be approved.");
      p.status = "approved";
      break;
    case "draft":
    case "save_draft":
      if (p.status !== "approved" || p.draftStatus === "sent")
        throw new Error(
          "Approve the buyer first. Sent messages cannot be edited.",
        );
      Object.assign(
        p,
        action.action === "draft"
          ? draftFor(p, c, brand)
          : { subject: action.subject, body: action.body },
      );
      p.draftStatus = "draft";
      break;
    case "approve_draft":
      if (
        p.draftStatus !== "draft" ||
        !p.body.trim() ||
        !p.subject.trim() ||
        p.status !== "approved"
      )
        throw new Error("Save a draft for an approved buyer first.");
      p.draftStatus = "approved";
      break;
    case "suppress":
      state.prospects
        .filter((other) => samePerson(other, p))
        .forEach((other) => {
          other.status = "suppressed";
        });
      break;
    case "reply":
      if (p.draftStatus !== "sent")
        throw new Error("Record replies after a confirmed send.");
      p.reply = action.body;
      p.replyKind = action.kind;
      if (action.kind === "unsubscribe")
        state.prospects
          .filter((other) => samePerson(other, p))
          .forEach((other) => {
            other.status = "suppressed";
          });
      else if (!["meeting", "won"].includes(p.status)) p.status = "replied";
      break;
    case "meeting":
      if (!["replied", "meeting", "won"].includes(p.status))
        throw new Error("Record the conversation before its meeting outcome.");
      p.meetingAt = action.at;
      p.meetingOutcome = action.outcome;
      if (p.status !== "won")
        p.status = ["cancelled", "no_show"].includes(action.outcome)
          ? "replied"
          : "meeting";
      break;
    case "won":
      if (p.status !== "meeting" || p.meetingOutcome !== "held")
        throw new Error("Record a held meeting before marking the buyer won.");
      p.status = "won";
      p.revenue = action.revenue;
      break;
    case "reconcile_send":
      if (!["sending", "uncertain"].includes(p.draftStatus))
        throw new Error("There is no uncertain send to reconcile.");
      p.draftStatus = action.result === "sent" ? "sent" : "draft";
      if (action.result === "sent") {
        p.status = "contacted";
        logEvent(
          state,
          c.id,
          p.id,
          "email_sent",
          `Mailbox reconciliation: ${action.evidence}`,
        );
      }
      break;
    default:
      throw new Error("This action requires a connected provider.");
  }
  logEvent(
    state,
    c.id,
    p.id,
    action.action,
    action.action === "reply"
      ? `${action.kind}: ${action.body}`
      : action.action === "meeting"
        ? `${action.outcome}: ${action.at}`
        : action.action === "reconcile_send"
          ? action.evidence
          : `${p.name}: ${action.action.replaceAll("_", " ")}`,
  );
  return state;
}
export function funnel(state: AcquisitionState, campaignId?: string) {
  const prospects = state.prospects.filter(
    (p) => !campaignId || p.campaignId === campaignId,
  );
  const events = state.events.filter(
    (e) => !campaignId || e.campaignId === campaignId,
  );
  return {
    buyers: prospects.length,
    sent: new Set(
      events.filter((e) => e.type === "email_sent").map((e) => e.prospectId),
    ).size,
    positive: prospects.filter((p) => p.replyKind === "interested").length,
    booked: prospects.filter((p) =>
      ["booked", "held"].includes(p.meetingOutcome),
    ).length,
    held: prospects.filter((p) => p.meetingOutcome === "held").length,
    won: prospects.filter((p) => p.status === "won").length,
    revenue: prospects.reduce((sum, p) => sum + p.revenue, 0),
    credits: events.reduce((sum, e) => sum + e.amount, 0),
  };
}
export function exportCsv(state: AcquisitionState) {
  const cell = (v: string | number) =>
    `"${String(v)
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  return [
    [
      "Company",
      "Contact",
      "Role",
      "Email",
      "Verification",
      "Status",
      "Fit",
      "Evidence",
      "Source",
      "Subject",
      "Draft",
      "Meeting",
      "Revenue",
    ],
    ...state.prospects.map((p) => [
      p.company,
      p.name,
      p.role,
      p.email,
      p.emailStatus,
      p.status,
      p.fit,
      p.evidence,
      p.sourceUrl,
      p.subject,
      p.body,
      p.meetingAt,
      p.revenue,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
export function demoAcquisition(): AcquisitionState {
  const state = emptyAcquisition();
  const campaign: Campaign = {
    id: crypto.randomUUID(),
    name: "Boutique hospitality · autumn",
    offer:
      "We turn one property shoot into a month of social content and a direct-booking campaign.",
    audience: "Independent boutique hotels",
    roles: "Owner, Marketing Director",
    countries: "RO, GB",
    exclusions: "Large hotel chains",
    bookingUrl: "",
    dailyLimit: 10,
    budget: 500,
    status: "active",
    searchPage: 1,
    createdAt: new Date().toISOString(),
  };
  state.campaigns.push(campaign);
  for (const [company, name, role, evidence, fit] of [
    [
      "Juniper House",
      "Alex Morgan",
      "Owner",
      "Fictional example: new property opening, with a small content team.",
      92,
    ],
    [
      "Stillwater Rooms",
      "Sam Taylor",
      "Marketing Director",
      "Fictional example: seasonal packages need fresh creative.",
      86,
    ],
    [
      "Atelier Stay",
      "Jordan Lee",
      "Founder",
      "Fictional example: introducing direct booking offers.",
      81,
    ],
  ] as const)
    addProspect(
      state,
      {
        campaignId: campaign.id,
        company,
        name,
        role,
        evidence,
        fit,
        domain: "example.com",
        email: `${name.split(" ")[0].toLowerCase()}@example.com`,
        sourceUrl: "https://example.com",
      },
      "demo",
    );
  return state;
}
