import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeWebsiteUrl } from "@/lib/brand";
import { saveBrandExtraction } from "@/lib/brand-store";
import { scrapeBranding } from "@/lib/firecrawl";

const requestSchema = z.object({
  url: z.string().min(1)
});

export async function POST(request: Request) {
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

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
