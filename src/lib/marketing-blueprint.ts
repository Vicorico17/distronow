export type BlueprintSection = {
  title: string;
  label: string;
  summary: string;
  items: string[];
};

export const MARKETING_BLUEPRINT_SECTIONS: BlueprintSection[] = [
  {
    label: "01 / Foundation",
    title: "Start with the business that already exists",
    summary: "The user enters a website or existing business first. The app builds context before asking them to make marketing decisions.",
    items: [
      "Extract the offer, product, audience clues, proof, differentiators, voice, visual identity, competitors, and unclear claims.",
      "Show the extracted brand as an editable review, never as an invisible AI assumption.",
      "Create one project containing brand system, customer evidence, strategy, assets, accounts, campaigns, and results.",
      "Use a clear process: Brand → Customer → Strategy → Create → Approve → Distribute → Learn."
    ]
  },
  {
    label: "02 / Customer intelligence",
    title: "AClienti finds who should matter most",
    summary: "The customer layer turns vague audiences into evidence-backed customer profiles that guide both content and acquisition.",
    items: [
      "Capture public signals from communities, reviews, comments, competitor audiences, search questions, and customer conversations.",
      "Score each signal for fit, pain, timing, reachability, and evidence strength.",
      "Combine signals into a customer profile with language, goals, objections, buying triggers, urgency, and content opportunities.",
      "Pass confirmed profiles into DistroNow content, AutoGTM prospecting, SEO/GEO briefs, campaigns, and performance analysis."
    ]
  },
  {
    label: "03 / Strategy library",
    title: "Five decisions before content generation",
    summary: "The strategy layer keeps the app from producing disconnected posts that sound clever but do not build a business.",
    items: [
      "Product information: what is sold, for whom, why it matters, proof, pricing, constraints, and claims.",
      "Marketing strategy: positioning, category, promise, acquisition path, offer ladder, and competitive advantage.",
      "Competitor analysis: repeated hooks, formats, proof patterns, gaps, and counter-positioning opportunities.",
      "Brand voice: vocabulary, rhythm, emotional range, personality, forbidden language, and examples.",
      "Content strategy: goals, audience stages, content mix, channels, formats, cadence, CTAs, and measurement rules."
    ]
  },
  {
    label: "04 / Creation engine",
    title: "DistroNow turns strategy into many kinds of work",
    summary: "The creative side should support fast generation without losing the customer, brand, or channel context behind each asset.",
    items: [
      "Generate hooks, scripts, captions, threads, articles, landing copy, carousels, images, product videos, UGC briefs, and campaign calendars.",
      "Use the 50% Growth / 35% Trust / 15% Conversion mix as a starting point, then adjust from performance.",
      "Choose a hook pattern, creative angle, format, stay reason, proof moment, CTA, and production requirement for every idea.",
      "Use characters and visual anchors when a campaign needs a consistent creator persona across scripts and generated media.",
      "Use slideshow audits to check hook strength, text length, visual relevance, placement, voice, and CTA before approval."
    ]
  },
  {
    label: "05 / Owned audience",
    title: "Content should create a next step",
    summary: "The local lead-magnet prototype adds a conversion path so attention does not stay trapped on a social platform.",
    items: [
      "Create a narrow lead magnet that solves the problem opened by the post.",
      "Connect one comment keyword to a DM, email gate, instant delivery, and value-first nurture sequence.",
      "Track the path from post → comment → subscriber → nurture → offer or community invite.",
      "Keep the CTA natural and honest; there must be a real payoff for responding."
    ]
  },
  {
    label: "06 / Distribution",
    title: "accman is the operating layer",
    summary: "Distribution is a separate category with its own dashboard, calendar, account health, platform rules, and learning loop.",
    items: [
      "Connect accounts through official OAuth and show scopes, health, reconnect, pause, and failure states.",
      "Compose once, adapt per platform, preview each version, validate media and limits, then request approval.",
      "Support drafts, review, approved, scheduled, published, failed, retry, recurring, evergreen, bulk, and open-slot scheduling.",
      "Group posts into launches or content sets connected to strategy, assets, accounts, and results.",
      "Keep platform providers separate so Instagram, TikTok, YouTube, LinkedIn, X, and future channels can have different rules."
    ]
  },
  {
    label: "07 / Growth extensions",
    title: "Acquisition, video, music, and livestreams connect to the core",
    summary: "The super app can expand without flattening different products into one confusing screen.",
    items: [
      "AutoGTM: define ICP, search companies and people, find lookalikes, review fit evidence, personalize outreach, classify replies, and track meetings/revenue.",
      "ClipRO: ingest long videos, transcribe, detect strong moments, score clips, render vertical versions, review them, and send them to accman.",
      "AutoArt: create artists, songs, releases, metadata, artwork, and promo assets; hand approved releases to accman for promotion.",
      "Streamwin: deploy multiple video-aware livestream chat agents with roles, cooldowns, moderation, human override, emergency stop, and full logs.",
      "Conversation campaigns: optionally extend qualified acquisition into reviewed voice-agent qualification, follow-up, support, and booking."
    ]
  },
  {
    label: "08 / Learning and safety",
    title: "Every result improves the next decision",
    summary: "The final product is not a content generator; it is a decision system with evidence, feedback, and human control.",
    items: [
      "Store daily post metrics, account metrics, campaign metrics, audience outcomes, and conversion events.",
      "Identify winning and losing hooks, formats, channels, audiences, publishing times, CTAs, and creative angles.",
      "Turn learnings into weekly summaries and next-action recommendations in the Agent Feed.",
      "Require human approval before publishing, outreach, replies, booking, livestream chatter, or external mutations.",
      "Store source links, timestamps, evidence, consent/opt-out state, claim boundaries, and audit logs for sensitive workflows."
    ]
  }
];

