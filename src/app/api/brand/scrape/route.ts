import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAnonymousOwnerId } from "@/lib/anonymous-owner";
import { normalizeWebsiteUrl } from "@/lib/brand";
import { saveBrandExtraction } from "@/lib/brand-store";
import { scrapeBranding } from "@/lib/firecrawl";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/auth-server";

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
    const user = await getCurrentUser();
    const anonymousOwnerId = user ? null : await getOrCreateAnonymousOwnerId();
    const extraction = await scrapeBranding(url);
    let stored = null;
    let warning: string | undefined;

    try {
      stored = await saveBrandExtraction(extraction, user?.id, anonymousOwnerId);
    } catch (storageError) {
      console.error("Brand extraction succeeded but could not be saved:", storageError);
      warning = "The website data was extracted, but the project could not be saved. You can still review the results below.";
    }

    return NextResponse.json({ extraction, stored, warning });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brand extraction failed.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
