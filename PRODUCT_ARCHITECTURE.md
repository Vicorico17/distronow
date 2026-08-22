# DistroNow Marketing OS

DistroNow is the single marketing workspace. It has two connected parts inside
one project, one brand system, and one asset library:

1. **DistroNow Studio** — brand understanding, best-customer discovery,
   content creation, and campaign creation.
2. **accman** — account management, content planning, publishing, and
   performance analytics.

The handoff between the parts is the approval state. Content is created in
DistroNow Studio, becomes available to accman when approved,
and returns performance data to the same project.

## Product model

```text
Project / Brand
├── Brand system
│   ├── identity, colors, fonts, logo, voice
│   ├── audiences, pain points, objections, buying triggers
│   └── research signals and source material
├── DistroNow Studio
│   ├── brand system and content creation
│   ├── best-customer discovery and customer personas
│   ├── hooks, formats, prompts, and briefs
│   ├── posts, scripts, carousels, images, video, UGC
│   ├── campaigns and creative calendars
│   └── review → approve
└── accman
    ├── social accounts and platform connections
    ├── account-specific content queues
    ├── scheduling and publishing
    ├── post performance and analytics
    └── best/worst-performing content feedback
```

## What stays in DistroNow

The existing DistroNow work is the starting product, not a separate service to
split apart. Keep these capabilities in the unified workspace:

- website-to-brand extraction and editable brand review;
- best-customer discovery, customer research, and persona generation;
- post hooks, post drafts, scripts, captions, hashtags, and text assets;
- image assets, product videos, carousels, slideshows, UGC briefs;
- campaigns and 7-day/30-day calendars;
- saved library, export, approval, and published states;
- project ownership, anonymous-project claiming, authentication, and storage.

## Incoming capabilities

Each incoming app remains a named category. We share the underlying project,
brand, audience, asset, and status data, but do not flatten the products into
one undifferentiated feature list.

### Category: AClienti / Customer Intelligence → DistroNow Studio

**What it does:** Finds and describes the customers most likely to need a
product. It turns public customer signals into evidence-backed customer
profiles, pains, objections, buying triggers, and content opportunities.

- public customer-signal capture;
- evidence, source, date, and reachability fields;
- pain/fit/timing/evidence scoring;
- ranked opportunity view;
- signal-derived content briefs.

This becomes a distinct **AClienti — Customer Intelligence** area inside
DistroNow Studio. Its output is a custom customer/persona profile: who needs
the product, what they care about, what language they use, and what the brand
should create next. Its profiles feed DistroNow content generation while its
evidence and scoring remain separate.

### Category: accman / Account Manager

**What it does:** Manages every social account and turns approved content into
an operating publishing plan. It schedules content, publishes it where
connected, and shows which accounts, posts, hooks, and formats perform best or
worst.

Keep accman as a distinct category containing:

- TikTok, Instagram, YouTube, and future platform accounts;
- account status, follower metadata, niche, and channel ownership;
- account-specific queues and publishing assignments;
- content planning and scheduling;
- post performance analytics;
- comparisons showing which posts perform and which do not;
- feedback on the strongest accounts, formats, hooks, and channels.

accman owns the complete loop:

```text
idea → planned → ready → approved → published → measured → learnings
```

### Category: ClipRO / Video Repurposing

**What it does:** Takes a long video and finds the strongest moments to turn
into short clips. It is focused on clipping and rendering, not general content
strategy or account management.

ClipRO stays narrowly scoped as its own category. It takes long videos and
finds/renders the strongest short clips. Those clips can be approved in
DistroNow and then planned or measured in accman.

### Category: AutoArt / Music Creation

**What it does:** Creates and manages music projects, artists, songs, albums,
releases, metadata, and music-specific promotional assets. It remains a
separate music product, with accman as its promotion and distribution link.

AutoArt is a separate product and should not be absorbed into DistroNow or
accman. It owns:

- artist and music creation;
- songs, releases, albums, and metadata;
- music-specific assets.

AutoArt should connect to accman. Approved releases and promo assets flow into
accman, where they can be assigned to accounts, scheduled, published, and
measured. DistroNow can optionally provide the brand and audience context for
the promotional content.

### Category: Streamwin / AI Livestream Chatters → accman

**What it does:** Deploys multiple AI agents as livestream chatters. Each agent
watches the livestream through a video-recognition model, understands what is
happening on screen, and writes relevant messages in the chat. Streamwin is
connected to accman because the livestream destinations, accounts, content,
and performance belong there.

Do not add Plecat Mood to DistroNow.

### Category: DistroNow / Brand and Content Engine

**What it does:** Turns a website, brand system, and customer understanding
into on-brand marketing content. It is the main creative workspace for
creating content, building campaigns, and approving assets for accman.

The existing DistroNow functionality remains its own distinct category and is
the central studio foundation:

