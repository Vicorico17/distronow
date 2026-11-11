import { MARKETING_MODULES } from "./module-catalog";
import { SOURCE_MIGRATION_MAP } from "./marketing-blueprint";

export const DIRECTORY_CATEGORIES = ["Product modules", "Contributing projects", "Playbooks & references"] as const;
export type DirectoryEntry = {
  slug: string;
  name: string;
  title: string;
  description: string;
  href: string;
  status: string;
  category: (typeof DIRECTORY_CATEGORIES)[number];
  contribution: string;
  limitation: string;
  destination: string;
  destinationHref: string;
};

const implementation: Record<string, [string, string]> = {
  loro: ["Initial workspace implemented", "Creator and campaign records, selections, and JSON export are implemented locally. Generation, payments, identity verification, and automatic publishing handoffs are not connected."],
  accman: ["Partially connected", "Account vault and planning utilities are implemented. Live social publishing and complete platform analytics remain unfinished."],
  clipro: ["Pipeline mapped", "Source tools include local rendering, but the full clipping pipeline is not connected to project records."],
  "email-marketing": ["Planned", "This is a workflow overview. Newsletter delivery, subscriber management, and nurture execution are not connected here."],
  "video-generation": ["Partially connected", "Product-video generation is available in Content Studio when configured. The fal queue is not connected to this module."],
  autoart: ["Companion workflow mapped", "The standalone music app is separate. This page describes its role; release creation and automatic promotion handoffs are not connected here."],
  streamwin: ["Prototype dashboard", "Streamwin and CHATTERS.AI are the same product. Studio controls and saved agent records exist. Live broadcasting, automated viewer sessions, and chat execution are not connected."],
  "seo-geo": ["Strategy overview", "Audit and content workflows are documented. Automated auditing and live search analytics are not connected here."],
  launched: ["Strategy overview", "Launch planning is documented. Automated submissions and performance tracking are not connected here."],
  "metadata-reencoder": ["Working browser utility", "Image re-encoding runs in your browser. Screen recording is a documented manual workflow."],
  masscall: ["Companion workflow mapped", "Voice campaign use cases are mapped. Telephony, live calls, and booking integrations are not connected here."],
};

const contributingProjects = [
  { slug: "aclienti", name: "ACLIENTI", title: "Customer Signals & Research", description: "Capture public customer needs, qualify opportunities, and turn evidence into content briefs.", destination: "Leads Finder", destinationHref: "/leads-finder", status: "Research incorporated", limitation: "Uses the shared Leads Finder research workflow. Automated source discovery is not implemented by this overview." },
  { slug: "reclip", name: "Reclip", title: "Video Source Preparation", description: "URL and playlist inspection, download jobs, status polling, and media handoff into ClipRO.", destination: "ClipRO", destinationHref: "/modules/clipro", status: "Pipeline mapped", limitation: "Source capabilities are mapped into ClipRO; this page does not execute downloads." },
  { slug: "orbit", name: "Orbit", title: "Social Account & Niche Manager", description: "The original account and niche manager contributes to ACCMAN's account organization.", destination: "ACCMAN", destinationHref: "/modules/accman", status: "Consolidated into ACCMAN", limitation: "Orbit and ACCMAN share one workflow; this overview does not create another account store." },
  { slug: "ttvfans", name: "TTVfans", title: "Stream Agent Concepts", description: "Co-host, chatter, and clip-hunter concepts contribute to the Streamwin studio.", destination: "Streamwin", destinationHref: "/modules/streamwin", status: "Prototype contribution", limitation: "The shared studio has agent records and simulated controls, not live viewer delivery or chat execution." },
  { slug: "autogtm", name: "AutoGTM", title: "Buyer Acquisition Workflow", description: "Prospecting, reviewed outreach, replies, meetings, and outcomes are grouped in Leads Finder.", destination: "Leads Finder", destinationHref: "/leads-finder", status: "Consolidated into Leads Finder", limitation: "The public experience is a demo. Persistent project workflows and external execution require their configured services." },
  { slug: "fal-video-runner", name: "fal-video-runner", title: "Video Provider Queue", description: "Reference uploads, generation submissions, polling, and output retrieval inform the AI Video Studio.", destination: "Video Generation", destinationHref: "/modules/video-generation", status: "Provider workflow mapped", limitation: "The fal provider queue is not connected to the project module." },
  { slug: "heliosgen", name: "HeliosGen", title: "Media Metadata Pattern", description: "The mediaMetadata pattern informs browser-local image decoding and clean re-encoding.", destination: "Metadata Reencoder", destinationHref: "/modules/metadata-reencoder", status: "Pattern adapted", limitation: "Only the metadata-cleaning pattern contributes here; the full HeliosGen product is not integrated." },
];

