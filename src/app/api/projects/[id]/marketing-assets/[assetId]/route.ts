import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { deleteMarketingAsset, getBrandProjectWorkspace, updateMarketingAsset } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.string().min(1).max(60).optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
    assetId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id, assetId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Send valid asset updates." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const anonymousOwnerId = await getAnonymousOwnerId();
    const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const asset = await updateMarketingAsset({
      projectId: id,
      assetId,
      updates: parsed.data
    });

    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update asset.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, assetId } = await context.params;

  try {
    const user = await getCurrentUser();
    const anonymousOwnerId = await getAnonymousOwnerId();
    const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    await deleteMarketingAsset({ projectId: id, assetId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete asset.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