- brand extraction and brand review;
- best-customer discovery, audiences, and personas;
- hooks, posts, scripts, captions, and assets;
- campaign calendars;
- approvals and the shared library.

## Navigation

The unified workspace should use this top-level structure:

- **Overview** — what needs attention now;
- **DistroNow Studio** — DistroNow Brand and Content Engine, AClienti Customer
  Intelligence, and ClipRO Video Repurposing;
- **accman** — Account Manager, content planning, publishing, analytics, and
  Streamwin AI Livestream Chatters;
- **AutoArt** — separate Music Creation product linked to accman;
- **AutoGTM** — separate Customer Acquisition product linked to AClienti,
  DistroNow, and accman;
- **Library** — every post, asset, campaign, and export;
- **Brand** — the source of truth used by both modules;
- **Analytics** — performance by project, channel, campaign, and asset.

The first implementation can keep the current routes and progressively add
these sections. The important invariant is that all connected categories read
and write the same project, audience, campaign, asset, release, and status
records.

## Category interaction rule

Every category is presented as a self-contained product surface inside the
same app. Clicking a category opens a dedicated module home with:

- the category name and a one-sentence explanation of what it does;
- its own dashboard and terminology;
- its own primary action;
- the records and workflows that belong to it;
- clearly labeled connections to the other categories;
- recent activity and useful metrics for that category.

| Category | Module home | Primary action |
| --- | --- | --- |
| DistroNow | Brand and Content Engine | Create content from brand/customer context |
| AClienti | Customer Intelligence | Build a customer/persona profile |
| accman | Account Manager | Plan, publish, and analyze posts |
| ClipRO | Video Repurposing | Find and render the best clips |
| AutoArt | Music Creation | Create a release and send it to promotion |
| Streamwin | AI Livestream Chatters | Deploy video-aware chat agents |

The categories share data and navigation, but each should feel like a complete
tool when opened.

## Source repository consolidation

The current workspace now has module surfaces for the actual marketing
repositories in `/Users/vicorico/code`, not only conceptual placeholders:

- **AClienti** — research lens, public signals, weighted qualification, buyer
  stages, evidence-linked opportunities, and content briefs;
- **accman** — accounts, niches, formats, trend inbox, prompts, content plans,
  creative research briefs, and publishing states;
- **ClipRO** — source connections, URL/upload ingest, transcripts, candidate
  scoring, jobs, captions, rendering, and scheduling handoff;
- **Reclip** — source inspection, playlist preparation, download jobs, status,
  thumbnails, and transfer into ClipRO;
- **AutoArt** — artists, Song Lab, provider queue, releases, metadata exports,
  promo plans, and analytics imports;
- **Streamwin** — live scenes, AI effects, destinations, IRL controls, vision
  automations, events, and future chatter-agent controls;
- **MassCall** — voice-agent use cases, qualification, support, reception,
  booking, vertical workflows, and outcome attribution.

Each module has a dedicated route under `/projects/[id]/modules/[module]` and
is connected to the same project workspace. The module pages document the
imported capabilities and handoffs while provider credentials, OAuth, workers,
and production media jobs remain explicit implementation steps.

## Content directory import

The local directory at `/Users/vicorico/content` has now been reviewed. Its
useful material is represented in the project-level Content Intelligence
Library at `src/lib/content-library.ts` and exposed at
`/projects/[id]/content-library`.

The imported material covers:

- `Research & Signals` — research notes and source-backed observations;
- `Formats` — repeatable content structures;
- `Prompt Library` — prompts and generation instructions;
- `Playbooks` — audience, hook, campaign, and channel rules;
- `Templates` — reusable briefs and publishing packages.

Specifically, the first library includes content mix, hook patterns, creative
angles, formats, virality, comment-to-email lead magnets, UGC production,
consistent characters, slideshow audits, niche validation, calendar-first
publishing, agent-feed decisions, and reviewed conversation campaigns. The
source prototypes remain reference material; DistroNow owns the product
workflow and its project data.

The material should be stored as project-independent knowledge where possible,
then referenced by projects. Brand-specific content remains inside the
project workspace.

For a full review of the resulting product direction, open the project
**Marketing OS Blueprint**. It explains the end-to-end system, the role of each
category, the local-source migration map, and which work is implemented versus
still planned.

## Naming decision

Keep the application repository and product name as **DistroNow** for now,
because it is the most developed implementation. The user-facing promise can
be broadened from “distribution workspace” to **the marketing operating system
for creating and distributing brand content**. Okara/Okara 2.0 can be treated
as the Content Studio experience or future product branding once its source
website is available for direct migration.

## Explee research: capabilities to bring into DistroNow

Explee is not primarily a content tool. Its strongest contribution is the
missing conversion layer between customer intelligence and distribution: it
turns a website into an ICP, finds matching companies and people, writes
personalized outreach, handles replies, books meetings, and reports campaign
economics. Explee presents this as one pipeline: learn what is sold → define
who buys → find the right people → write individually relevant emails → manage
replies and meetings → learn which segments produce the best cost per lead.

