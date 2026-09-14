export type MarketingModule = {
  slug: string;
  name: string;
  title: string;
  description: string;
  source: string;
  status: string;
  primaryAction: string;
  records: string[];
  workflows: { title: string; steps: string[] }[];
  handoffs: string[];
  importedCapabilities: string[];
};

export const MARKETING_MODULES: MarketingModule[] = [
  {
    slug: "aclienti",
    name: "AClienti",
    title: "Customer Intelligence",
    description:
      "Turn public customer signals into evidence-backed content direction and qualified opportunities.",
    source: "ACLIENTI working MVP",
    status: "Foundation connected",
    primaryAction: "Capture a signal",
    records: [
      "Research lens",
      "Public signals",
      "Qualification scores",
      "Buyer stages",
      "Content briefs",
      "Evidence exports",
    ],
    workflows: [
      {
        title: "Signal desk",
        steps: [
          "Define product, target customer, promised outcome, and disqualifiers",
          "Capture pain, request, workaround, switching, or company-trigger evidence",
          "Preserve source URL, visible date, and response channel",
        ],
      },
      {
        title: "Qualification",
        steps: [
          "Score pain, product fit, timing, reachability, and evidence quality",
          "Calculate score = pain/5×25 + fit/5×25 + timing/5×20 + reach/5×15 + evidence/5×15",
          "Prioritize 80–100 as strong, 65–79 as promising, and below 65 for validation",
        ],
      },
      {
        title: "Content briefs",
        steps: [
          "Convert qualified signals into headline, angle, format, and source-linked brief",
          "Use the customer’s language without implying endorsement",
          "Send confirmed briefs into DistroNow creation",
        ],
      },
    ],
    handoffs: [
      "DistroNow: customer language and content briefs",
      "AutoGTM: qualified business opportunities",
      "Analytics: signal-to-content performance",
    ],
    importedCapabilities: [
      "Product/ICP lens editor",
      "Public source and signal-date capture",
      "Weighted 0–100 qualification",
      "Buyer-stage filtering",
      "Evidence-linked prospect cards",
      "Local content-brief generation",
      "JSON report export",
      "Public-information safety boundary",
    ],
  },
  {
    slug: "accman",
    name: "accman",
    title: "Account Manager",
    description:
      "Manage social accounts, niches, formats, trends, prompts, content plans, publishing states, and performance.",
    source: "accman / Orbit browser MVP",
    status: "Foundation connected",
    primaryAction: "Plan content",
    records: [
      "Accounts",
      "Niches",
      "Content formats",
      "Trend inbox",
      "Prompts",
      "Content plans",
      "Publishing queue",
      "Performance",
    ],
    workflows: [
      {
        title: "Account and niche system",
        steps: [
          "Add Instagram, TikTok, and YouTube accounts",
          "Assign a niche and audience direction to each account",
          "Track connected, idea, active, watching, and archived states",
        ],
      },
      {
        title: "Trend to plan",
        steps: [
          "Save a trend, hook, or observation into the inbox",
          "Dismiss it or turn it into planned content",
          "Choose an account, reusable format, publish date, and status: idea → planned → ready → posted",
        ],
      },
      {
        title: "Creative operations",
        steps: [
          "Save reusable formats with notes",
          "Store custom prompts and copy them into creation",
          "Generate a creative strategy brief with counter-narrative, three angles, hooks, and a five-part shot list",
        ],
      },
    ],
    handoffs: [
      "DistroNow: approved assets and strategy",
      "ClipRO/Reclip: approved clips into content plans",
      "AutoArt: release promo assets",
      "Streamwin: live destinations and automations",
      "Analytics: account and post results",
    ],
    importedCapabilities: [
      "Multi-platform account list",
      "Niche board with status and account coverage",
      "Content format library",
      "Trend inbox",
      "Plan pipeline",
      "Prompt library",
      "Ad research brief",
      "AI UGC product demo",
      "Unboxing",
      "Before/after",
      "Problem → mechanism → relief",
      "Cinematic reveal",
      "Character-led story",
      "Educational comparison",
      "ASMR loop",
      "Music-listening UGC",
      "Warm-audience retargeting",
    ],
  },
  {
    slug: "clipro",
    name: "ClipRO",
    title: "Long-form Video Repurposing",
    description:
      "Find the strongest moments in long videos, streams, and VODs, then render platform-ready clips.",
    source: "clip-ro + reclip working MVPs",
    status: "Pipeline mapped",
    primaryAction: "Import a source",
    records: [
      "Source URLs/playlists",
      "Connected sources",
      "Videos/VODs",
      "Transcripts",
      "Candidate moments",
      "Clip jobs",
      "Rendered clips",
      "Rights status",
    ],
    workflows: [
      {
        title: "Prepare and ingest",
        steps: [
          "Inspect a URL or playlist before downloading",
          "Confirm rights, select the media item, and create a bounded download job",
          "Connect YouTube, Twitch, or Kick, or upload a local video and probe its duration with ffprobe",
        ],
      },
      {
        title: "Find moments",
        steps: [
          "Reuse captions when available, otherwise transcribe with timestamps",
          "Detect keywords, pauses, laughter, audio spikes, visual changes, chat spikes, and source structure",
          "Score hook, clarity, payoff, pacing, platform fit, creator fit, safety, and editability",
        ],
      },
      {
        title: "Render and distribute",
        steps: [
          "Generate only the best candidates",
          "Render 9:16, 1:1, or 16:9 with captions and saved settings",
          "Review rights and quality, then send approved clips to accman",
        ],
      },
    ],
    handoffs: [
      "accman: approved clips become planned posts",
      "DistroNow: captions, titles, hooks, and campaign context",
      "Analytics: clip performance by source video",
    ],
    importedCapabilities: [
      "Playlist/source inspection",
      "Download jobs and status polling",
      "File and thumbnail handoff",
      "YouTube/Twitch/Kick simulated connections",
      "Source syncing and manual URL import",
      "Upload flow",
      "In-memory job states",
      "Transcription fallback",
      "Ranked clip candidates",
      "Local FFmpeg rendering",
      "SRT/timestamp support",
      "Cost-aware Scout/Muscle/Soul/Analyst agent pattern",
    ],
  },
  {
    slug: "email-marketing",
    name: "Email Marketing",
    title: "Lifecycle Campaigns",
    description:
      "Turn approved content and customer segments into permission-based newsletters, nurture sequences, and measurable email campaigns.",
    source: "DistroNow marketing OS roadmap",
    status: "Product boundary defined",
    primaryAction: "Plan an email campaign",
    records: [
      "Subscribers",
      "Segments",
      "Consent events",
      "Templates",
      "Sequences",
      "Email sends",
      "Opens and clicks",
      "Bounces and unsubscribes",
    ],
    workflows: [
      {
        title: "Audience and consent",
        steps: [
          "Import or capture contacts with source, consent, and suppression state",
          "Build segments from customer signals, lifecycle stage, campaign behavior, and brand context",
          "Keep Leads Finder prospects and opted-in marketing subscribers distinct",
        ],
      },
      {
        title: "Create and approve",
        steps: [
          "Turn approved DistroNow content into a newsletter, nurture email, or campaign sequence",
          "Preview subject, preheader, body, CTA, footer, and personalization",
          "Require human approval and a valid sending domain before launch",
        ],
      },
      {
        title: "Send and learn",
        steps: [
          "Send through a verified domain with rate limits and bounce handling",
          "Record delivery, opens, clicks, replies, unsubscribes, and complaints",
          "Feed campaign performance back into content, segments, and customer intelligence",
        ],
      },
    ],
    handoffs: [
      "DistroNow: approved content, offers, and brand voice",
      "AClienti: customer language and segments",
      "Leads Finder: qualified buyers remain one-to-one outreach records",
      "Analytics: email performance and revenue attribution",
    ],
    importedCapabilities: [
      "Newsletter and nurture campaign boundary",
      "Segment and consent model",
      "Template and sequence approval",
      "SPF/DKIM/DMARC domain health",
      "Open/click/bounce/unsubscribe events",
      "Shared suppression and attribution model",
    ],
  },
  {
    slug: "video-generation",
    name: "Video Generation",
    title: "AI Video Studio",
    description:
      "Create the video assets a campaign needs from prompts, reference images, product scenes, characters, and platform requirements.",
    source: "fal-video-runner + DistroNow product video generation",
    status: "Provider boundary ready",
    primaryAction: "Create a video brief",
    records: [
      "Video briefs",
      "Reference images",
      "Model endpoint",
      "Generation jobs",
      "Queue status",
      "Rendered outputs",
      "Usage credits",
    ],
    workflows: [
      {
        title: "Brief and references",
        steps: [
          "Choose text-to-video, image-to-video, or reference-to-video",
          "Add product, character, scene, motion, duration, aspect ratio, and negative constraints",
          "Upload approved reference images through server-side storage",
        ],
      },
      {
        title: "Generation queue",
        steps: [
          "Submit a provider-neutral job to the selected fal endpoint",
          "Track queued, in-progress, completed, and failed states",
          "Poll status or receive a webhook without exposing provider credentials in the browser",
        ],
      },
      {
        title: "Campaign handoff",
        steps: [
          "Review the output for brand, claims, rights, and platform fit",
          "Create platform variants and captions in DistroNow",
          "Send approved videos to accman or ClipRO follow-up workflows",
        ],
      },
    ],
    handoffs: [
      "DistroNow: brand, customer, prompt, and approval context",
      "accman: approved videos into platform plans",
      "ClipRO: long generated videos into short clips",
      "Analytics: generation cost and creative performance",
    ],
    importedCapabilities: [
      "fal queue submission",
      "fal storage upload",
      "Reference-to-video endpoint pattern",
      "Request/status/response URLs",
      "Polling completed results",
      "Prompt expansion",
      "DistroNow product video generation",
      "Provider credential boundary",
    ],
  },
  {
    slug: "reclip",
    name: "Reclip",
    title: "Source Downloader",
    description:
      "Download and prepare online video sources or playlists for lawful local processing and repurposing.",
    source: "reclip local application",
    status: "Pipeline mapped",
    primaryAction: "Prepare a source",
    records: [
      "Source URLs",
      "Playlist items",
      "Download jobs",
      "Job status",
      "Thumbnails",
      "Local media files",
    ],
    workflows: [
      {
        title: "Source preparation",
        steps: [
          "Inspect a URL or playlist",
          "Show source information before downloading",
          "Choose the media item and confirm rights",
        ],
      },
      {
        title: "Download job",
        steps: [
          "Start a bounded download",
          "Poll status by job ID",
          "Expose thumbnail and completed file endpoints",
          "Send the local source into ClipRO",
        ],
      },
    ],
    handoffs: [
      "ClipRO: downloaded source for transcript and clipping",
      "DistroNow: source metadata and rights record",
      "accman: approved clips only",
    ],
    importedCapabilities: [
      "Flask source-info endpoint",
      "Playlist inspection",
      "Download jobs",
      "Status polling",
      "File and thumbnail endpoints",
      "Dockerized local workflow",
      "Explicit content-rights requirement",
    ],
  },
  {
    slug: "autoart",
    name: "AutoArt",
    title: "Music Creation and Label OS",
    description:
      "Manage artists, songs, releases, promo plans, distribution packages, and music analytics.",
    source: "AutoArt Label OS static MVP",
    status: "Promotion link mapped",
    primaryAction: "Create a release",
    records: [
      "Artists",
      "Songs",
      "Generation queue",
      "Releases",
      "Promo campaigns",
      "Analytics imports",
      "Provider settings",
    ],
    workflows: [
      {
        title: "Song Lab",
        steps: [
          "Define title, concept, genre, use case, mood, instruments, BPM, key, duration, and exclusions",
          "Write lyrics or instrumental structure",
          "Create provider-ready Suno/style prompts and review the queue",
        ],
      },
      {
        title: "Release builder",
        steps: [
          "Build single, EP, or album",
          "Validate artwork, cover dimensions, metadata, UPC, track list, and lead time",
          "Export DistroKid-ready CSV and JSON packages",
        ],
      },
      {
        title: "Promotion and learning",
        steps: [
          "Create short-form clip ideas, playlist pitches, and captions",
          "Send approved music assets to accman",
          "Import CSV analytics by track, platform, date, streams, saves, revenue, and country",
        ],
      },
    ],
    handoffs: [
      "accman: release promo content and account plans",
      "DistroNow: audience and brand context for promotion",
      "Analytics: cross-account music performance",
    ],
    importedCapabilities: [
      "Artist roster and identity",
      "Song Lab",
      "Suno-ready queue",
      "Single/EP/album release builder",
      "DistroKid-ready metadata export",
      "Promo builder",
      "Playlist pitches",
      "CSV analytics import",
      "Human approval and no-real-artist-reference settings",
    ],
  },
  {
    slug: "streamwin",
    name: "Streamwin",
    title: "Live Studio and Vision Agents",
    description:
      "Operate live video, destinations, IRL controls, visual effects, and video-aware automations from one studio.",
    source: "Streamwin interactive prototype",
    status: "Live studio mapped",
    primaryAction: "Configure a live session",
    records: [
      "Live sessions",
      "Scenes",
      "Destinations",
      "IRL connection",
      "Vision agents",
      "Events",
      "Chat actions",
    ],
    workflows: [
      {
        title: "Live studio",
        steps: [
          "Select or switch scenes",
          "Control mic, camera, broadcast, and destination state",
          "Apply prompt-driven effects and intensity presets",
        ],
      },
      {
        title: "Distribution and IRL",
        steps: [
          "Configure Twitch, YouTube, TikTok LIVE, and other destinations",
          "Monitor bitrate, latency, signal, and phone bonding",
          "Use remote controls and overlays for mobile streams",
        ],
      },
      {
        title: "Vision-aware agents",
        steps: [
          "Sample frames and recognize gestures, objects, landmarks, gameplay, and on-camera events",
          "Trigger safe chat or scene actions with cooldowns",
          "Log observations, messages, moderation outcomes, and human overrides",
        ],
      },
    ],
    handoffs: [
      "accman: live destinations, accounts, content, and performance",
      "DistroNow: live promotion and audience context",
      "Analytics: retention, chat engagement, and event outcomes",
    ],
    importedCapabilities: [
      "Four-switchable live scenes",
      "Prompt editor",
      "AI intensity control",
      "Quick effects",
      "Twitch/YouTube/TikTok destinations",
      "IRL phone health indicators",
      "Vision automation toggles",
      "Recent event feed",
      "WebRTC/provider/RTMP roadmap",
    ],
  },
  {
    slug: "seo-geo",
    name: "SEO / GEO",
    title: "Search and Answer Visibility",
    description:
      "Improve discoverability across traditional search and generative answers with crawlable, useful, attributable, and measurable content.",
    source: "Google Search Central + Bing Webmaster guidance",
    status: "Strategy workflow ready",
    primaryAction: "Run a visibility audit",
    records: [
      "Site audits",
      "Search intents",
      "Topic clusters",
      "Page briefs",
      "Entity evidence",
      "Structured data",
      "Citations",
      "Search performance",
    ],
    workflows: [
      {
        title: "Technical discoverability",
        steps: [
          "Audit crawl access, indexability, canonicals, redirects, sitemaps, internal links, rendering, mobile experience, and page speed",
          "Resolve duplicate or conflicting URLs and keep important information available as visible text",
          "Validate structured data against the visible page instead of inventing AI-specific markup",
          "Submit accurate sitemaps and notify participating engines of meaningful changes with IndexNow",
        ],
      },
      {
        title: "Intent and authority",
        steps: [
          "Map customer questions, comparison needs, objections, and purchase intents to existing or proposed pages",
          "Create unique expert-led content with first-party evidence, clear authorship, dates, sources, and factual claims",
          "Connect related pages into topic clusters without producing thin keyword variants",
          "Keep organization, product, person, and location facts consistent across the site and trusted profiles",
        ],
      },
      {
        title: "SEO and generative visibility",
        steps: [
          "Track queries, indexed pages, clicks, conversions, backlinks, and rich-result eligibility in webmaster tools",
          "Track cited pages and citations in AI performance reports where platforms expose them",
          "Test representative customer questions and retain dated evidence rather than claiming deterministic AI rankings",
          "Refresh or consolidate content based on accuracy, usefulness, conversion, and citation evidence",
        ],
      },
    ],
    handoffs: [
      "AClienti: customer questions and evidence language",
      "DistroNow: approved search briefs and page content",
      "accman: distribution that earns genuine discovery and references",
      "Analytics: organic traffic, conversions, and AI citations",
    ],
    importedCapabilities: [
      "Crawl/index/canonical audit",
      "Sitemap and IndexNow plan",
      "Search-intent and topic-cluster mapping",
      "People-first content briefs",
      "Schema-to-visible-content validation",
      "Entity consistency review",
      "Search Console and Bing Webmaster measurement",
      "AI citation evidence log",
      "No guaranteed rankings or GEO hacks",
    ],
  },
  {
    slug: "launched",
    name: "Launched",
    title: "Launch Distribution Planner",
    description:
      "Choose where a new product, feature, business, or creative release should be announced, then tailor the launch to each community.",
    source: "DistroNow launch distribution workflow",
    status: "Launch workflow ready",
    primaryAction: "Plan a launch",
    records: [
      "Launch brief",
      "Audience segments",
      "Destination shortlist",
      "Community rules",
      "Channel variants",
      "Launch calendar",
      "Responses and feedback",
      "Conversion results",
    ],
    workflows: [
      {
        title: "Choose the right launch surfaces",
        steps: [
          "Define what is launching, who can use it now, category, geography, price, proof, and launch goal",
          "Shortlist owned channels: website, changelog, email list, customer community, social accounts, and partner network",
          "Evaluate Product Hunt for live technology products and Show HN for substantial things people can actually try",
          "Find niche communities, relevant subreddits, Slack/Discord groups, directories, newsletters, podcasts, local press, and industry publications where the audience already participates",
        ],
      },
      {
        title: "Community-fit review",
        steps: [
          "Read each destination's current rules and recent posts before drafting",
          "Score audience fit, eligibility, credibility, effort, timing, expected feedback, and conversion path",
          "Exclude destinations that ban promotion or where the launch has no genuine community value",
          "Never coordinate fake votes, mass unsolicited posts, duplicate announcements, or undisclosed promotion",
        ],
      },
      {
        title: "Launch, respond, and learn",
        steps: [
          "Prepare a distinct title, explanation, demo, founder story, visuals, and call to action for each selected surface",
          "Schedule posts when the maker can stay present and answer questions",
          "Record URLs, publication state, feedback, referrals, signups, revenue, and qualitative objections",
          "Turn real launch feedback into product fixes, customer intelligence, SEO pages, and follow-up content",
        ],
      },
    ],
    handoffs: [
      "DistroNow: launch story, visuals, demos, and channel variants",
      "SEO / GEO: launch page, changelog, indexation, and earned references",
      "accman: approved social launch schedule",
      "Email Marketing: permission-based customer announcement",
      "AClienti: launch feedback and buyer signals",
    ],
    importedCapabilities: [
      "Owned, earned, community, directory, and partner channel map",
      "Product Hunt readiness checklist",
      "Show HN eligibility checklist",
      "Niche community and subreddit rule review",
      "Platform-specific launch variants",
      "Anti-spam and authentic-engagement checks",
      "Launch-day response plan",
      "Referral, signup, revenue, and feedback tracking",
    ],
  },
  {
    slug: "metadata-reencoder",
    name: "Metadata Reencoder",
    title: "Privacy-safe Media Re-encoding",
    description:
      "Create a clean image copy by decoding pixels and writing a new file without inherited camera, location, editor, EXIF, IPTC, or XMP metadata.",
    source: "HeliosGen mediaMetadata pattern",
    status: "Image utility connected",
    primaryAction: "Clean an image",
    records: [
      "Source image",
      "Output format",
      "Quality setting",
      "Pixel dimensions",
      "Output size",
      "Rights confirmation",
    ],
    workflows: [
      {
        title: "Privacy-safe export",
        steps: [
          "Choose an owned or authorized JPEG, PNG, or WebP file",
          "Select the output format and lossy quality where applicable",
          "Decode the visible pixels locally and encode a new metadata-free container",
          "Review and download the clean copy while retaining the original for provenance",
        ],
      },
      {
        title: "Publishing handoff",
        steps: [
          "Visually compare the clean copy with the source",
          "Add platform alt text and accessibility metadata at publish time",
          "Keep licensing and attribution records outside the stripped delivery file",
        ],
      },
      {
        title: "Screen-recording method",
        steps: [
          "Enable Do Not Disturb and close private windows or notifications",
          "Display or play the owned media full-screen at the highest practical quality",
          "Record the screen, then trim the new capture",
          "Inspect resolution, color, audio, visible private data, and quality before publishing",
        ],
      },
    ],
    handoffs: [
      "DistroNow Studio: clean delivery asset",
      "accman: platform-ready upload copy",
      "Content Library: retain the original and rights evidence",
    ],
    importedCapabilities: [
      "Browser-local processing",
      "JPEG, PNG, and WebP decoding/re-encoding",
      "EXIF/IPTC/XMP and GPS metadata removal by pixel rebuild",
      "Output format and quality control",
      "Documented screen-recording recapture method",
      "Before/after byte-size reporting",
      "Explicit rights and provenance boundary",
    ],
  },
  {
    slug: "masscall",
    name: "MassCall",
    title: "Voice Conversation Campaigns",
    description:
      "Design reviewed voice-agent campaigns for reception, support, qualification, booking, and vertical workflows.",
    source: "MassCall voice-agent prototype",
    status: "Acquisition extension mapped",
    primaryAction: "Design a voice campaign",
    records: [
      "Agent roles",
      "Campaigns",
      "Call intents",
      "Calendar outcomes",
      "Escalations",
      "Cost and conversion metrics",
    ],
    workflows: [
      {
        title: "Agent use case",
        steps: [
          "Choose receptionist, multilingual support, sales qualifier, restaurant order taker, or real-estate scheduler",
          "Define role, voice, language, knowledge, escalation, and allowed actions",
          "Set cost, volume, and consent boundaries",
        ],
      },
      {
        title: "Conversation loop",
        steps: [
          "Qualify or answer a request",
          "Detect intent and objections",
          "Book, route, follow up, or escalate only within approved rules",
          "Record outcome and attribution",
        ],
      },
    ],
    handoffs: [
      "AutoGTM: qualified prospects and outreach context",
      "accman: campaign promotion and account content",
      "Analytics: call outcomes, cost per result, and revenue attribution",
    ],
    importedCapabilities: [
      "AI receptionist",
      "Multilingual customer support",
      "AI sales qualifier",
      "Restaurant ordering",
      "Real-estate showing scheduler",
      "Calendar/Gmail/Slack/Notion action routing",
      "Human and safety boundaries",
    ],
  },
];

export function getMarketingModule(slug: string) {
  return MARKETING_MODULES.find((module) => module.slug === slug);
}

export const CORE_MODULE_SLUGS = [
  "aclienti",
  "accman",
  "email-marketing",
  "clipro",
  "video-generation",
  "metadata-reencoder",
  "seo-geo",
  "launched",
] as const;
export const CORE_MARKETING_MODULES = MARKETING_MODULES.filter((module) =>
  CORE_MODULE_SLUGS.includes(module.slug as (typeof CORE_MODULE_SLUGS)[number]),
);
export const COMPANION_MODULES = MARKETING_MODULES.filter(
  (module) => !CORE_MARKETING_MODULES.includes(module),
);
