# DistroNow Marketing OS — Remaining Implementation TODO

This is the handoff list after the unified flow, operations layer, and shared
module model were added. Work from the top down.

## Next session handoff — start here

1. Apply and verify these Supabase migrations:
   - `20260822120000_create_marketing_os_modules.sql`
   - `20260822133000_create_module_records.sql`
2. Open `/projects/[id]/modules/migration` and import the core source records.
3. Finish AClienti as a real utility: research-lens editor, signal filters,
   score breakdown, buyer stages, profile builder, evidence-linked briefs, and
   JSON/CSV export.
4. Finish accman as a real utility: account health, niche board, format/prompt
   library, trend inbox, calendar, platform previews, approval states, and
   analytics.
5. Build the Video Generation module on top of the existing product-video
   generator and fal queue boundary: provider settings, reference uploads,
   job status, retries, outputs, credits, and approval.
6. Merge ClipRO/Reclip into one persistent source-to-clip workflow: rights,
   source inspection, playlist/download jobs, transcript, candidate scoring,
   render, review, and accman handoff.
7. Keep AutoArt, Streamwin, and MassCall as companion apps. Add deployed URLs
   and authenticated handoff callbacks only when those apps are ready.
8. Add RLS policies, generated Supabase types, ownership tests, and end-to-end
   coverage before enabling production integrations.

Current pushed commit: `a6184b1 Record AClienti and accman migration`.

## 0. Environment and database setup

- [ ] Apply `supabase/migrations/20260822120000_create_marketing_os_modules.sql`.
- [ ] Confirm all new tables exist in the production Supabase project.
- [ ] Add row-level security policies for the new tables.
- [ ] Replace temporary service-route typing with generated Supabase types.
- [ ] Add a migration verification script or CI check.
- [ ] Confirm production environment variables for Supabase, Firecrawl, and
  OpenAI.

## 1. Strategy Library

- [ ] Build the editable Strategy Library UI.
- [ ] Create the five strategy documents:
  - [ ] Product Information
  - [ ] Marketing Strategy
  - [ ] Competitor Analysis
  - [ ] Brand Voice
  - [ ] Content Strategy
- [ ] Seed the first drafts from the existing brand extraction and AClienti
  customer profiles.
- [ ] Add document versioning and confirmed/archive states.
- [ ] Pass confirmed strategy documents into every generation prompt.
- [ ] Add source links and evidence references to strategy decisions.

## 2. AClienti — Customer Intelligence

- [ ] Build the customer-signal list and detail view.
- [ ] Add signal filters: type, score, source, date, status, and buyer stage.
- [ ] Add customer-profile generation from multiple qualified signals.
- [ ] Add profile editing, confirmation, and archive states.
- [ ] Add customer language, objections, goals, buying triggers, and content
  angles.
- [ ] Add public-source discovery integrations where permitted.
- [ ] Add Reddit keyword monitoring and high-intent thread discovery.
- [ ] Summarize community rules before generating responses.
- [ ] Feed confirmed customer profiles into DistroNow, AutoGTM, SEO, GEO, and
  campaign generation.

## 3. DistroNow — Brand and Content Engine

- [ ] Add the Strategy Library to the DistroNow Studio navigation.
- [ ] Add a reusable Agent Feed for recommendations and next actions.
- [ ] Add daily/weekly content recommendations.
- [ ] Add Writer Agent for long-form articles, landing pages, and product copy.
- [ ] Add section-level rewrite and regeneration controls everywhere.
- [ ] Add native X post/thread generation.
- [ ] Add native LinkedIn post/article generation.
- [ ] Add native Reddit response drafting with human review.
- [ ] Add content performance learnings back into future recommendations.
- [ ] Add SEO content briefs based on keyword gaps and customer language.
- [ ] Add GEO content briefs based on missing AI-search questions.

## 4. accman — Account Manager

- [ ] Create the account-management dashboard.
- [ ] Add account connection flows for LinkedIn, X, Instagram, TikTok, and
  YouTube.
