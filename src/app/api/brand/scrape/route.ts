import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeWebsiteUrl } from "@/lib/brand";
import { saveBrandExtraction } from "@/lib/brand-store";
import { scrapeBranding } from "@/lib/firecrawl";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

const requestSchema = z.object({
  url: z.string().min(1)
});

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    scope: "brand-scrape",
    key: getClientKey(request),
    limit: 12,
    windowMs: 60 * 60 * 1000
  });

  if (rateLimit.limited) {
    return NextResponse.json({ error: "Too many scrape requests. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Send a website URL." }, { status: 400 });
  }

  try {
    const url = normalizeWebsiteUrl(parsed.data.url);
    const extraction = await scrapeBranding(url);
    const stored = await saveBrandExtraction(extraction);

    return NextResponse.json({ extraction, stored });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brand extraction failed.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
