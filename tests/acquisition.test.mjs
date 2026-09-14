import { test } from "node:test";
import assert from "node:assert/strict";
import {
  actionSchema,
  applyAction,
  assertSendable,
  demoAcquisition,
  exportCsv,
  funnel,
  logEvent,
  samePerson,
} from "../src/lib/acquisition.ts";

const brand = {
  name: "Test agency",
  description: "Test offer",
  website: "https://example.com",
  audience: "Hotels",
};
function approved() {
  let state = demoAcquisition();
  const id = state.prospects[0].id;
  state = applyAction(
    state,
    { action: "approve_prospect", prospectId: id },
    brand,
  );
  state = applyAction(state, { action: "draft", prospectId: id }, brand);
  state = applyAction(
    state,
    { action: "approve_draft", prospectId: id },
    brand,
  );
  state.prospects[0].emailStatus = "valid";
  return state;
}
function sent() {
  const state = approved();
  const p = state.prospects[0];
  assertSendable(state, p);
  p.status = "contacted";
  p.draftStatus = "sent";
  logEvent(
    state,
    p.campaignId,
    p.id,
    "email_sent",
    "Test provider confirmation",
    "demo",
  );
  return state;
}
test("campaign creation and discovered buyers never inflate email or meeting counters", () => {
  const state = demoAcquisition();
  assert.equal(funnel(state).buyers, 3);
  assert.equal(funnel(state).sent, 0);
  assert.equal(funnel(state).booked, 0);
});
test("unapproved, unverified, paused, and suppressed buyers cannot be sent", () => {
  for (const change of [
    (s) => (s.prospects[0].status = "candidate"),
    (s) => (s.prospects[0].emailStatus = "unverified"),
    (s) => (s.prospects[0].draftStatus = "draft"),
    (s) => (s.campaigns[0].status = "paused"),
    (s) => (s.prospects[0].status = "suppressed"),
  ]) {
    const state = approved();
    change(state);
    assert.throws(() => assertSendable(state, state.prospects[0]));
  }
});
test("editing an approved draft requires approval again", () => {
  const state = approved();
  const id = state.prospects[0].id;
  const edited = applyAction(
    state,
    {
      action: "save_draft",
      prospectId: id,
      subject: "Updated",
      body: "Different message",
    },
    brand,
  );
  assert.equal(edited.prospects[0].draftStatus, "draft");
  assert.throws(() => assertSendable(edited, edited.prospects[0]), /approve/);
  assert.equal(
    state.prospects[0].draftStatus,
    "approved",
    "original state must remain unchanged",
  );
});
test("buyer identity deduplicates across campaigns and normalized email addresses", () => {
  const state = demoAcquisition();
  const p = state.prospects[0];
  assert.ok(
    samePerson(p, {
      ...p,
      name: "Different spelling",
      email: p.email.toUpperCase(),
    }),
  );
  assert.throws(
    () => applyAction(state, { action: "add_prospect", value: p }, brand),
    /already exists/,
  );
});
test("sent messages cannot be edited, approved again, or sent twice", () => {
  const state = sent();
  const p = state.prospects[0];
  assert.throws(() => assertSendable(state, p));
  assert.throws(() =>
    applyAction(
      state,
      {
        action: "save_draft",
        prospectId: p.id,
        subject: "New",
        body: "Changed",
      },
      brand,
    ),
  );
  assert.throws(() =>
    applyAction(state, { action: "approve_prospect", prospectId: p.id }, brand),
  );
});
test("daily limits count unique send attempts including uncertain sends", () => {
  const state = approved();
  const p = state.prospects[0];
  state.campaigns[0].dailyLimit = 1;
  logEvent(
    state,
    p.campaignId,
    state.prospects[1].id,
    "send_started",
    "Mailbox timeout",
  );
  assert.throws(() => assertSendable(state, p), /daily/);
});
test("uncertain sends require explicit mailbox reconciliation", () => {
  const state = approved();
  const p = state.prospects[0];
  p.draftStatus = "uncertain";
  assert.throws(
    () => applyAction(state, { action: "draft", prospectId: p.id }, brand),
    /Reconcile/,
  );
  const next = applyAction(
    state,
    {
      action: "reconcile_send",
      prospectId: p.id,
      result: "sent",
      evidence: "Mailbox message id 123",
    },
    brand,
  );
  assert.equal(funnel(next).sent, 1);
  assert.equal(next.prospects[0].status, "contacted");
  assert.throws(() =>
    applyAction(
      next,
      {
        action: "reconcile_send",
        prospectId: p.id,
        result: "sent",
        evidence: "Same evidence",
      },
      brand,
    ),
  );
});
test("an unsubscribe suppresses the buyer and blocks all subsequent outreach", () => {
  const state = sent();
  const p = state.prospects[0];
  const next = applyAction(
    state,
    {
      action: "reply",
      prospectId: p.id,
      kind: "unsubscribe",
      body: "Please remove me",
    },
    brand,
  );
  assert.equal(next.prospects[0].status, "suppressed");
  assert.throws(
    () => applyAction(next, { action: "draft", prospectId: p.id }, brand),
    /suppressed/,
  );
});
test("reply → booked → held → won preserves history and measures outcomes", () => {
  let state = sent();
  const id = state.prospects[0].id;
  state = applyAction(
    state,
    { action: "reply", prospectId: id, kind: "interested", body: "Let's talk" },
    brand,
  );
  assert.equal(funnel(state).booked, 0);
  state = applyAction(
    state,
    {
      action: "meeting",
      prospectId: id,
      at: "2026-09-20T12:00:00.000Z",
      outcome: "booked",
    },
    brand,
  );
  assert.equal(funnel(state).booked, 1);
  assert.throws(
    () =>
      applyAction(
        state,
        { action: "won", prospectId: id, revenue: 1000 },
        brand,
      ),
    /held/,
  );
  state = applyAction(
    state,
    {
      action: "meeting",
      prospectId: id,
      at: "2026-09-20T12:00:00.000Z",
      outcome: "held",
    },
    brand,
  );
  state = applyAction(
    state,
    { action: "won", prospectId: id, revenue: 1000 },
    brand,
  );
  state = applyAction(
    state,
    {
      action: "reply",
      prospectId: id,
      kind: "interested",
      body: "Thanks for the meeting",
    },
    brand,
  );
  assert.equal(funnel(state).won, 1);
  assert.equal(funnel(state).revenue, 1000);
  assert.equal(funnel(state).held, 1);
});
test("cancelled meetings are removed from booked totals", () => {
  let state = sent();
  const id = state.prospects[0].id;
  state = applyAction(
    state,
    { action: "reply", prospectId: id, kind: "interested", body: "Yes" },
    brand,
  );
  state = applyAction(
    state,
    {
      action: "meeting",
      prospectId: id,
      at: "2026-09-20T12:00:00.000Z",
      outcome: "booked",
    },
    brand,
  );
  state = applyAction(
    state,
    {
      action: "meeting",
      prospectId: id,
      at: "2026-09-20T12:00:00.000Z",
      outcome: "cancelled",
    },
    brand,
  );
  assert.equal(funnel(state).booked, 0);
});
test("source URLs reject active schemes and countries reject malformed filters", () => {
  const state = demoAcquisition();
  assert.equal(
    actionSchema.safeParse({
      action: "add_prospect",
      value: { ...state.prospects[0], sourceUrl: "javascript:alert(1)" },
    }).success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({
      action: "create_campaign",
      value: { ...state.campaigns[0], countries: "Romania" },
    }).success,
    false,
  );
});
test("CSV escapes quotes, newlines, and spreadsheet formulas", () => {
  const state = demoAcquisition();
  state.prospects[0].company = '=HYPERLINK("https://example.com")';
  state.prospects[0].evidence = 'Line one\n"Line two"';
  const csv = exportCsv(state);
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.com"")"'));
  assert.ok(csv.includes('"Line one\n""Line two"""'));
});
