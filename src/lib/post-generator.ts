import { BrandExtraction, detectBrandLanguage } from "@/lib/brand";
import type { SavedBrandAudience } from "@/lib/brand-store";

export const CHANNELS = ["LinkedIn", "X", "Instagram", "Facebook", "TikTok script"] as const;
export const GENERATION_INTENTS = [
  "Launch announcement",
  "Founder update",
  "Product benefit",
  "Customer proof",
  "Educational",
  "Social proof",
  "Promotion",
  "Community"
] as const;
export const INTENTS = [...GENERATION_INTENTS, "Launch"] as const;
export const LANGUAGES = ["Auto", "Romanian", "English", "Spanish", "French", "German"] as const;
export const TONES = ["Auto", "Professional", "Playful", "Bold", "Luxury", "Technical"] as const;
export const LENGTHS = ["Short", "Medium", "Long"] as const;

export type ContentChannel = (typeof CHANNELS)[number];
export type ContentIntent = (typeof INTENTS)[number];
export type ContentLanguage = (typeof LANGUAGES)[number];
export type ContentTone = (typeof TONES)[number];
export type ContentLength = (typeof LENGTHS)[number];
export type DraftProvider = "openai" | "template";

export type DraftGenerationSettings = {
  channel: ContentChannel;
  intent: ContentIntent;
  language: ContentLanguage;
  tone: ContentTone;
  length: ContentLength;
};

export type GeneratedPostDraft = {
  channel: ContentChannel;
  intent: ContentIntent;
  language: string;
  tone: string;
  length: ContentLength;
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
  provider: DraftProvider;
  model: string | null;
  promptVersion: string;
  settings: DraftGenerationSettings;
};

const PROMPT_VERSION = "post-drafts-v2";
const DEFAULT_MODEL = "gpt-4.1-mini";

