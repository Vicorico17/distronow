# DistroNow feature research and implementation shortlist

Research date: 11 November 2026. Scope: DistroNow's local implementation, Explee, Okara, and the requested Streamwin expansion.

**Recommendation:** build a shared strategy, work queue, execution, and measurement layer across the existing categories. Keep their separate pages; connect their work through common project records.

This is a research backlog, not an implementation-complete list. Competitor features below are publicly documented or advertised, not independently tested in paid accounts. Priority and proposed acceptance criteria are our product recommendations. “Partial” means local code exists; it does not establish production readiness or configured credentials.

## What is already present

- Brand extraction, audience and content generators, campaign calendars, and asset endpoints exist.
- ACCMAN has an account vault and planning utilities; full social publishing is unfinished.
- Leads Finder has research and acquisition workflows. `src/lib/acquisition-providers.ts` contains Explee/Treg discovery and email enrichment, AI drafts, and restricted SMTP sending. `src/lib/acquisition.ts` contains approval, suppression, daily limits, replies, meetings, and outcome tracking. Calendar integration is explicitly manual. Provider calls were not executed during this research.
- LORO has initial creator/campaign records and selections; it does not verify consent or execute payouts.
- Streamwin has a prototype studio and agent records; no actual video observation or live chat execution is connected.
- ClipRO, AutoArt, fal integration, and several search/launch categories still have substantial handoff work.
- The 30-page module directory is navigation coverage, not 30 complete production products.

Code anchors: [module catalog](../../src/lib/module-catalog.ts), [directory](../../src/lib/module-directory.ts), [acquisition providers](../../src/lib/acquisition-providers.ts), [acquisition state](../../src/lib/acquisition.ts), [brand model](../../src/lib/brand.ts), [campaign generator](../../src/lib/campaign-generator.ts), [Streamwin dashboard](../../src/components/twitch-stream-dashboard.tsx), [LORO dashboard](../../src/components/loro-dashboard.tsx).

## The first six priorities

| Order | Deliverable | Why first | Acceptance criterion |
|---|---|---|---|
| 1 | Versioned project strategy | Every module needs consistent facts and positioning | Approved product, customer, competitor, voice, and content documents; each draft records its source version |
| 2 | Shared work and approval inbox | Makes the separate categories operate together | Content, leads, creator deliverables, and fixes appear with owner, evidence, status, and next action |
| 3 | One real publishing connection | Turns approved drafts into measurable output | One channel publishes once, records the external ID, handles failure/retry, and shows its real state |
| 4 | Acquisition provider validation and inbound replies | Completes existing Leads Finder foundations | Validate discovery/enrichment contracts, receive replies, stop follow-ups on reply/opt-out, reconcile uncertain sends |
| 5 | Search and conversion baseline | Gives prioritization real evidence | Connect Search Console/GA4, show sync timestamps, and attribute campaign visits and conversions |
| 6 | Streamwin vision-to-chat pilot | Directly addresses the requested livestream workflow | An authorized stream produces timestamped observations and reviewed chat suggestions; then one authorized bot can send within limits |

Ship these as end-to-end slices. Do not begin by launching every background agent simultaneously.

## 60-feature backlog

Priority: **P0** shared foundation; **P1** next useful capability; **P2** expansion. These labels express recommended order, not delivery dates.

### A. Strategy and brand context — DistroNow Studio / ACLIENTI

