import { NextResponse } from "next/server";
import { deleteBrandProject } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const user = await getCurrentUser();
    await deleteBrandProject({ projectId: id, userId: user?.id });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete project.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
