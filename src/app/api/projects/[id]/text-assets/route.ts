import { NextResponse } from "next/server";
import { z } from "zod";
import { CONTENT_ASSET_TYPES } from "@/lib/asset-types";
import { getBrandAudiences, getBrandProjectWorkspace, saveMarketingAsset } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { generateTextAsset } from "@/lib/text-asset-generator";

const requestSchema = z.object({
  assetType: z.enum(CONTENT_ASSET_TYPES),
  audienceId: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000).optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid content type." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const workspace = await getBrandProjectWorkspace(id, user?.id);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const audiences = await getBrandAudiences(id);
    const audience = audiences.find((item) => item.id === parsed.data.audienceId) ?? audiences[0] ?? null;
    const generated = await generateTextAsset({
      extraction: workspace.latestExtraction,
      audience,
      assetType: parsed.data.assetType,
      notes: parsed.data.notes
    });
    const asset = await saveMarketingAsset({
      projectId: id,
      userId: workspace.project.userId,
      brandExtractionId: workspace.latestExtraction.id,
      audienceId: audience?.id ?? null,
      assetType: parsed.data.assetType,
      title: generated.title,
      brief: audience?.summary ?? null,
      prompt: generated.visualDirection,
      content: {
        body: generated.body,
        cta: generated.cta,
        caption: generated.caption,
        visualDirection: generated.visualDirection
      },
      provider: generated.provider,
      model: generated.model,
      settings: {
        assetType: parsed.data.assetType,
        audienceId: audience?.id ?? null,
        notes: parsed.data.notes ?? null,
        promptVersion: generated.promptVersion
      }
    });

    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate text asset.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
