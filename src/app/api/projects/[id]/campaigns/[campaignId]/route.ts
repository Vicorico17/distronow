import { NextResponse } from "next/server";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { deleteCampaign, getBrandProjectWorkspace } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

type RouteContext = {
  params: Promise<{
    id: string;
    campaignId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, campaignId } = await context.params;

  try {
    const user = await getCurrentUser();
    const anonymousOwnerId = await getAnonymousOwnerId();
    const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    await deleteCampaign({ projectId: id, campaignId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete campaign.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