Okara documents editable company context, strategy documents, competitor management, and website refresh. DistroNow should build on its existing brand extraction instead of duplicating onboarding. Sources: [Company](https://okara.ai/docs/dashboard/company), [Website Refresh](https://okara.ai/docs/features/website-refresh).

| # | Feature | Priority / gap | Implementation recommendation |
|---|---|---|---|
| 1 | Shared strategy documents | P0 · partial | Product, positioning, competitors, voice, design, and content plan; editable per project |
| 2 | Evidence and document versions | P0 · extend | Preserve source URLs, dates, revisions, and the version used by each draft |
| 3 | Competitor watchlist | P1 · extend | Track chosen competitors, changed offers, and messaging gaps |
| 4 | Website-change refresh | P1 · extend | Show a change diff; preserve user corrections during regeneration |
| 5 | Channel prioritization | P1 · new workflow | Rank channels by buyer fit, effort, budget, and available proof |
| 6 | Audience-specific messaging | P1 · partial | Link each segment to pains, objections, offer, proof, and CTA |
| 7 | Strategy change propagation | P1 · new | Flag affected drafts for review after pricing or positioning changes |

Rows 2, 6, and 7 extend the observed pattern with our own data-quality requirements.

### B. Shared daily work — Operations / all modules

Okara's Agents Feed combines opportunities and drafts, supports current/archive views, and lets operators act on individual cards. Its documentation also describes channel-specific writing instructions. Sources: [Agents Feed](https://okara.ai/docs/dashboard/agents-feed), [Introduction](https://okara.ai/docs/introduction).

| # | Feature | Priority / gap | Implementation recommendation |
|---|---|---|---|
| 8 | Unified action inbox | P0 · partial | Every task links to its project, originating category, evidence, and output |
| 9 | Draft / edit / approve / reject / archive | P0 · partial | One consistent lifecycle with approval invalidated after material edits |
| 10 | Per-channel writing settings | P1 · partial | Tone, examples, prohibited claims, topics, and format preferences |
| 11 | Scheduled agent runs | P1 · new infrastructure | Durable jobs with pause, retry, deduplication, and spend caps |
| 12 | Daily priority digest | P1 · new | Recommend a small set of valuable actions, with reasons |
| 13 | Explainable execution log | P0 · extend | Show inputs, changes, costs, failure reason, and what actually happened |

Rows 11–13 are proposed execution requirements, not claims about a competitor's internals.

### C. Buyers and acquisition — ACLIENTI / Leads Finder / AutoGTM

Explee advertises website-led targeting, personalized outreach, reply handling, meetings, and campaign economics. Its API documents company/person search, domain lookup, criteria scoring, deduplication, and signed reply/hot-lead webhooks. Its market explorer and local-business dataset suggest additional discovery surfaces. Sources: [Explee](https://explee.com/), [API](https://api.explee.com/public/api/docs), [Segments Explorer](https://explee.com/tools/explorer), [Local businesses](https://explee.com/gm-dataset).

| # | Feature | Priority / gap | Implementation recommendation |
|---|---|---|---|
| 14 | Website-to-ICP setup | P1 · partial | Offer, disqualifiers, decision-maker roles, and editable target segments |
| 15 | Natural-language company search | P1 · extend | Company-first search alongside current person discovery |
| 16 | Evidence-backed buyer qualification | P0 · partial | Show reasons, source freshness, and uncertainty beside fit scores |
| 17 | Segment exploration | P2 · new | Neighboring niches and provider-backed counts; avoid fabricated market sizes |
| 18 | Local-business prospecting | P2 · new | Geography, category, business status, and available review/contact fields |
| 19 | CSV import and exclusions | P1 · extend | Preview mappings; deduplicate people/domains and preserve suppressions |
| 20 | Personalization and follow-up sequences | P1 · partial | Evidence-linked drafts; timed follow-ups stop on reply, meeting, or opt-out |
| 21 | Reply inbox and qualification | P0 · partial | Ingest inbound replies; suggest classification and human-reviewed answers |
| 22 | Calendar and CRM handoff | P1 · partial | Replace manual booking state with verified events and stable CRM identifiers |
| 23 | Segment economics | P1 · partial | Cost per positive reply, held meeting, and won customer; separate credits from currency |

Implementation finding: validate the existing adapter before expansion. Its discovery availability check accepts either provider, while the Explee call needs Explee's own key. Explee credits are also passed into generic event-cost fields; confirm units before displaying financial totals. Neither issue was changed in this research task.

Lookalikes remain a useful **DistroNow proposal**, but a dedicated lookalike endpoint was not verified in the reviewed Explee API. Do not mark it as a confirmed integration. Managed sender infrastructure is a later integration decision, not a reason to build our own mailbox network now.

### D. Search and website execution — SEO / GEO

Okara describes recurring audits, prioritized fixes, AI-answer visibility, competitor comparisons, and code changes submitted through GitHub. Sources: [SEO](https://okara.ai/agent/seo), [GEO](https://okara.ai/agent/geo), [Coding](https://okara.ai/agent/coding).

| # | Feature | Priority / gap | Implementation recommendation |
|---|---|---|---|
| 24 | Search Console and GA4 baseline | P0 · missing connection | Queries, pages, traffic, and conversions with sync status |
| 25 | Technical audit queue | P1 · overview today | Detect broken links, missing metadata, indexability, and oversized images |
| 26 | Keyword and content gaps | P1 · overview today | Convert relevant gaps into briefs with evidence and priority |
| 27 | Topic clusters and internal links | P1 · overview today | Map existing pages and propose useful new links/content |
| 28 | AI-answer monitoring | P1 · new | Store prompt, model, date, response, mentions, and citations |
| 29 | Competitor visibility comparison | P2 · new | Compare the same question set across brands; retain raw evidence |
| 30 | Reviewable SEO pull requests | P2 · new | Produce small patches, test them, and connect each to an audit finding |
| 31 | Re-audit and outcome tracking | P1 · new | Check whether a shipped fix resolved its issue and changed measured outcomes |

For GEO, measure observations rather than promise placement. Treat llms.txt as an optional experiment, not a guaranteed ranking mechanism. Audit, evidence, and publishing connections are prerequisites for an autonomous fixing agent.

### E. Creator campaigns and production — LORO / Video Generation / ClipRO

Okara's influencer flow covers matching, rates, briefs, deliverables, and payouts. Its page identifies X/LinkedIn as live influencer channels and Instagram/YouTube/TikTok as upcoming. Its UGC page exposes settings and credit estimates before generation. Sources: [Influencer](https://okara.ai/agent/influencer), [UGC video](https://okara.ai/agent/ugc-video).

| # | Feature | Priority / gap | Implementation recommendation |
|---|---|---|---|
| 32 | Creator discovery and shortlist | P1 · LORO manual today | Match by niche, audience, language, channel, and budget |
| 33 | Offers and rate tracking | P1 · new | Keep agreed fee, deliverables, dates, and approval history together |
| 34 | Creator acceptance and licensing | P1 · notes only today | Creator-facing acceptance; explicit usage scope and expiry |
| 35 | Deliverable review | P1 · new | Versioned submission, feedback, revisions, and accepted asset |
| 36 | Payout and campaign results | P2 · new | Accepted deliverables trigger reviewed payout workflow; attach actual post URLs |
| 37 | Guided UGC generation | P1 · partial | Brief, script, aspect ratio, duration, previewed cost, and job status |
| 38 | Campaign asset variants | P1 · partial | Produce captions/crops/cuts from an approved master and hand them to ACCMAN |

Keep creator licensing separate from permission to synthesize a person's likeness or voice. LORO's current selection button is not proof of either.

### F. Publishing, collaboration, and control — ACCMAN / core workspace

Okara documents CMS/social connections, analytics, chat access, sharing, localization, and MCP. Sources: [Integrations](https://okara.ai/docs/integrations/overview), [Team Sharing](https://okara.ai/docs/features/team-sharing), [Localization](https://okara.ai/docs/features/localization), [MCP](https://okara.ai/mcp).

| # | Feature | Priority / gap | Implementation recommendation |
|---|---|---|---|
| 39 | Real social publishing | P0 · unfinished | Start with one channel; preserve approval, external ID, and retry history |
| 40 | CMS publishing | P1 · new | Start with one CMS, then add adapters for other site systems |
| 41 | Connection health | P0 · partial | Show permissions, expiry, last sync, failure, and reconnect action |
| 42 | Campaign attribution | P1 · partial | Consistent campaign IDs and UTMs from asset through visit and conversion |
| 43 | Team and client access | P1 · extend | Project-specific editor, reviewer, and viewer roles with revocable access |
| 44 | Portfolio overview | P1 · extend | All brands' pending work, failed jobs, spend, and results |
| 45 | Multilingual campaigns | P1 · extend | Separate UI language, brand voice, and audience locale; start Romanian/English |
| 46 | Assistant/MCP access | P2 · new | Project-scoped read/draft tools, then explicitly authorized execution |
| 47 | Messaging digests | P2 · new | Optional chat notifications linked back to the correct review item |
| 48 | Cost and autonomy controls | P0 · extend | Per-project budgets and channel switches; draft-only, reviewed, or bounded execution |

Portfolio aggregation, Romanian-first scope, and the detailed execution controls are our recommendations. Do not mirror a competitor's access model without defining our own project permissions.

### G. Streamwin (CHATTERS.AI) — livestream, restream, IRL, and video-aware chat

The user specifically requested livestreaming, restreaming (interpreting “Restroom”), IRL controls, Twitch viewer bots, and chatters that watch the stream. Product naming decision: **Streamwin and CHATTERS.AI are the same product**, with Streamwin as the canonical category at `/modules/streamwin` and `/projects/[id]/modules/streamwin`. Do not create a separate CHATTERS.AI module or service. The CHATTERS.AI name describes Streamwin's video-aware chatter capability. During research, `https://chatters.ai/` could not be retrieved and the exact-domain search did not establish its feature set. The external domain remains unverified; the intended capability is defined by the user and belongs to Streamwin.

Restream documents mobile broadcasting, destination selection, scenes, and portrait/landscape output. Twitch documents authorized chatbots. Gemini supports streaming visual/audio context; input support does not itself provide a Twitch stream feed or guarantee accurate scene recognition. Sources: [Restream mobile](https://support.restream.io/en/articles/1035300-stream-from-your-phone), [Restream portrait](https://support.restream.io/en/articles/8544173-stream-in-portrait-mode-in-studio), [Twitch chat](https://dev.twitch.tv/docs/chat/), [Gemini Live](https://ai.google.dev/gemini-api/docs/live-api), [Gemini video](https://ai.google.dev/gemini-api/docs/video-understanding?hl=en).

| # | Feature | Priority / gap | Implementation recommendation |
|---|---|---|---|
| 49 | Live input and preview | P1 · simulated today | Authorized camera/OBS/encoder ingest, real mic/camera state, stream health |
| 50 | Restream destinations | P1 · simulated today | Per-destination credentials, output status, retry, and independent stop |
| 51 | IRL mobile control | P1 · prototype only | Phone camera, scene switching, mic control, and connection telemetry |
| 52 | Disconnect recovery | P2 · new | Reconnect/backoff and fallback scene; evaluate bonding separately |
| 53 | Shared scene observer | P1 · new | One visual/audio analysis pipeline produces timestamped stream events |
| 54 | Stream-aware AI chatter | P1 · new | Generate relevant reactions from current events, recent speech, and chat context |
| 55 | Chatter roles and voices | P1 · records only | Co-host, question responder, and clip scout with configurable language/tone |
| 56 | Chat pacing and controls | P0 for chat · missing | Channel budget, cooldown, deduplication, preview mode, pause, and kill switch |
| 57 | Twitch connection and events | P1 · missing | Authorized bot identity; receive/send messages and display connection failures |
| 58 | Highlight detection → ClipRO | P1 · mapped | Save event timestamps and source reference for clip review/rendering |
| 59 | Viewer-bot request and session accounting | Unresolved | Record requested functionality separately from chat; no verified viewer-delivery integration or promise of counted viewers |
| 60 | Session analytics and campaign handoff | P1 · missing | Separate human audience metrics, bot messages, model costs, highlights, and approved promotional outputs |

**Proposed pipeline:** authorized stream input → sampled frames/audio → shared observer → timestamped events → role-specific response draft → pacing/moderation → authorized Twitch chat → action log. Highlights also feed ClipRO; approved clips feed ACCMAN.

Start with one observer and one bot. Adding personalities should reuse the scene analysis rather than run a full video model for each agent. Benchmark gaming and IRL separately: fast action may be missed by sparse frame sampling. Evaluate response relevance, delay, duplicate rate, and cost per stream-hour before increasing activity.

Gemini's reviewed Live capabilities specify individual video frames at up to one frame per second, session-management constraints, and model-dependent response modalities. Audio-native models may require output transcription for text. A text-generation path over sampled images is an alternative for the first chat pilot. Sources: [Live capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities?authuser=14), [Streaming reasoning](https://ai.google.dev/gemini-api/docs/robotics-streaming?authuser=19).

Chat presence and actual video viewership are different. Twitch's help material explicitly distinguishes bots in chat from counted viewers. Keep feature #59 unresolved rather than suggesting that adding chatters increases viewer count. Source: [Viewer count vs. users in chat](https://help.twitch.tv/s/article/understanding-viewer-count-vs-users-in-chat?language=en_US).

## Delivery sequence and scope decisions

1. **Foundation:** strategy versions, project permissions, shared inbox, durable jobs, integration health, and cost units.
2. **First operating loops:** one publishing channel; acquisition validation/inbound replies; real analytics baseline; Streamwin observer-to-chat pilot.
3. **Expansion:** CMS publishing, search audits, creator deliverable workflows, restream/mobile controls, and clip handoffs.
4. **Scale after evidence:** more providers, segment explorer, creator payouts, SEO PRs, assistant access, and broader localization.

Recommended success measures: time to first approved output; percentage of approved work successfully executed; duplicate-send rate; verified cost per held meeting; attributable conversions; creator turnaround; stream-chat relevance and cost per hour.

Do not treat advertised database sizes, guaranteed inbox placement, guaranteed AI citations, or guaranteed audience growth as acceptance criteria. Do not create new branded top-level products for every feature: place subpages under the existing owners above. Explee and Okara are research references, not newly integrated services. No paid services were activated, external messages sent, or application features implemented during this research.