const playbookNames: Record<string, string> = {
  "ai-marketing-os": "AI Marketing OS",
  "script generation": "Script Generation",
  "emailing-leadmagnet": "Emailing / Lead Magnet",
  "character generation": "Character Generation",
  slideshows: "Slideshows",
  "untapped niches": "Untapped Niches",
  clipping: "Clipping",
  "growth-agent-hub": "Growth Agent Hub",
  "postiz-app": "Postiz",
  virality: "Virality",
};

export const MODULE_DIRECTORY: DirectoryEntry[] = [
  { slug: "content-studio", name: "DistroNow / Content Studio", title: "Website-to-Content Workspace", description: "Build brand context, create content and campaigns, and review assets in one project.", href: "/modules/content-studio", status: "Main application", category: "Product modules", contribution: "Shared projects, brand extraction, audiences, content generation, assets, and approvals.", limitation: "Generation and persistence depend on configured services. Not every downstream publishing integration is connected.", destination: "Content Studio", destinationHref: "/" },
  ...MARKETING_MODULES.map((module): DirectoryEntry => ({
    slug: module.slug,
    name: module.slug === "streamwin" ? "Streamwin" : module.name,
    title: module.title,
    description: module.description,
    href: `/modules/${module.slug}`,
    status: implementation[module.slug]?.[0] ?? module.status,
    category: "Product modules",
    contribution: module.importedCapabilities.join(" · "),
    limitation: implementation[module.slug]?.[1] ?? "Review the module's integration scope before using its workflow.",
    destination: "Project workspace",
    destinationHref: "/projects",
  })),
  { slug: "leads-finder", name: "Leads Finder", title: "Customer Research, Buyer Intelligence & Outreach", description: "Capture evidence, qualify buyers, prepare outreach, and track conversations and outcomes.", href: "/modules/leads-finder", status: "Demo & project workflows", category: "Product modules", contribution: "ACLIENTI customer research and the AutoGTM acquisition workflow share this category.", limitation: "The public demo makes no live sends. External execution requires configuration in a project.", destination: "Leads Finder demo", destinationHref: "/leads-finder" },
  ...contributingProjects.map((project): DirectoryEntry => ({ ...project, href: `/modules/${project.slug}`, category: "Contributing projects", contribution: project.description })),
  ...SOURCE_MIGRATION_MAP.filter((source) => source.source in playbookNames).map((source): DirectoryEntry => ({
    slug: source.source.replaceAll(" ", "-"),
    name: playbookNames[source.source],
    title: `${playbookNames[source.source]} contribution`,
    description: source.contribution,
    href: `/modules/${source.source.replaceAll(" ", "-")}`,
    status: source.source === "postiz-app" ? "Architecture reference only" : "Strategy / source material",
    category: "Playbooks & references",
    contribution: source.contribution,
    limitation: source.source === "postiz-app" ? "No Postiz code was copied. This is an architecture reference, not a connected Postiz service." : "This page describes contributed strategy or source material. It does not imply a separately running service or complete automation.",
    destination: source.destination,
    destinationHref: source.source === "clipping" ? "/modules/clipro" : source.source === "postiz-app" ? "/modules/accman" : "/projects",
  })),
];

export function getDirectoryEntry(slug: string) {
  return MODULE_DIRECTORY.find((entry) => entry.slug === slug);
}
