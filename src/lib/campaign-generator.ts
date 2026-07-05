import { BrandExtraction, detectBrandLanguage } from "@/lib/brand";
import type { SavedBrandAudience } from "@/lib/brand-store";

const DEFAULT_MODEL = "gpt-4.1-mini";
const PROMPT_VERSION = "campaign-calendar-v1";

export type CampaignCalendarItem = {
  day: number;
  channel: string;
  assetType: string;
  topic: string;
  hook: string;
  cta: string;
};

export type GeneratedCampaign = {
  name: string;
  objective: string;
  durationDays: number;
  channels: string[];
  calendar: CampaignCalendarItem[];
  provider: "openai" | "template";
  model: string | null;
  promptVersion: string;
};

function brandName(extraction: BrandExtraction) {
  return extraction.title?.split("|")[0].split(":")[0].trim() || new URL(extraction.sourceUrl).hostname.replace(/^www\./, "");
}

function brandSummary(extraction: BrandExtraction) {
  return extraction.description?.replace(/\s+/g, " ").trim() || "A brand with a clear offer and reusable identity.";
}

function parseOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const value = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (typeof value.output_text === "string") {
    return value.output_text;
  }

  return value.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text)
    .find((text): text is string => typeof text === "string" && text.trim().length > 0);
}

function parseCampaignJson(text: string, fallback: GeneratedCampaign): GeneratedCampaign {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const json = JSON.parse(fenced ?? trimmed) as unknown;

  if (!json || typeof json !== "object") {
    throw new Error("AI generation returned an invalid campaign.");
  }

  const item = json as Record<string, unknown>;
  const calendar = Array.isArray(item.calendar)
    ? item.calendar
        .map((entry, index): CampaignCalendarItem | null => {
          if (!entry || typeof entry !== "object") {
            return null;
          }

          const row = entry as Record<string, unknown>;

          return {
            day: typeof row.day === "number" ? row.day : index + 1,
            channel: typeof row.channel === "string" ? row.channel : fallback.channels[index % fallback.channels.length],
            assetType: typeof row.assetType === "string" ? row.assetType : "Social post",
            topic: typeof row.topic === "string" ? row.topic : fallback.calendar[index]?.topic ?? "Brand story",
            hook: typeof row.hook === "string" ? row.hook : fallback.calendar[index]?.hook ?? "",
            cta: typeof row.cta === "string" ? row.cta : fallback.calendar[index]?.cta ?? ""
          };
        })
        .filter((entry): entry is CampaignCalendarItem => Boolean(entry))
    : fallback.calendar;

  return {
    ...fallback,
    name: typeof item.name === "string" && item.name.trim() ? item.name : fallback.name,
    calendar: calendar.length ? calendar.slice(0, fallback.durationDays) : fallback.calendar
  };
}

function templateCampaign({
  extraction,
  audience,
  objective,
  durationDays,
  channels
}: {
  extraction: BrandExtraction;
  audience: SavedBrandAudience | null;
  objective: string;
  durationDays: number;
  channels: string[];
}): GeneratedCampaign {
  const name = brandName(extraction);
  const audienceName = audience?.name ?? "best-fit customers";
  const angles = audience?.contentAngles.length
    ? audience.contentAngles
    : [
        "problem awareness",
        "brand point of view",
        "proof and trust",
        "product benefit",
        "customer objection",
        "offer or next step",
        "community prompt"
      ];
  const normalizedChannels = channels.length ? channels : ["LinkedIn", "Instagram", "TikTok script"];
  const calendar = Array.from({ length: durationDays }, (_, index): CampaignCalendarItem => {
    const channel = normalizedChannels[index % normalizedChannels.length];
    const angle = angles[index % angles.length];
    const isVideoScript = channel === "TikTok script";

    return {
      day: index + 1,
      channel,
      assetType: isVideoScript ? "Short-form script" : index % 3 === 1 ? "Image or carousel" : "Social post",
      topic: `${angle} for ${audienceName}`,
      hook: `${name} helps ${audienceName} see ${angle} more clearly.`,
      cta: index === durationDays - 1 ? "Start the next step." : "Save this for later."
    };
  });

  return {
    name: `${durationDays}-day ${objective || "content"} campaign`,
    objective,
    durationDays,
    channels: normalizedChannels,
    calendar,
    provider: "template",
    model: null,
    promptVersion: PROMPT_VERSION
  };
}

async function generateWithOpenAI({
  extraction,
  audience,
  objective,
  durationDays,
  channels
}: {
  extraction: BrandExtraction;
  audience: SavedBrandAudience | null;
  objective: string;
  durationDays: number;
  channels: string[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const fallback = templateCampaign({ extraction, audience, objective, durationDays, channels });
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const name = brandName(extraction);
  const language = extraction.language ?? detectBrandLanguage(extraction) ?? "English";
  const audienceLine = audience
    ? `${audience.name}: ${audience.summary}. Goals: ${audience.goals.join(", ")}. Pain points: ${audience.painPoints.join(", ")}.`
    : "Infer the highest-fit customer from the brand.";

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
            "Generate a practical campaign calendar. Return only valid JSON with name and calendar. Calendar is an array with day, channel, assetType, topic, hook, cta."
        },
        {
          role: "user",
          content: [
            `Brand: ${name}`,
            `Website: ${extraction.sourceUrl}`,
            `Description: ${brandSummary(extraction)}`,
            `Audience: ${audienceLine}`,
            `Objective: ${objective}`,
            `Duration days: ${durationDays}`,
            `Channels: ${channels.join(", ")}`,
            `Language: ${language}`,
            "Use a realistic mix of social posts, carousel/image ideas, scripts, proof posts, and conversion posts.",
            "Avoid video generation instructions. This is a publishing/content calendar only."
          ].join("\n")
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
    throw new Error("OpenAI returned no campaign text.");
  }

  return {
    ...parseCampaignJson(outputText, fallback),
    provider: "openai" as const,
    model,
    promptVersion: PROMPT_VERSION
  };
}

export async function generateCampaign({
  extraction,
  audience,
  objective,
  durationDays,
  channels
}: {
  extraction: BrandExtraction;
  audience: SavedBrandAudience | null;
  objective: string;
  durationDays: number;
  channels: string[];
}) {
  try {
    const generated = await generateWithOpenAI({ extraction, audience, objective, durationDays, channels });

    if (generated) {
      return generated;
    }
  } catch (error) {
    console.error(error);
  }

  return templateCampaign({ extraction, audience, objective, durationDays, channels });
}
