import { BrandExtraction, getColorEntries } from "@/lib/brand";
import type { SavedBrandAudience } from "@/lib/brand-store";
import { ImageAssetType } from "@/lib/asset-types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const DEFAULT_IMAGE_MODEL = "gpt-image-2";

function brandName(extraction: BrandExtraction) {
  return extraction.title?.split("|")[0].trim() || new URL(extraction.sourceUrl).hostname.replace(/^www\./, "");
}

function sizeForAsset(type: ImageAssetType) {
  if (type === "Ad creative") return "1536x1024";
  if (
    type === "Brand background/template" ||
    type === "Carousel slide" ||
    type === "Slideshow frame" ||
    type === "Infographic carousel slide"
  ) {
    return "1024x1536";
  }
  return "1024x1024";
}

function buildImagePrompt({
  extraction,
  audience,
  assetType,
  notes
}: {
  extraction: BrandExtraction;
  audience: SavedBrandAudience | null;
  assetType: ImageAssetType;
  notes?: string;
}) {
  const colors = getColorEntries(extraction.branding.colors)
    .slice(0, 6)
    .map(([name, value]) => `${name}: ${value}`)
    .join(", ");
  const logo = extraction.branding.logo ?? extraction.branding.images?.logo ?? extraction.branding.images?.favicon;
  const name = brandName(extraction);
  const audienceLine = audience
    ? `Target audience: ${audience.name}. ${audience.summary}. Motivations: ${audience.goals.join(", ")}.`
    : "Target audience: infer the highest-fit customer from the brand.";

  return [
    `Create a polished ${assetType.toLowerCase()} for ${name}.`,
    `Use this as a marketing content asset, not a generic stock image.`,
    audienceLine,
    extraction.description ? `Brand description: ${extraction.description}` : null,
    logo ? `Use the saved brand logo as a visual reference when appropriate: ${logo}. Keep it clean and do not invent a different logo.` : null,
    colors ? `Use or harmonize with these brand colors: ${colors}.` : null,
    `Style: clear, conversion-oriented, premium but practical, ready for Instagram/TikTok usage.`,
    assetType === "Carousel slide"
      ? "Design it as a clean vertical carousel slide with a strong visual hierarchy and space for short text."
      : null,
    assetType === "Slideshow frame"
      ? "Design it as a vertical 9:16 social slideshow frame with one strong idea, large readable type, and room for a sequence number."
      : null,
    assetType === "Infographic carousel slide"
      ? "Design it as a clean LinkedIn infographic carousel slide with structured hierarchy, concise labels, and a professional editorial feel."
      : null,
    assetType === "Ad creative" ? "Make it feel like a performance ad creative with a clear focal point." : null,
    assetType === "Product-style visual"
      ? "Create a product-focused visual composition, even if the exact product must be inferred from the brand."
      : null,
    assetType === "Brand background/template"
      ? "Create a reusable branded background/template with tasteful empty space for future copy."
      : null,
    notes ? `Extra direction: ${notes}` : null,
    "Avoid fake platform UI, watermarks, tiny unreadable text, clutter, or unrelated objects."
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateImageAsset({
  projectId,
  extraction,
  audience,
  assetType,
  notes
}: {
  projectId: string;
  extraction: BrandExtraction;
  audience: SavedBrandAudience | null;
  assetType: ImageAssetType;
  notes?: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for image generation.");
  }

  const model = process.env.OPENAI_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL;
  const prompt = buildImagePrompt({ extraction, audience, assetType, notes });
  const size = sizeForAsset(assetType);
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality: "medium",
      output_format: "png"
    })
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: Array<{ b64_json?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenAI image generation returned HTTP ${response.status}.`);
  }

  const b64 = payload.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("OpenAI image generation returned no image data.");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const storagePath = `${projectId}/${Date.now()}-${assetType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  const bytes = Buffer.from(b64, "base64");
  const { error: uploadError } = await supabase.storage
    .from("marketing-assets")
    .upload(storagePath, bytes, { contentType: "image/png", upsert: false });

  if (uploadError) {
    throw new Error(`Could not upload image asset: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from("marketing-assets").getPublicUrl(storagePath);

  return {
    imageUrl: data.publicUrl,
    storagePath,
    prompt,
    model,
    size
  };
}