- [ ] Store OAuth credentials securely and scope them per project/account.
- [ ] Add account health, connection errors, permissions, and pause controls.
- [ ] Build the visual content calendar.
- [ ] Add drag-and-drop or edit-in-place scheduling.
- [ ] Connect approved DistroNow posts to scheduled-post records.
- [ ] Add platform-specific content adaptations.
- [ ] Add publish-now, schedule, retry, fail, and rollback states.
- [ ] Add publishing packages for platforms without direct API support.

## 5. Analytics and learning loop

- [ ] Connect platform analytics APIs.
- [ ] Store daily post metrics snapshots.
- [ ] Add account, platform, post, campaign, and audience dashboards.
- [ ] Calculate engagement rate, click-through rate, conversion rate, and
  cost-per-result where cost data exists.
- [ ] Compare best and worst posts.
- [ ] Identify winning hooks, formats, channels, audiences, and publishing
  times.
- [ ] Generate weekly performance summaries.
- [ ] Turn performance findings into Agent Feed recommendations.

## 6. AutoGTM — Customer Acquisition

- [ ] Build the AutoGTM module home.
- [ ] Add ICP Builder connected to AClienti and the Strategy Library.
- [ ] Add company search provider integration.
- [ ] Add people/contact search provider integration.
- [ ] Add lookalike-company search.
- [ ] Add adjacent-segment and TAM exploration.
- [ ] Add prospect evidence and fit-score review.
- [ ] Add acquisition campaigns by customer segment.
- [ ] Add personalized email drafting.
- [ ] Add message review and approval queue.
- [ ] Add reply classification: interested, objection, not now, wrong person,
  unsubscribe, and out of office.
- [ ] Add reply drafting with human approval.
- [ ] Add calendar booking integration.
- [ ] Add meeting, opportunity, and revenue attribution.
- [ ] Add campaign metrics: sends, replies, positive replies, meetings, and
  cost per lead.

## 7. Outreach safety and compliance

- [ ] Add suppression and unsubscribe lists.
- [ ] Add per-domain and per-campaign sending limits.
- [ ] Add opt-out handling that immediately stops future messages.
- [ ] Store source, timestamp, and lawful-basis metadata for prospect data.
- [ ] Add personalization evidence so unsupported claims can be corrected.
- [ ] Add sending-domain health monitoring.
- [ ] Add full outreach audit logs.
- [ ] Default to human approval before sending, replying, or booking.
- [ ] Review GDPR, ePrivacy, CAN-SPAM, platform rules, and provider terms.

## 8. ClipRO — Video Repurposing

- [ ] Connect ClipRO's long-video upload/import workflow.
- [ ] Add transcription and timestamp extraction.
- [ ] Add clip candidate scoring.
- [ ] Add clip review and trimming.
- [ ] Save approved clips into the DistroNow asset library.
- [ ] Send approved clips to accman scheduling.
- [ ] Track clip performance by source video and platform.

## 9. AutoArt — Music Creation link

- [ ] Keep AutoArt as a separate product/workspace.
- [ ] Define the release handoff schema: artist, track, artwork, metadata,
  release date, rights, and promo assets.
- [ ] Send approved releases into accman campaigns.
- [ ] Generate music-specific captions, clips, and account plans.
- [ ] Track release and promo performance across accounts.

## 10. Streamwin — AI Livestream Chatters

- [ ] Define the stream/session data model.
- [ ] Connect Twitch, YouTube Live, and TikTok Live destinations.
- [ ] Add video input and frame sampling.
- [ ] Add video-recognition model provider.
- [ ] Add multiple chatter-agent profiles with different roles and tones.
- [ ] Add chat moderation, cooldowns, rate limits, and escalation rules.
- [ ] Add human override and emergency stop.
- [ ] Log every agent observation and chat message.
- [ ] Measure chat engagement, retention, and moderation outcomes.

## 11. Background agents and jobs

