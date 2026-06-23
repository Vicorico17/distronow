import { z } from "zod";
import { BrandExtraction, BrandProfile, detectBrandLanguage } from "./brand";

const firecrawlResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z
    .object({
      branding: z.record(z.unknown()).optional(),
      metadata: z.record(z.unknown()).optional(),
      warning: z.string().optional()
    })
    .optional(),
  error: z.string().optional()
});

type FirecrawlResponse = z.infer<typeof firecrawlResponseSchema>;

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export async function scrapeBranding(url: string): Promise<BrandExtraction> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FIRECRAWL_API_KEY. Add it to .env.local before scraping.");
  }

  const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url,
      formats: ["branding"],
      onlyMainContent: false,
      timeout: 60000
    })
  });

  const payload = (await response.json().catch(() => ({}))) as FirecrawlResponse;
  const parsed = firecrawlResponseSchema.safeParse(payload);

  if (!response.ok) {
    const message = parsed.success ? parsed.data.error : undefined;
    throw new Error(message ?? `Firecrawl returned HTTP ${response.status}.`);
  }

  if (!parsed.success) {
    throw new Error("Firecrawl returned an unexpected response.");
  }

  const data = parsed.data.data;

  if (!data) {
    throw new Error(parsed.data.error ?? "Firecrawl did not return scrape data.");
  }

  const branding = data.branding as BrandProfile | undefined;

  if (!branding) {
    throw new Error(data?.warning ?? "Firecrawl did not return branding data for this URL.");
  }

  const metadata = data.metadata;

  const extraction = {
    sourceUrl: readString(metadata?.sourceURL) ?? readString(metadata?.url) ?? url,
    title: readString(metadata?.title),
    description: readString(metadata?.description),
    branding,
    capturedAt: new Date().toISOString(),
    rawMetadata: metadata
  };

  return {
    ...extraction,
    language: detectBrandLanguage(extraction)
  };
}