This should become a separate **AutoGTM — Customer Acquisition** category in
the marketing super app. It should connect to AClienti, DistroNow, and accman,
but should not be hidden inside any of them.

### AutoGTM module: what it does

**What it does:** Finds qualified prospects and turns them into reviewed,
personalized conversations and booked meetings. It is the outbound and demand
conversion surface of the app.

#### Intake and research

- paste a website or describe the business when no website exists;
- extract the product, offer, market, and business model;
- research competitors automatically;
- sharpen the ICP and propose multiple customer segments;
- show the evidence behind each segment and fit score.

#### Prospect discovery

- search companies by a natural-language description;
- filter by industry, geography, company size, team structure, and business
  model;
- find people by job title, seniority, industry, and geography;
- find lookalike companies from a best existing customer or domain;
- explore neighboring segments and estimate the total addressable market;
- support local-business discovery using category, location, ratings, reviews,
  hours, photos, and contact fields where legally available.

#### Personalized outreach

- generate a distinct email for each prospect using their company context;
- connect the message to a specific pain, trigger, or relevant proof;
- generate subject lines, opening paragraphs, CTA, and follow-up sequence;
- keep the selected customer segment, brand voice, and offer visible beside the
  draft;
- allow bulk review while preserving individual personalization.

#### Reply and meeting workflow

- classify replies as interested, objection, not now, wrong person, unsubscribe,
  or out of office;
- draft suggested responses grounded in the original email and company facts;
- require approval for sensitive or ambiguous replies;
- offer booking links and calendar availability;
- track booked meetings, show rate, opportunity stage, and closed outcome.

#### Learning loop

- show campaigns by segment and status: scaling, working, paused, or needs
  review;
- report sends, replies, positive replies, meetings, opportunities, and
  cost per lead;
- compare segments, subject lines, offers, and personalization patterns;
- recommend where to increase, reduce, or stop effort;
- feed validated objections and winning language back into AClienti and the
  DistroNow Strategy Library.

### How Explee connects to our existing categories

```text
AClienti
customer signals, pains, ICP, personas
        ↓
AutoGTM
prospect search, personalization, outreach, replies, meetings
        ↓
accman
account and channel activity, campaigns, performance
        ↑
DistroNow
brand voice, offers, proof, content, landing pages, campaigns
```

- **AClienti → AutoGTM:** customer segments, pain language, buying triggers,
  and evidence become prospect-search and personalization inputs;
- **DistroNow → AutoGTM:** brand voice, positioning, offers, proof points,
  landing pages, case studies, and relevant content become outreach context;
- **AutoGTM → AClienti:** reply themes, objections, fit outcomes, and booked
  meetings improve customer profiles;
- **AutoGTM → accman:** campaign activity and content responses become part of
  the overall account and performance view;
- **AutoGTM → DistroNow:** winning objections and prospect language become
  future content topics, FAQs, landing pages, and SEO/GEO opportunities.

### Explee-inspired module home

When the user opens AutoGTM, the module should feel like a complete product:

- **ICP Builder** — define and validate who to target;
- **Company Search** — discover matching accounts;
- **People Search** — discover relevant decision-makers;
- **Lookalikes** — find businesses similar to proven customers;
- **Segments Explorer** — visualize adjacent markets and TAM;
- **Campaigns** — launch and manage outreach by segment;
- **Inbox** — review replies and suggested responses;
- **Meetings** — track booked demos and outcomes;
- **Performance** — cost per lead, reply rate, meeting rate, and revenue.

The opening dashboard should show:

```text
ICP → segment → prospects → reviewed emails → replies → meetings → revenue
```

### Guardrails before we automate outreach

Outbound execution has higher legal, reputational, and deliverability risk than
content drafting. DistroNow should build these protections into the category:

- explicit approval before a campaign sends;
- per-segment and per-domain sending limits;
- suppression and unsubscribe lists;
- opt-out handling that immediately stops future contact;
- source, timestamp, and lawful-basis record for prospect data;
- visible personalization evidence so the user can correct false claims;
- separate sending identity and domain-health monitoring;
- no fabricated personal details or unsupported business claims;
- audit log for every generated, approved, sent, and replied message;
- configurable human-only mode for replies and meeting booking.

The initial release should support research, prospect lists, personalized draft
emails, and a human-approved campaign queue. Automatic sending, reply handling,
and meeting booking should follow only after compliance and deliverability
checks are in place.

### Recommended Explee integration order

1. ICP Builder powered by AClienti and the DistroNow Strategy Library;
2. lookalike companies and natural-language company search;
3. prospect profiles with evidence and fit scores;
4. personalized email drafting and review queue;
5. campaign and reply tracking;
6. calendar booking and revenue attribution;
7. optional approved automation with limits and auditability.