export const SOURCE_MIGRATION_MAP = [
  { source: "ai-marketing-os", contribution: "Unified dashboard, accounts, calendar, analytics, content creation, ClipRO, MassCall, UGC, characters, slideshows, lead magnets, niches", destination: "DistroNow Studio, accman, ClipRO, AutoGTM" },
  { source: "script generation", contribution: "Hook/angle/format libraries, idea scoring, content mix, analytics, fatigue detection, exports", destination: "DistroNow Studio + Analytics" },
  { source: "emailing-leadmagnet", contribution: "Comment keyword, DM-to-email flow, lead magnet, nurture cadence, launch checklist", destination: "DistroNow Studio + AutoGTM" },
  { source: "character generation", contribution: "Identity, motivation, contradiction, voice, visual anchors, consistency rules", destination: "DistroNow Studio / UGC" },
  { source: "slideshows", contribution: "Slide-by-slide hook, text, image role, placement, CTA, and scoring rubric", destination: "DistroNow Studio / Carousel QA" },
  { source: "untapped niches", contribution: "Niche scoring, buyer proof, audience urgency, validation prompts, offer ideas, risk boundaries", destination: "AClienti + AutoGTM + Strategy" },
  { source: "clipping", contribution: "YouTube ingestion, live/VOD handling, FFmpeg rendering, SRT captions, job logs, previews", destination: "ClipRO" },
  { source: "growth-agent-hub", contribution: "Read-only integration contracts, provider health, scopes, redaction, rate limits, failure modes", destination: "Integrations + Agent Feed" },
  { source: "postiz-app", contribution: "Calendar-first publishing, platform providers, media, sets, recurring posts, analytics, API/webhooks", destination: "accman (architecture reference only; no code copied)" },
  { source: "virality", contribution: "Question hooks, pattern interruption, share triggers, scoring, and safe experimentation", destination: "DistroNow Studio / Virality" },
  { source: "obsisdian files + obsidian-releases", contribution: "Reference/vault and release repository material, not core marketing product behavior", destination: "Not imported into the product" }
] as const;
