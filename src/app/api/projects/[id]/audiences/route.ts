import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { generateAudienceRecommendations } from "@/lib/audience-generator";
import { getBrandAudiences, getBrandProjectWorkspace, saveBrandAudiences, type SavedBrandAudience } from "@/lib/brand-store";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/auth-server";

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

function audienceKey(audience: Pick<SavedBrandAudience, "name">) {
  return audience.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function uniqueNewAudiences(
  existing: SavedBrandAudience[],
  recommended: Array<Omit<SavedBrandAudience, "id" | "projectId" | "createdAt" | "updatedAt">>
) {
  const seen = new Set(existing.map(audienceKey));

  return recommended.filter((audience) => {
    const key = audienceKey(audience);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit({
    scope: "audience-generation",
    key: getClientKey(request),
    limit: 30,
    windowMs: 60 * 60 * 1000
  });

  if (rateLimit.limited) {
    return NextResponse.json({ error: "Too many audience requests. Try again later." }, { status: 429 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Send a valid audience action." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const anonymousOwnerId = await getAnonymousOwnerId();
    const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const existingAudiences = parsed.data.action === "recommend" ? await getBrandAudiences(id) : [];
    const audiences =
      parsed.data.action === "recommend"
        ? uniqueNewAudiences(existingAudiences, await generateAudienceRecommendations(workspace.latestExtraction))
        : [{ ...parsed.data.audience, source: "manual" }];

    if (!audiences.length) {
      return NextResponse.json({ audiences: [] });
    }

    const saved = await saveBrandAudiences({
      projectId: id,
      audiences,
      userId: workspace.project.userId
    });

    return NextResponse.json({ audiences: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save audiences.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