- [ ] Add a scheduled-job runner.
- [ ] Run daily customer-signal collection.
- [ ] Run daily SEO checks.
- [ ] Run GEO visibility checks.
- [ ] Generate daily content suggestions.
- [ ] Generate weekly performance summaries.
- [ ] Retry failed generation, publishing, and analytics jobs safely.
- [ ] Add job status, logs, retries, and failure notifications.
- [ ] Add a worker/queue when synchronous server routes are no longer enough.

## 12. SEO and GEO

- [ ] Add SEO audit provider and site crawl boundary.
- [ ] Track keyword positions and competitor pages.
- [ ] Check metadata, headings, canonicals, internal links, images, and
  performance.
- [ ] Generate two prioritized fixes per day with copy-ready snippets.
- [ ] Add Google Search Console integration.
- [ ] Add AI visibility checks across ChatGPT, Perplexity, Claude, and Gemini.
- [ ] Track AI mentions, sentiment, position, and competitor share of voice.
- [ ] Generate structured FAQ, comparison, and source-content recommendations.
- [ ] Add optional GitHub pull requests for technical fixes.

## 13. Integrations and messaging surfaces

- [ ] WordPress publishing.
- [ ] Webflow publishing.
- [ ] Framer publishing.
- [ ] Wix publishing.
- [ ] Sanity publishing.
- [ ] Google Analytics.
- [ ] Google Search Console.
- [ ] GitHub.
- [ ] WhatsApp notifications and approvals.
- [ ] Telegram notifications and approvals.
- [ ] Slack notifications and approvals.

## 14. Quality, security, and product polish

- [ ] Add end-to-end tests for the complete business-to-publishing flow.
- [ ] Add tests for project ownership on every new operations route.
- [ ] Add tests for approval-state transitions.
- [ ] Add tests for suppressed prospects and unsubscribe handling.
- [ ] Add empty, loading, error, and retry states to every module.
- [ ] Replace remaining raw `<img>` elements with optimized image handling.
- [ ] Add structured error logging and provider health checks.
- [ ] Add rate limits for expensive research and generation actions.
- [ ] Add usage/credit tracking for video and image generation.
- [ ] Add data export and project deletion for user control.
- [ ] Review accessibility, keyboard navigation, and mobile layouts.

## Suggested next session

Start with these five items:

1. Apply and verify the Supabase migration.
2. Build the Strategy Library UI.
3. Build the AClienti signal/profile UI.
4. Build the accman calendar and account dashboard.
5. Add the first real publishing integration, preferably LinkedIn or X.

## 15. Local content consolidation — initial pass complete

- [x] Review `/Users/vicorico/content` for reusable product and strategy work.
- [x] Move the strongest reusable material into the in-app Content Intelligence
  Library.
- [x] Add content mix, hooks, angles, formats, virality, lead magnets, UGC,
  characters, slideshows, niche validation, agent operations, and conversation
  campaign playbooks.
- [x] Add a workspace route for reading the playbooks before creating content.
- [x] Keep old brand workspaces recoverable while presenting one main Marketing
  OS workspace in the project list.
- [x] Add a full in-app Marketing OS Blueprint with the product flow, category
  boundaries, source migration map, and remaining capability gaps.
- [ ] Make the library editable and project-aware.
- [ ] Let generation flows select a library playbook and persist that choice.
- [ ] Add source file links and versioning for imported knowledge.

## 16. Postiz findings from `/Users/vicorico/content/postiz-app`

The content directory is the Postiz application. It provides a strong
reference implementation for accman and should influence our roadmap.

## 17. Marketing repository consolidation — module surfaces added

- [x] Add AClienti module surface with its real research, scoring, brief, and
  evidence workflows.
- [x] Add accman module surface with accounts, niches, formats, trends, prompts,
  plans, and creative research briefs.
- [x] Add ClipRO module surface with ingest, transcript, candidate scoring,
  rendering, jobs, and scheduling handoff.
- [x] Add Reclip source preparation and download-job surface.
- [x] Add AutoArt artist, song, release, promo, and analytics surface.
- [x] Add Streamwin live studio, destinations, IRL, vision, and event surface.
- [x] Add MassCall voice-agent campaign surface.
- [x] Connect each category to the shared project workspace and handoff map.
- [ ] Replace module reference surfaces with persistent project records and
  provider-backed actions.
