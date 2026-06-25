import { NextResponse } from "next/server";
import { z } from "zod";
import { getBrandProjectWorkspace, updateBrandAudience } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  painPoints: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  buyingTriggers: z.array(z.string()).optional(),
  objections: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
  contentAngles: z.array(z.string()).optional(),
  isPrimary: z.boolean().optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
    audienceId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id, audienceId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Send valid audience updates." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const workspace = await getBrandProjectWorkspace(id, user?.id);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const audience = await updateBrandAudience({
      projectId: id,
      audienceId,
      updates: parsed.data
    });

    return NextResponse.json({ audience });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update audience.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
