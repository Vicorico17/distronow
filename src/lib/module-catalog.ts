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
    description: "Turn public customer signals into evidence-backed content direction and qualified opportunities.",
    source: "ACLIENTI working MVP",
    status: "Foundation connected",
    primaryAction: "Capture a signal",
    records: ["Research lens", "Public signals", "Qualification scores", "Buyer stages", "Content briefs", "Evidence exports"],
    workflows: [
      { title: "Signal desk", steps: ["Define product, target customer, promised outcome, and disqualifiers", "Capture pain, request, workaround, switching, or company-trigger evidence", "Preserve source URL, visible date, and response channel"] },
      { title: "Qualification", steps: ["Score pain, product fit, timing, reachability, and evidence quality", "Calculate score = pain/5×25 + fit/5×25 + timing/5×20 + reach/5×15 + evidence/5×15", "Prioritize 80–100 as strong, 65–79 as promising, and below 65 for validation"] },
      { title: "Content briefs", steps: ["Convert qualified signals into headline, angle, format, and source-linked brief", "Use the customer’s language without implying endorsement", "Send confirmed briefs into DistroNow creation"] }
    ],
    handoffs: ["DistroNow: customer language and content briefs", "AutoGTM: qualified business opportunities", "Analytics: signal-to-content performance"],
    importedCapabilities: ["Product/ICP lens editor", "Public source and signal-date capture", "Weighted 0–100 qualification", "Buyer-stage filtering", "Evidence-linked prospect cards", "Local content-brief generation", "JSON report export", "Public-information safety boundary"]
  },
  {
    slug: "accman",
    name: "accman",
    title: "Account Manager",
    description: "Manage social accounts, niches, formats, trends, prompts, content plans, publishing states, and performance.",
    source: "accman / Orbit browser MVP",
    status: "Foundation connected",
    primaryAction: "Plan content",
    records: ["Accounts", "Niches", "Content formats", "Trend inbox", "Prompts", "Content plans", "Publishing queue", "Performance"],
    workflows: [
      { title: "Account and niche system", steps: ["Add Instagram, TikTok, and YouTube accounts", "Assign a niche and audience direction to each account", "Track connected, idea, active, watching, and archived states"] },
      { title: "Trend to plan", steps: ["Save a trend, hook, or observation into the inbox", "Dismiss it or turn it into planned content", "Choose an account, reusable format, publish date, and status: idea → planned → ready → posted"] },
      { title: "Creative operations", steps: ["Save reusable formats with notes", "Store custom prompts and copy them into creation", "Generate a creative strategy brief with counter-narrative, three angles, hooks, and a five-part shot list"] }
    ],
    handoffs: ["DistroNow: approved assets and strategy", "ClipRO/Reclip: approved clips into content plans", "AutoArt: release promo assets", "Streamwin: live destinations and automations", "Analytics: account and post results"],
    importedCapabilities: ["Multi-platform account list", "Niche board with status and account coverage", "Content format library", "Trend inbox", "Plan pipeline", "Prompt library", "Ad research brief", "AI UGC product demo", "Unboxing", "Before/after", "Problem → mechanism → relief", "Cinematic reveal", "Character-led story", "Educational comparison", "ASMR loop", "Music-listening UGC", "Warm-audience retargeting"]
  },
  {
    slug: "clipro",
    name: "ClipRO",
    title: "Long-form Video Repurposing",
    description: "Find the strongest moments in long videos, streams, and VODs, then render platform-ready clips.",
    source: "clip-ro working MVP",
    status: "Pipeline mapped",
    primaryAction: "Import a source",
    records: ["Connected sources", "Videos/VODs", "Transcripts", "Candidate moments", "Clip jobs", "Rendered clips", "Rights status"],
    workflows: [
      { title: "Ingest", steps: ["Connect YouTube, Twitch, or Kick", "Sync source metadata or import a URL", "Upload a local video and probe its duration with ffprobe"] },
      { title: "Find moments", steps: ["Reuse captions when available, otherwise transcribe with timestamps", "Detect keywords, pauses, laughter, audio spikes, visual changes, chat spikes, and source structure", "Score hook, clarity, payoff, pacing, platform fit, creator fit, safety, and editability"] },
      { title: "Render and distribute", steps: ["Generate only the best candidates", "Render 9:16, 1:1, or 16:9 with captions and saved settings", "Review rights and quality, then send approved clips to accman"] }
    ],
    handoffs: ["accman: approved clips become planned posts", "DistroNow: captions, titles, hooks, and campaign context", "Analytics: clip performance by source video"],
    importedCapabilities: ["YouTube/Twitch/Kick simulated connections", "Source syncing and manual URL import", "Upload flow", "In-memory job states", "Transcription fallback", "Ranked clip candidates", "Local FFmpeg rendering", "SRT/timestamp support", "Cost-aware Scout/Muscle/Soul/Analyst agent pattern"]
  },
  {
    slug: "reclip",
    name: "Reclip",
    title: "Source Downloader",
    description: "Download and prepare online video sources or playlists for lawful local processing and repurposing.",
    source: "reclip local application",
    status: "Pipeline mapped",
    primaryAction: "Prepare a source",
    records: ["Source URLs", "Playlist items", "Download jobs", "Job status", "Thumbnails", "Local media files"],
    workflows: [
      { title: "Source preparation", steps: ["Inspect a URL or playlist", "Show source information before downloading", "Choose the media item and confirm rights"] },
      { title: "Download job", steps: ["Start a bounded download", "Poll status by job ID", "Expose thumbnail and completed file endpoints", "Send the local source into ClipRO"] }
    ],
    handoffs: ["ClipRO: downloaded source for transcript and clipping", "DistroNow: source metadata and rights record", "accman: approved clips only"],
    importedCapabilities: ["Flask source-info endpoint", "Playlist inspection", "Download jobs", "Status polling", "File and thumbnail endpoints", "Dockerized local workflow", "Explicit content-rights requirement"]
  },
  {
    slug: "autoart",
    name: "AutoArt",
    title: "Music Creation and Label OS",
    description: "Manage artists, songs, releases, promo plans, distribution packages, and music analytics.",
    source: "AutoArt Label OS static MVP",
    status: "Promotion link mapped",
    primaryAction: "Create a release",
    records: ["Artists", "Songs", "Generation queue", "Releases", "Promo campaigns", "Analytics imports", "Provider settings"],
    workflows: [
      { title: "Song Lab", steps: ["Define title, concept, genre, use case, mood, instruments, BPM, key, duration, and exclusions", "Write lyrics or instrumental structure", "Create provider-ready Suno/style prompts and review the queue"] },
      { title: "Release builder", steps: ["Build single, EP, or album", "Validate artwork, cover dimensions, metadata, UPC, track list, and lead time", "Export DistroKid-ready CSV and JSON packages"] },
      { title: "Promotion and learning", steps: ["Create short-form clip ideas, playlist pitches, and captions", "Send approved music assets to accman", "Import CSV analytics by track, platform, date, streams, saves, revenue, and country"] }
    ],
    handoffs: ["accman: release promo content and account plans", "DistroNow: audience and brand context for promotion", "Analytics: cross-account music performance"],
    importedCapabilities: ["Artist roster and identity", "Song Lab", "Suno-ready queue", "Single/EP/album release builder", "DistroKid-ready metadata export", "Promo builder", "Playlist pitches", "CSV analytics import", "Human approval and no-real-artist-reference settings"]
  },
  {
    slug: "streamwin",
    name: "Streamwin",
    title: "Live Studio and Vision Agents",
    description: "Operate live video, destinations, IRL controls, visual effects, and video-aware automations from one studio.",
    source: "Streamwin interactive prototype",
    status: "Live studio mapped",
    primaryAction: "Configure a live session",
    records: ["Live sessions", "Scenes", "Destinations", "IRL connection", "Vision agents", "Events", "Chat actions"],
    workflows: [
      { title: "Live studio", steps: ["Select or switch scenes", "Control mic, camera, broadcast, and destination state", "Apply prompt-driven effects and intensity presets"] },
      { title: "Distribution and IRL", steps: ["Configure Twitch, YouTube, TikTok LIVE, and other destinations", "Monitor bitrate, latency, signal, and phone bonding", "Use remote controls and overlays for mobile streams"] },
      { title: "Vision-aware agents", steps: ["Sample frames and recognize gestures, objects, landmarks, gameplay, and on-camera events", "Trigger safe chat or scene actions with cooldowns", "Log observations, messages, moderation outcomes, and human overrides"] }
    ],
    handoffs: ["accman: live destinations, accounts, content, and performance", "DistroNow: live promotion and audience context", "Analytics: retention, chat engagement, and event outcomes"],
    importedCapabilities: ["Four-switchable live scenes", "Prompt editor", "AI intensity control", "Quick effects", "Twitch/YouTube/TikTok destinations", "IRL phone health indicators", "Vision automation toggles", "Recent event feed", "WebRTC/provider/RTMP roadmap"]
  },
  {
    slug: "masscall",
    name: "MassCall",
    title: "Voice Conversation Campaigns",
    description: "Design reviewed voice-agent campaigns for reception, support, qualification, booking, and vertical workflows.",
    source: "MassCall voice-agent prototype",
    status: "Acquisition extension mapped",
    primaryAction: "Design a voice campaign",
    records: ["Agent roles", "Campaigns", "Call intents", "Calendar outcomes", "Escalations", "Cost and conversion metrics"],
    workflows: [
      { title: "Agent use case", steps: ["Choose receptionist, multilingual support, sales qualifier, restaurant order taker, or real-estate scheduler", "Define role, voice, language, knowledge, escalation, and allowed actions", "Set cost, volume, and consent boundaries"] },
      { title: "Conversation loop", steps: ["Qualify or answer a request", "Detect intent and objections", "Book, route, follow up, or escalate only within approved rules", "Record outcome and attribution"] }
    ],
    handoffs: ["AutoGTM: qualified prospects and outreach context", "accman: campaign promotion and account content", "Analytics: call outcomes, cost per result, and revenue attribution"],
    importedCapabilities: ["AI receptionist", "Multilingual customer support", "AI sales qualifier", "Restaurant ordering", "Real-estate showing scheduler", "Calendar/Gmail/Slack/Notion action routing", "Human and safety boundaries"]
  }
];

export function getMarketingModule(slug: string) {
  return MARKETING_MODULES.find((module) => module.slug === slug);
}
