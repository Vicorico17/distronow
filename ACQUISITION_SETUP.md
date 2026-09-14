# Acquisition: local testing and connections

## Test immediately

Run `npm install` and `npm run dev`, then open `/leads-finder`.
This is a clearly labeled fictional workspace, stored only in this browser.
It never calls discovery, email, AI, calendar, or project-write APIs.

Test: Buyers → review Alex Morgan → approve buyer → simulate verification →
generate draft → edit/save → approve draft → simulate send → record reply →
record booked/held meeting → mark customer won. Overview and Results update
from those events. Refresh retains demo state; Reset demo resets it.

## Project storage

Apply `supabase/migrations/20260914090000_create_acquisition_workspaces.sql`
to the same Supabase project used by DistroNow. The existing projects table
must already exist. The migration adds a table and does not change old records.

The table has RLS enabled and denies direct anon/authenticated access.
Server routes first verify ownership using the existing user/anonymous-owner
boundary, then access it with the service role. Generic module import routes
cannot change acquisition events. No browser-supplied aggregate state is accepted.

Open a project → Marketing OS → Leads Finder, or
`/projects/<project-id>/leads-finder`. Campaigns, buyers, editable drafts,
approvals, events, replies, meeting outcomes and revenue persist per project.

One state record per project provides atomic transitions and optimistic
concurrency. Provider actions acquire a durable busy reservation; conflicting
requests must refresh. The initial version is bounded to 200 campaigns,
3,000 prospects and 20,000 events per project. Larger workloads need normalized
tables, pagination and background jobs before increasing these limits.

## Discovery and enrichment

Leads Finder uses Treg as its live people-data gateway:

- `treg.people.search` discovers up to ten people from the campaign brief.
- `treg.people.email.find` finds a work email from the saved identity.
- `treg.people.email.verify` independently checks deliverability before send.

Create a Treg token and set it only on the server:

```bash
TREG_TOKEN=your-team-or-agent-token
TREG_MAX_COST_USD=0.25
# Only identity/login tokens also need the team slug:
TREG_ORG=your-team-slug
```

Calls go to `https://treg.to/call/<endpoint>` with the project ID attached as
the `workspace` usage tag. `TREG_MAX_COST_USD` is a hard per-call route ceiling;
it defaults to $0.25 and this app rejects values above $10. It is not a daily or
campaign spending cap. Use Treg organization budgets for aggregate limits.

A signed-in project owner can search 10 buyers per request using the campaign
audience, role, exclusion, and country brief. Treg returns provider-native rows,
so incomplete rows are skipped and the serving provider is retained in the
activity evidence. Duplicate identities are skipped. No provider requests run
during tests or automatically when opening a screen. `EXPLEE_API_KEY` remains a
legacy fallback only when `TREG_TOKEN` is absent.

An email returned by search or email-find is never treated as deliverable.
Leads Finder makes the separate verification call and only a `valid` or
deliverable verdict permits sending; catch-all, risky, unknown, invalid, and
missing results stay blocked. Source evidence remains visible for human review.

API contract: https://treg.to/docs and https://treg.to/catalog/people

## Drafting

The existing `OPENAI_API_KEY` and `OPENAI_MODEL` configuration is reused.
Generation uses saved brand context, the campaign offer and buyer evidence.
Without a key, the interface offers a template explicitly. Draft edits revoke
prior approval. No generated text is sent automatically.

## Sending

Configure `SMTP_HOST`, `SMTP_PORT` (465 or 587), `SMTP_USER`, `SMTP_PASSWORD`,
`OUTREACH_FROM` (a plain email address), `OUTREACH_POSTAL_ADDRESS`, and
`OUTREACH_ALLOWED_USER_IDS` (comma-separated Supabase user IDs). Use a mailbox
and provider that support your intended outreach. TLS is required.

Only an allowed signed-in project owner can send, and only after activating
the campaign, approving the buyer, verifying the email, saving and approving
the draft, and confirming the individual send. A sender address and opt-out
footer are included. Per-campaign daily limits apply in UTC. The planning
budget is not a spending cap; Treg's returned cost is recorded in activity.

An SMTP acceptance creates an email_sent event. This means the sending server
accepted the message, not that the receiving mailbox delivered it. There is
no automatic retry. If the request is interrupted, refresh after 150 seconds,
check the actual mailbox and reconcile the send with evidence before retrying.
After a confirmed-not-sent reconciliation, the message needs approval again.

Replies and opt-outs must be checked in the mailbox and recorded in Outreach.
Recording an unsubscribe suppresses that identity, and any reply prevents
further sends in the initial workflow. There are no automated follow-ups.

## Calendar and results

Add a booking URL to a campaign. Confirm meetings in your calendar, then
record their date and outcome. Calendar and inbox sync are not implemented.
Sharing the booking link never increments the meeting count. Cancelled and
no-show meetings are excluded from Calls booked; held meetings are shown
separately. Revenue is operator-recorded, not connected accounting data.

## Checks

- `npm test`: lifecycle, approvals, suppression, deduplication, uncertain-send
  reconciliation, funnel accounting and CSV protections. Requires Node 22.6+.
- `npm run build` and `npm run lint`.
- `npm run test:ui`: production build must exist; uses local Chrome on port 3104. Tests use only demo data and assert no POST requests leave the browser.

## Follow-on integrations

Automatic inbox ingestion, calendar webhooks, delivery/bounce events, scheduled
follow-ups, cross-project suppression, spending caps and real publishing
providers remain separate implementation work. ClipRO/fal sources remain local
under `modules/`; moving those folders does not integrate their runtimes or
include nested repositories in this application's git commits.
