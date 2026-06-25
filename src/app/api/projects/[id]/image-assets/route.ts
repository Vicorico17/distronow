import { NextResponse } from "next/server";
import { z } from "zod";
import { IMAGE_ASSET_TYPES } from "@/lib/asset-types";
import { getBrandAudiences, getBrandProjectWorkspace, saveMarketingAsset } from "@/lib/brand-store";
import { generateImageAsset } from "@/lib/image-asset-generator";
import { getCurrentUser } from "@/lib/supabase/auth-server";

const requestSchema = z.object({
  assetType: z.enum(IMAGE_ASSET_TYPES),
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
    return NextResponse.json({ error: "Choose a valid image asset type." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const workspace = await getBrandProjectWorkspace(id, user?.id);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const audiences = await getBrandAudiences(id);
    const audience = audiences.find((item) => item.id === parsed.data.audienceId) ?? audiences[0] ?? null;
    const generated = await generateImageAsset({
      projectId: id,
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
      title: parsed.data.assetType,
      brief: audience?.summary ?? null,
      prompt: generated.prompt,
      content: { size: generated.size },
      imageUrl: generated.imageUrl,
      storagePath: generated.storagePath,
      provider: "openai",
      model: generated.model,
      settings: {
        assetType: parsed.data.assetType,
        audienceId: audience?.id ?? null,
        notes: parsed.data.notes ?? null
      }
    });

    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate image asset.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