type OpenAIDraft = {
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

function getBrandTone(extraction: BrandExtraction) {
  const tone = extraction.branding.personality?.tone;
  const energy = extraction.branding.personality?.energy;

  return [tone, energy].filter((value): value is string => typeof value === "string" && value.length > 0).join(", ");
}

export function resolveLanguage(extraction: BrandExtraction, language: ContentLanguage) {
  if (language !== "Auto") {
    return language;
  }

  return extraction.language ?? detectBrandLanguage(extraction) ?? "English";
}

function resolveTone(extraction: BrandExtraction, tone: ContentTone) {
  if (tone !== "Auto") {
    return tone;
  }

  return getBrandTone(extraction) || "Professional";
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

  if (channel === "Instagram" || channel === "Facebook") {
    return lines.join("\n\n");
  }

  if (channel === "TikTok script") {
    return lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
  }

  return lines.join("\n");
}

function lengthInstruction(length: ContentLength) {
  if (length === "Short") return "Keep the body to 1-2 concise sentences.";
  if (length === "Long") return "Use 4-6 useful sentences or script beats.";
  return "Use 2-4 focused sentences.";
}

function audiencePromptLine(audience?: SavedBrandAudience | null) {
  return audience
    ? `${audience.name}: ${audience.summary}. Goals: ${audience.goals.join(", ")}. Pain points: ${audience.painPoints.join(", ")}.`
    : "";
}

function templateHook({
  extraction,
  settings,
  audience,
  goal
}: {
  extraction: BrandExtraction;
  settings: DraftGenerationSettings;
  audience?: SavedBrandAudience | null;
  goal?: string;
}) {
  const brandName = cleanBrandName(extraction);
  const audienceName = audience?.name ?? "the right audience";
  const goalText = goal?.trim() || `make ${brandName} easier to understand`;

  if (settings.channel === "TikTok script") {
    return `Most ${audienceName} miss this before they choose ${brandName}.`;
  }

  if (settings.intent === "Customer proof") {
    return `The proof gets clearer when ${audienceName} can see the change.`;
  }

  if (settings.intent === "Product benefit") {
    return `${brandName} helps ${audienceName} ${goalText}.`;
  }

  return `${brandName} has a sharper way to help ${audienceName}.`;
}

function templateHooks({
  extraction,
  settings,
  audience,
  goal
}: {
  extraction: BrandExtraction;
  settings: DraftGenerationSettings;
  audience?: SavedBrandAudience | null;
  goal?: string;
}) {
  const brandName = cleanBrandName(extraction);
  const audienceName = audience?.name ?? "the right audience";
  const goalText = goal?.trim() || `understand ${brandName} faster`;
  const baseHook = templateHook({ extraction, settings, audience, goal });

  return [
    baseHook,
    `If ${audienceName} only knew one thing about ${brandName}, it should be this.`,
    `The fastest way for ${audienceName} to ${goalText} starts before the first click.`
  ];
}

function templateDrafts({
  extraction,
  settings,
  resolvedLanguage,
  resolvedTone,
  audience,
  goal,
  hook
}: {
  extraction: BrandExtraction;
  settings: DraftGenerationSettings;
  resolvedLanguage: string;
  resolvedTone: string;
  audience?: SavedBrandAudience | null;
  goal?: string;
  hook?: string;
}): GeneratedPostDraft[] {
  const brandName = cleanBrandName(extraction);
  const summary = summarizeBrand(extraction);
  const toneLine = `The voice should feel ${resolvedTone}.`;
  const audienceLine = audience ? `Write for ${audience.name}: ${audience.summary}.` : "";
  const goalLine = goal?.trim() ? `Goal: ${goal.trim()}.` : "";

  const templates: Record<ContentIntent, Array<{ headline: string; lines: string[]; cta: string }>> = {
    "Launch announcement": [
      {
        headline: `${brandName} is ready for more reach`,
        lines: [
          `${brandName} already has the raw ingredients for a recognizable presence.`,
          audienceLine,
          goalLine,
          summary,
          `${toneLine} This post introduces the brand without overexplaining it.`
        ],
        cta: "Follow the next update."
      },
      {
        headline: `A sharper way to introduce ${brandName}`,
        lines: [
          "Most launches lose time rebuilding the basics.",
          `${brandName} can start from what already exists: logo, color, type, and a clear message.`,
          "Now the focus moves to consistent distribution."
        ],
        cta: "Start with the brand profile."
      }
    ],
    "Founder update": [
      {
        headline: `Why ${brandName} is building with more focus`,
        lines: [
          `${brandName} has a clear base to build from: identity, message, and a recognizable point of view.`,
          "A founder update can make that progress feel direct and personal.",
          `${toneLine} The post should explain what is changing and why it matters now.`
        ],
        cta: "Follow the build."
      },
      {
        headline: `A note from behind ${brandName}`,
        lines: [
          "The most useful updates are specific, not polished into sameness.",
          `${brandName} can use its brand profile to share what the team is learning, building, or improving.`,
          "That gives the audience a reason to pay attention before the next launch."
        ],
        cta: "Share the next step."
      }
    ],
    "Customer proof": [
      {
        headline: `${brandName} has a proof point to repeat`,
        lines: [
          summary,
          "Customer proof works best when the post connects a real outcome to a simple reason.",
          `${toneLine} Keep the claim clear, credible, and easy to remember.`
        ],
        cta: "Turn the result into a story."
      },
      {
        headline: "Make the proof easier to trust",
        lines: [
          `${brandName} can use customer signals without sounding inflated.`,
          "Lead with the pain, show the change, and make the takeaway useful for the next reader.",
          "That gives the brand a stronger reason to show up again."
        ],
        cta: "Share the proof."
      }
    ],
    Educational: [
      {
        headline: `What ${brandName} teaches at first glance`,
        lines: [
          "A useful brand profile is more than a logo.",
          `For ${brandName}, the visual system points to tone, audience, and the kind of content that will feel native.`,
          "That gives every post a stronger starting point."
        ],
        cta: "Use the brand before writing the post."
      },
      {
        headline: "Consistency starts before the caption",
        lines: [
          "Distribution gets easier when the brand system is already available.",
          `${brandName} has colors, typography, and positioning signals that can guide each content format.`,
          "The result is less guesswork and more repeatable output."
        ],
        cta: "Turn the profile into content."
      }
    ],
    "Social proof": [
      {
        headline: `${brandName} has a clear signal`,
        lines: [
          summary,
          "That clarity gives the brand something most content workflows miss: a recognizable base.",
          "Every channel can now repeat the same signal in a format that fits."
        ],
        cta: "Build from what is already working."
      },
      {
        headline: "The brand already says something",
        lines: [
          `${brandName} does not need to start from a blank page.`,
          "Its site already shows audience, tone, and design direction.",
          "The next step is turning that into regular distribution."
        ],
        cta: "Create the next draft."
      }
    ],
    "Product benefit": [
      {
        headline: "From brand profile to usable content",
        lines: [
          `${brandName} can move faster when every post starts with the same source of truth.`,
          "Colors, type, assets, and tone become reusable inputs.",
          "That makes content creation easier to repeat."
        ],
        cta: "Generate the next set."
      },
      {
        headline: "Stop rebuilding the brand for every post",
        lines: [
          "The expensive part is not writing one post. It is keeping every post aligned.",
          `${brandName} now has a profile that can guide each draft.`,
          "That turns distribution into a system instead of a one-off task."
        ],
        cta: "Reuse the brand profile."
      }
    ],
    Promotion: [
      {
        headline: `${brandName} deserves a clearer offer`,
        lines: [
          `${brandName} can turn its current brand profile into a sharper promotional message.`,
          summary,
          "The offer should stay direct, useful, and easy to act on."
        ],
        cta: "Share the offer."
      },
      {
        headline: "A promotion with brand memory",
        lines: [
          "Discounts and offers work better when they still sound like the brand.",
          `${brandName} can keep the message focused while repeating the same visual and verbal cues.`,
          "That makes the promotion easier to recognize."
        ],
        cta: "Create the campaign."
      }
    ],
    Community: [
      {
        headline: `${brandName} can bring people into the story`,
        lines: [
          "Distribution is easier when the audience has something to respond to.",
          `${brandName} can use its brand profile to ask a sharper question and invite useful replies.`,
          "The goal is connection, not filler content."
        ],
        cta: "Ask the audience."
      },
      {
        headline: "Start a useful conversation",
        lines: [
          summary,
          `${brandName} can turn that positioning into a community prompt that feels natural for the channel.`,
          "Small interactions create stronger signals for future posts."
        ],
        cta: "Open the conversation."
      }
    ],
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
          "Most launches lose time rebuilding the basics.",
          `${brandName} can start from what already exists: logo, color, type, and a clear message.`,
          "Now the focus moves to consistent distribution."
        ],
        cta: "Start with the brand profile."
      }
    ]
  };

  return templates[settings.intent].map((template) => ({
    channel: settings.channel,
    intent: settings.intent,
    language: resolvedLanguage,
    tone: resolvedTone,
    length: settings.length,
    headline: hook?.trim() || template.headline,
    body: channelBody(settings.channel, hook?.trim() ? [hook.trim(), ...template.lines] : template.lines),
    cta: template.cta,
    hashtags: getHashtags(brandName, settings.intent),
    provider: "template",
    model: null,
    promptVersion: PROMPT_VERSION,
    settings
  }));
}

function parseOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const value = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof value.output_text === "string") {
    return value.output_text;
  }

  return value.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text)
    .find((text): text is string => typeof text === "string" && text.trim().length > 0);
}

function parseDraftsJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const json = JSON.parse(fenced ?? trimmed) as unknown;

  if (!Array.isArray(json)) {
    throw new Error("AI generation did not return a draft array.");
  }

  return json.slice(0, 3).map((item): OpenAIDraft => {
    if (!item || typeof item !== "object") {
      throw new Error("AI generation returned an invalid draft.");
    }

    const draft = item as Record<string, unknown>;
    const hashtags = Array.isArray(draft.hashtags)
      ? draft.hashtags.filter((tag): tag is string => typeof tag === "string")
      : [];

    return {
      headline: typeof draft.headline === "string" ? draft.headline : "",
      body: typeof draft.body === "string" ? draft.body : "",
      cta: typeof draft.cta === "string" ? draft.cta : "",
      hashtags
    };
  });
}

function parseHooksJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const json = JSON.parse(fenced ?? trimmed) as unknown;

  if (!Array.isArray(json)) {
    throw new Error("AI generation did not return a hook array.");
  }

  return json
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

async function generateWithOpenAI({
  extraction,
  settings,
  resolvedLanguage,
  resolvedTone,
  audience,
  goal,
  hook
}: {
  extraction: BrandExtraction;
  settings: DraftGenerationSettings;
  resolvedLanguage: string;
  resolvedTone: string;
  audience?: SavedBrandAudience | null;
  goal?: string;
  hook?: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const brandName = cleanBrandName(extraction);
  const summary = summarizeBrand(extraction);
  const colors = extraction.branding.colors ? JSON.stringify(extraction.branding.colors) : "No color data";
  const audienceLine = audiencePromptLine(audience);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You generate practical social post drafts. Return only valid JSON: an array of 2 objects with headline, body, cta, and hashtags string array."
        },
        {
          role: "user",
          content: [
            `Brand: ${brandName}`,
            `Website: ${extraction.sourceUrl}`,
            `Description: ${summary}`,
            `Brand colors: ${colors}`,
            `Channel: ${settings.channel}`,
            `Intent: ${settings.intent}`,
            audienceLine ? `Audience: ${audienceLine}` : null,
            goal?.trim() ? `Content goal: ${goal.trim()}` : null,
            hook?.trim() ? `Required hook: ${hook.trim()}` : null,
            `Language: ${resolvedLanguage}`,
            `Tone: ${resolvedTone}`,
            `Length: ${settings.length}. ${lengthInstruction(settings.length)}`,
            hook?.trim() ? "Use the required hook as the headline and the opening line of the body." : null,
            "Avoid generic marketing filler. Keep hashtags relevant and include no more than 5."
          ]
            .filter(Boolean)
            .join("\n")
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI returned HTTP ${response.status}.`);
  }

  const payload = (await response.json().catch(() => ({}))) as unknown;
  const outputText = parseOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI returned no draft text.");
  }

  return parseDraftsJson(outputText).map((draft) => ({
    channel: settings.channel,
    intent: settings.intent,
    language: resolvedLanguage,
    tone: resolvedTone,
    length: settings.length,
    headline: draft.headline,
    body: draft.body,
    cta: draft.cta,
    hashtags: draft.hashtags.length ? draft.hashtags : getHashtags(brandName, settings.intent),
    provider: "openai" as const,
    model,
    promptVersion: PROMPT_VERSION,
    settings
  }));
}

export async function generatePostDrafts({
  extraction,
  settings,
  audience,
  goal,
  hook
}: {
  extraction: BrandExtraction;
  settings: DraftGenerationSettings;
  audience?: SavedBrandAudience | null;
  goal?: string;
  hook?: string;
}) {
  const resolvedLanguage = resolveLanguage(extraction, settings.language);
  const resolvedTone = resolveTone(extraction, settings.tone);

  try {
    const aiDrafts = await generateWithOpenAI({
      extraction,
      settings,
      resolvedLanguage,
      resolvedTone,
      audience,
      goal,
      hook
    });

    if (aiDrafts?.length) {
      return aiDrafts;
    }
  } catch (error) {
    console.error(error);
  }

  return templateDrafts({ extraction, settings, resolvedLanguage, resolvedTone, audience, goal, hook });
}

export async function generatePostHook({
  extraction,
  settings,
  audience,
  goal
}: {
  extraction: BrandExtraction;
  settings: DraftGenerationSettings;
  audience?: SavedBrandAudience | null;
  goal?: string;
}) {
  const hooks = await generatePostHooks({ extraction, settings, audience, goal });

  return hooks[0] ?? templateHook({ extraction, settings, audience, goal });
}

export async function generatePostHooks({
  extraction,
  settings,
  audience,
  goal
}: {
  extraction: BrandExtraction;
  settings: DraftGenerationSettings;
  audience?: SavedBrandAudience | null;
  goal?: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  const resolvedLanguage = resolveLanguage(extraction, settings.language);
  const resolvedTone = resolveTone(extraction, settings.tone);

  if (!apiKey) {
    return templateHooks({ extraction, settings, audience, goal });
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const brandName = cleanBrandName(extraction);
  const audienceLine = audiencePromptLine(audience);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "Generate 3 strong social post hooks. Return only valid JSON: an array of 3 short strings. No explanations."
          },
          {
            role: "user",
            content: [
              `Brand: ${brandName}`,
              `Description: ${summarizeBrand(extraction)}`,
              `Channel: ${settings.channel}`,
              `Intent: ${settings.intent}`,
              audienceLine ? `Audience: ${audienceLine}` : null,
              goal?.trim() ? `Content goal: ${goal.trim()}` : null,
              `Language: ${resolvedLanguage}`,
              `Tone: ${resolvedTone}`,
              "Each hook should be short, specific, and usable as the first line of the post or script."
            ]
              .filter(Boolean)
              .join("\n")
          }
        ],
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned HTTP ${response.status}.`);
    }

    const payload = (await response.json().catch(() => ({}))) as unknown;
    const outputText = parseOutputText(payload);

    if (!outputText) {
      return templateHooks({ extraction, settings, audience, goal });
    }

    const hooks = parseHooksJson(outputText);

    return hooks.length ? hooks : templateHooks({ extraction, settings, audience, goal });
  } catch (error) {
    console.error(error);
    return templateHooks({ extraction, settings, audience, goal });
  }
}
