import { BrandExtraction } from "@/lib/brand";

export const CHANNELS = ["LinkedIn", "X", "Instagram"] as const;
export const INTENTS = ["Launch", "Educational", "Social proof", "Product benefit"] as const;

export type ContentChannel = (typeof CHANNELS)[number];
export type ContentIntent = (typeof INTENTS)[number];

export type GeneratedPostDraft = {
  channel: ContentChannel;
  intent: ContentIntent;
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
};

function cleanBrandName(extraction: BrandExtraction) {
  const title = extraction.title?.split("|")[0].split(":")[0].trim();
  return title || new URL(extraction.sourceUrl).hostname.replace(/^www\./, "");
}

function summarizeBrand(extraction: BrandExtraction) {
  return extraction.description?.replace(/\s+/g, " ").trim() || "A focused brand with a clear point of view.";
}

function getTone(extraction: BrandExtraction) {
  const tone = extraction.branding.personality?.tone;
  const energy = extraction.branding.personality?.energy;

  return [tone, energy].filter((value): value is string => typeof value === "string" && value.length > 0).join(", ");
}

function getHashtags(brandName: string, intent: ContentIntent) {
  const normalized = brandName.replace(/[^a-z0-9]/gi, "");
  const base = normalized ? [`#${normalized}`] : ["#Brand"];
  const intentTag = `#${intent.replace(/[^a-z0-9]/gi, "")}`;

  return [...base, intentTag, "#Distribution"];
}

function channelBody(channel: ContentChannel, lines: string[]) {
  if (channel === "X") {
    return lines.join(" ");
  }

  if (channel === "Instagram") {
    return lines.join("\n\n");
  }

  return lines.join("\n");
}

export function generatePostDrafts({
  extraction,
  channel,
  intent
}: {
  extraction: BrandExtraction;
  channel: ContentChannel;
  intent: ContentIntent;
}) {
  const brandName = cleanBrandName(extraction);
  const summary = summarizeBrand(extraction);
  const tone = getTone(extraction);
  const toneLine = tone ? `The voice should feel ${tone}.` : "The voice should feel clear and confident.";

  const templates: Record<ContentIntent, Array<{ headline: string; lines: string[]; cta: string }>> = {
    Launch: [
      {
        headline: `${brandName} is ready for more reach`,
        lines: [
          `${brandName} already has the raw ingredients for a recognizable presence.`,
          summary,
          `${toneLine} This post introduces the brand without overexplaining it.`
        ],
        cta: "Follow the next update."
      },
      {
        headline: `A sharper way to introduce ${brandName}`,
        lines: [
          `Most launches lose time rebuilding the basics.`,
          `${brandName} can start from what already exists: logo, color, type, and a clear message.`,
          `Now the focus moves to consistent distribution.`
        ],
        cta: "Start with the brand profile."
      }
    ],
    Educational: [
      {
        headline: `What ${brandName} teaches at first glance`,
        lines: [
          `A useful brand profile is more than a logo.`,
          `For ${brandName}, the visual system points to tone, audience, and the kind of content that will feel native.`,
          `That gives every post a stronger starting point.`
        ],
        cta: "Use the brand before writing the post."
      },
      {
        headline: `Consistency starts before the caption`,
        lines: [
          `Distribution gets easier when the brand system is already available.`,
          `${brandName} has colors, typography, and positioning signals that can guide each content format.`,
          `The result is less guesswork and more repeatable output.`
        ],
        cta: "Turn the profile into content."
      }
    ],
    "Social proof": [
      {
        headline: `${brandName} has a clear signal`,
        lines: [
          `${summary}`,
          `That clarity gives the brand something most content workflows miss: a recognizable base.`,
          `Every channel can now repeat the same signal in a format that fits.`
        ],
        cta: "Build from what is already working."
      },
      {
        headline: `The brand already says something`,
        lines: [
          `${brandName} does not need to start from a blank page.`,
          `Its site already shows audience, tone, and design direction.`,
          `The next step is turning that into regular distribution.`
        ],
        cta: "Create the next draft."
      }
    ],
    "Product benefit": [
      {
        headline: `From brand profile to usable content`,
        lines: [
          `${brandName} can move faster when every post starts with the same source of truth.`,
          `Colors, type, assets, and tone become reusable inputs.`,
          `That makes content creation easier to repeat.`
        ],
        cta: "Generate the next set."
      },
      {
        headline: `Stop rebuilding the brand for every post`,
        lines: [
          `The expensive part is not writing one post. It is keeping every post aligned.`,
          `${brandName} now has a profile that can guide each draft.`,
          `That turns distribution into a system instead of a one-off task.`
        ],
        cta: "Reuse the brand profile."
      }
    ]
  };

  return templates[intent].map((template) => ({
    channel,
    intent,
    headline: template.headline,
    body: channelBody(channel, template.lines),
    cta: template.cta,
    hashtags: getHashtags(brandName, intent)
  }));
}

