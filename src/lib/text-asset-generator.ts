import { BrandExtraction, detectBrandLanguage } from "@/lib/brand";
import { ContentAssetType } from "@/lib/asset-types";
import type { SavedBrandAudience } from "@/lib/brand-store";

const DEFAULT_MODEL = "gpt-4.1-mini";
const PROMPT_VERSION = "text-assets-v1";

export type GeneratedTextAsset = {
  title: string;
  body: string;
  cta: string;
  visualDirection: string;
  caption: string;
  provider: "openai" | "template";
  model: string | null;
  promptVersion: string;
};

function brandName(extraction: BrandExtraction) {
  const title = extraction.title?.split("|")[0].split(":")[0].trim();
  return title || new URL(extraction.sourceUrl).hostname.replace(/^www\./, "");
}

function brandSummary(extraction: BrandExtraction) {
  return extraction.description?.replace(/\s+/g, " ").trim() || "A brand with a clear offer and visual identity.";
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

function parseTextAssetJson(text: string): Omit<GeneratedTextAsset, "provider" | "model" | "promptVersion"> {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const json = JSON.parse(fenced ?? trimmed) as unknown;

  if (!json || typeof json !== "object") {
    throw new Error("AI generation returned an invalid text asset.");
  }

  const item = json as Record<string, unknown>;

  return {
    title: typeof item.title === "string" ? item.title : "Generated content",
    body: typeof item.body === "string" ? item.body : "",
    cta: typeof item.cta === "string" ? item.cta : "",
    visualDirection: typeof item.visualDirection === "string" ? item.visualDirection : "",
    caption: typeof item.caption === "string" ? item.caption : ""
  };
}

function templateTextAsset({
  extraction,
  audience,
  assetType,
  notes
}: {
  extraction: BrandExtraction;
  audience: SavedBrandAudience | null;
  assetType: ContentAssetType;
  notes?: string;
}): GeneratedTextAsset {
  const name = brandName(extraction);
  const summary = brandSummary(extraction);
  const audienceName = audience?.name ?? "best-fit customers";
  const audienceGoal = audience?.goals[0] ?? "make a better decision faster";

  const typeLines: Record<ContentAssetType, string> = {
    "Social content": `Write one direct social post for ${audienceName} about why ${name} matters now.`,
    "Short-form video script": `Write a hook-first TikTok/Reels script for ${audienceName}, with scene beats and simple voiceover.`,
    "Instagram/TikTok slideshow": `Plan a vertical 5-frame Instagram/TikTok slideshow for ${audienceName}, with hook, frame text, and visual direction per frame.`,
    "Carousel post": `Plan a concise 5-slide carousel for ${audienceName}, with each slide moving from problem to proof to action.`,
    "LinkedIn infographic": `Plan a LinkedIn infographic carousel for ${audienceName}, with a clear thesis and useful supporting points.`,
    "Ad creative copy": `Write performance ad copy for ${audienceName}, with hook, proof, offer, and CTA.`,
    "Image asset brief": `Create short copy and visual direction for a branded image asset that makes ${name} immediately clear.`,
    "Email campaign": `Write a concise email campaign draft for ${audienceName}, with subject line, body, and CTA.`,
    "Landing page section": `Write a landing page section for ${audienceName}, with headline, proof, benefit bullets, and CTA.`,
    "UGC workflows": `Draft a creator brief for ${audienceName} with hook, scene, and proof points.`,
    "Seedance video": `Draft a short video concept for ${audienceName} that can become a text-to-video prompt.`,
    "Competitive inspiration": `Analyze competitor positioning patterns for ${audienceName} and turn them into original content directions.`
  };

  return {
    title: `${assetType} for ${audienceName}`,
    body: [typeLines[assetType], summary, `Customer goal: ${audienceGoal}.`, notes ? `Direction: ${notes}` : null]
      .filter(Boolean)
      .join("\n"),
    cta: "Take the next step.",
    visualDirection:
      assetType === "Instagram/TikTok slideshow"
        ? `Create vertical 9:16 slideshow frames using ${name}'s brand colors, large readable text, and one idea per frame.`
        : assetType === "LinkedIn infographic"
          ? `Create clean LinkedIn carousel/infographic slides using ${name}'s brand colors, structured hierarchy, and useful visual callouts.`
          : assetType === "Carousel post"
            ? `Create carousel slides using ${name}'s brand colors, a clear focal point, and minimal text per slide.`
            : `Use ${name}'s brand colors, a clear focal point, and minimal text. Make it native to Instagram, TikTok, and LinkedIn.`,
    caption: `${name} turns the brand profile into content built for ${audienceName}.`,
    provider: "template",
    model: null,
    promptVersion: PROMPT_VERSION
  };
}

async function generateWithOpenAI({
  extraction,
  audience,
  assetType,
  notes
}: {
  extraction: BrandExtraction;
  audience: SavedBrandAudience | null;
  assetType: ContentAssetType;
  notes?: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const name = brandName(extraction);
  const language = extraction.language ?? detectBrandLanguage(extraction) ?? "English";
  const audienceLine = audience
    ? `${audience.name}: ${audience.summary}. Goals: ${audience.goals.join(", ")}. Pain points: ${audience.painPoints.join(", ")}.`
    : "Infer the best-fit customer persona from the brand.";

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
            "Generate one practical marketing text asset. Return only valid JSON with title, body, cta, visualDirection, and caption strings."
        },
        {
          role: "user",
          content: [
            `Brand: ${name}`,
            `Website: ${extraction.sourceUrl}`,
            `Description: ${brandSummary(extraction)}`,
            `Audience: ${audienceLine}`,
            `Content type: ${assetType}`,
            `Language: ${language}`,
            notes ? `Extra direction: ${notes}` : null,
            "Keep it concise. If the content type is slideshow/carousel, include slide-by-slide text in body.",
            "For Image assets, write copy and visual direction that can drive image generation.",
            "Avoid filler and long explanations."
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
    throw new Error("OpenAI returned no text asset.");
  }

  return {
    ...parseTextAssetJson(outputText),
    provider: "openai" as const,
    model,
    promptVersion: PROMPT_VERSION
  };
}

export async function generateTextAsset({
  extraction,
  audience,
  assetType,
  notes
}: {
  extraction: BrandExtraction;
  audience: SavedBrandAudience | null;
  assetType: ContentAssetType;
  notes?: string;
}) {
  try {
    const generated = await generateWithOpenAI({ extraction, audience, assetType, notes });

    if (generated) {
      return generated;
    }
  } catch (error) {
    console.error(error);
  }

  return templateTextAsset({ extraction, audience, assetType, notes });
}
