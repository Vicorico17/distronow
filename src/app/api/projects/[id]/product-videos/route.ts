import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandAudiences, getBrandProjectWorkspace, saveMarketingAsset } from "@/lib/brand-store";
import { generateProductVideo } from "@/lib/product-video-generator";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/auth-server";

export const runtime = "nodejs";

const requestSchema = z.object({
  audienceId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(140),
  voiceover: z.string().min(1).max(1000),
  cta: z.string().max(100).optional(),
  notes: z.string().max(1000).optional()
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit({ scope: "product-video-generation", key: getClientKey(request), limit: 5, windowMs: 60 * 60 * 1000 });
  if (rateLimit.limited) return NextResponse.json({ error: "Too many product-video requests. Try again later." }, { status: 429 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a title and voiceover for the product video." }, { status: 400 });

  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const anonymousOwnerId = await getAnonymousOwnerId();
    const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);
    if (!workspace) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const audiences = await getBrandAudiences(id);
    const audience = audiences.find((item) => item.id === parsed.data.audienceId) ?? audiences[0] ?? null;
    const generated = await generateProductVideo({
      projectId: id,
      extraction: workspace.latestExtraction,
      audience,
      ...parsed.data,
      cta: parsed.data.cta ?? "Learn more"
    });
    const asset = await saveMarketingAsset({
      projectId: id,
      userId: workspace.project.userId,
      brandExtractionId: workspace.latestExtraction.id,
      audienceId: audience?.id ?? null,
      assetType: "Product video with audio",
      title: parsed.data.title,
      brief: audience?.summary ?? null,
      prompt: parsed.data.notes ?? null,
      content: { body: generated.voiceover, cta: parsed.data.cta ?? "", videoUrl: generated.videoUrl, mediaType: "video/mp4" },
      storagePath: generated.storagePath,
      provider: "hyperframes",
      model: generated.model,
      settings: { audienceId: audience?.id ?? null, durationSeconds: 8, format: "1080x1920" }
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not generate product video." }, { status: 400 });
  }
}
