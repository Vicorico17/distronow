import { BrandExtraction } from "@/lib/brand";
import type { SavedBrandAudience } from "@/lib/brand-store";

type GeneratedAudience = Omit<SavedBrandAudience, "id" | "projectId" | "createdAt" | "updatedAt">;

const DEFAULT_MODEL = "gpt-4.1-mini";

function brandName(extraction: BrandExtraction) {
  return extraction.title?.split("|")[0].trim() || new URL(extraction.sourceUrl).hostname.replace(/^www\./, "");
}

function brandSummary(extraction: BrandExtraction) {
  return extraction.description?.replace(/\s+/g, " ").trim() || "A brand with a website and reusable positioning signals.";
}

function parseJsonArray(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const parsed = JSON.parse(fenced ?? trimmed) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Audience generation did not return an array.");
  }

  return parsed;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeAudience(value: unknown, index: number): GeneratedAudience {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    name: typeof item.name === "string" ? item.name : `Recommended audience ${index + 1}`,
    summary: typeof item.summary === "string" ? item.summary : "A likely high-fit customer segment for this brand.",
    painPoints: asStringArray(item.painPoints),
    goals: asStringArray(item.goals),
    buyingTriggers: asStringArray(item.buyingTriggers),
    objections: asStringArray(item.objections),
    channels: asStringArray(item.channels),
    contentAngles: asStringArray(item.contentAngles),
    isPrimary: index === 0,
    source: "ai"
  };
}

function fallbackAudiences(extraction: BrandExtraction): GeneratedAudience[] {
  const name = brandName(extraction);
  const summary = brandSummary(extraction);

  return [
    {
      name: `High-intent ${name} buyer`,
      summary: `A customer who already understands the problem space and needs a credible reason to choose ${name}. ${summary}`,
      painPoints: ["Too many similar options", "Unclear proof", "Wants a faster decision"],
      goals: ["Find a trusted solution", "Reduce buying risk", "Get a clear outcome"],
      buyingTriggers: ["Specific product benefit", "Customer proof", "Strong offer"],
      objections: ["Needs proof", "Price sensitivity", "Concern about fit"],
      channels: ["Instagram", "TikTok", "Google", "LinkedIn"],
      contentAngles: ["Before and after", "Proof-led explanation", "Product benefit breakdown"],
      isPrimary: true,
      source: "fallback"
    },
    {
      name: "Research-first comparer",
      summary: "A careful buyer comparing alternatives before taking action.",
      painPoints: ["Hard to compare options", "Too much vague content", "Needs specific details"],
      goals: ["Understand the category", "Compare benefits", "Avoid regret"],
      buyingTriggers: ["Educational carousel", "FAQ content", "Transparent comparison"],
      objections: ["Needs more information", "Needs social proof"],
      channels: ["LinkedIn", "Instagram", "Search"],
      contentAngles: ["Checklist", "Common mistakes", "Comparison guide"],
      isPrimary: false,
      source: "fallback"
    },
    {
      name: "Social proof responder",
      summary: "A buyer who becomes interested when they see credible examples, testimonials, or creator-led proof.",
      painPoints: ["Does not trust brand claims", "Needs real-world context"],
      goals: ["See the product in use", "Understand the outcome", "Feel confident acting"],
      buyingTriggers: ["UGC", "Testimonials", "Demo content"],
      objections: ["Skeptical of polished ads", "Needs authentic proof"],
      channels: ["TikTok", "Instagram", "YouTube Shorts"],
      contentAngles: ["Creator demo", "Customer story", "Objection handling"],
      isPrimary: false,
      source: "fallback"
    }
  ];
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const response = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text)
    .find((text): text is string => typeof text === "string" && text.trim().length > 0);
}

export async function generateAudienceRecommendations(extraction: BrandExtraction): Promise<GeneratedAudience[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackAudiences(extraction);
  }

  try {
    const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
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
              "Return only valid JSON. Create 3 best-customer personas for marketing. Use keys: name, summary, painPoints, goals, buyingTriggers, objections, channels, contentAngles."
          },
          {
            role: "user",
            content: [
              `Brand: ${brandName(extraction)}`,
              `Website: ${extraction.sourceUrl}`,
              `Description: ${brandSummary(extraction)}`,
              `Language: ${extraction.language ?? "unknown"}`,
              `Brand signals: ${JSON.stringify(extraction.branding).slice(0, 6000)}`,
              "Prioritize Instagram and TikTok audiences when relevant, but include LinkedIn when infographics or B2B proof would perform well."
            ].join("\n")
          }
        ],
        temperature: 0.4
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned HTTP ${response.status}.`);
    }

    const outputText = extractOutputText(await response.json());

    if (!outputText) {
      throw new Error("OpenAI returned no audience text.");
    }

    return parseJsonArray(outputText).slice(0, 3).map(normalizeAudience);
  } catch (error) {
    console.error(error);
    return fallbackAudiences(extraction);
  }
}
