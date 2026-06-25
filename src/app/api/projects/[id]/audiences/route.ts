import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAudienceRecommendations } from "@/lib/audience-generator";
import { getBrandProjectWorkspace, saveBrandAudiences } from "@/lib/brand-store";

const audienceSchema = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
  painPoints: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  buyingTriggers: z.array(z.string()).default([]),
  objections: z.array(z.string()).default([]),
  channels: z.array(z.string()).default([]),
  contentAngles: z.array(z.string()).default([]),
  isPrimary: z.boolean().default(false)
});

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("recommend") }),
  z.object({ action: z.literal("create"), audience: audienceSchema })
]);

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
    return NextResponse.json({ error: "Send a valid audience action." }, { status: 400 });
  }

  try {
    const workspace = await getBrandProjectWorkspace(id);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const audiences =
      parsed.data.action === "recommend"
        ? await generateAudienceRecommendations(workspace.latestExtraction)
        : [{ ...parsed.data.audience, source: "manual" }];
    const saved = await saveBrandAudiences({
      projectId: id,
      audiences
    });

    return NextResponse.json({ audiences: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save audiences.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