- [ ] Move shared source schemas into Supabase and connect each module’s actual
  operations to the database.

## 18. Unified auth and source-data migration

- [x] Make DistroNow Supabase magic-link auth the single login boundary.
- [x] Add a project-owned `module_records` migration table.
- [x] Add idempotent source seed import for AClienti, accman, ClipRO, Reclip,
  AutoArt, Streamwin, and MassCall.
- [x] Add a migration dashboard under the authenticated project workspace.
- [ ] Replace source seed records with full editable module records and forms.
- [ ] Add module-specific import/export for complete localStorage snapshots.
- [ ] Move provider credentials, OAuth, media, jobs, and analytics into secure
  project-owned services.

## 19. Core/companion boundary

- [x] Keep AClienti and accman inside the main DistroNow app as core utilities.
- [x] Combine ClipRO and Reclip into one video-repurposing category.
- [x] Add Video Generation as a core DistroNow category using the fal queue
  workflow and existing product-video generation.
- [x] Keep AutoArt, Streamwin, and MassCall as separate companion apps.
- [ ] Add explicit companion-app URLs and authenticated handoff callbacks when
  those apps have their own deployed environments.
- [x] Remove the local `ACLIENTI` and `accman` source projects after core
  utility migration.

### Add to accman

- [ ] Use a real calendar-first publishing workspace.
- [ ] Add a post composer that supports one post adapted across multiple
  platforms.
- [ ] Add per-platform previews and validation before scheduling.
- [ ] Add drafts, scheduled, published, failed, and missing-content states.
- [ ] Add repeat/evergreen posts and recurring schedules.
- [ ] Add bulk post creation and bulk scheduling.
- [ ] Add content sets/tags for campaigns, launches, and reusable groups.
- [ ] Add a “find next open slot” scheduling action.
- [ ] Add post comments and team review threads.
- [ ] Add team members, roles, permissions, and approval ownership.
- [ ] Add a media library with search, thumbnails, upload, and reuse.
- [ ] Add provider-specific media settings and image/video validation.
- [ ] Add direct integrations for the major social platforms through official
  OAuth flows.
- [ ] Add an integration health page with missing scopes, refresh state, and
  reconnect actions.
- [ ] Add account-level and post-level analytics.
- [ ] Add trending content and reusable inspiration records.

### Add to the whole marketing OS

- [ ] Add a public API for creating drafts, scheduling posts, reading status,
  and retrieving analytics.
- [ ] Add webhooks for post published, post failed, campaign completed, and
  analytics updated events.
- [ ] Add n8n, Make, and Zapier-compatible automation boundaries.
- [ ] Add chat-based actions for creating content, generating a post, and
  scheduling approved work.
- [ ] Add generated image and video providers behind a provider-neutral media
  job interface.
- [ ] Add post groups/launches that connect strategy, assets, posts, and
  results.
- [ ] Add organization/team workspaces for agencies managing multiple brands.
- [ ] Add agency/client separation with client review and approval flows.
- [ ] Add notifications for approvals, failures, missing connections, and
  performance reports.

### Useful Postiz architecture ideas to reproduce

- [ ] Treat every social platform as a provider with its own schema,
  validation, limits, and preview—not as a generic text box.
- [ ] Keep integrations behind a common manager/interface so new platforms do
  not change the calendar or project model.
- [ ] Use background workflows for scheduling and publishing retries.
- [ ] Keep platform OAuth credentials server-side and let the platform handle
  authentication directly.
- [ ] Store media separately from post records so assets can be reused.
- [ ] Keep comments, tags, and post groups as first-class records.

### Licensing and integration note

Postiz is licensed under AGPL-3.0. We can use it as a product and architecture
reference, or operate it as a separate publishing service, but copying its
code into DistroNow requires an explicit licensing decision and compliance
review. The safest path is to reproduce the concepts and contracts in our own
implementation, or connect to Postiz through its public API/SDK where that is
appropriate.
