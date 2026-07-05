import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandAudiences, getBrandProjectWorkspace, saveCampaign } from "@/lib/brand-store";
import { generateCampaign } from "@/lib/campaign-generator";
import { CHANNELS } from "@/lib/post-generator";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/auth-server";

const requestSchema = z.object({
  objective: z.string().min(1).max(1000),
  durationDays: z.number().int().min(7).max(30).default(7),
  channels: z.array(z.enum(CHANNELS)).min(1).max(CHANNELS.length),
  audienceId: z.string().uuid().nullable().optional()
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit({
    scope: "campaign-generation",
    key: getClientKey(request),
    limit: 20,
    windowMs: 60 * 60 * 1000
  });

  if (rateLimit.limited) {
    return NextResponse.json({ error: "Too many campaign requests. Try again later." }, { status: 429 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Send a valid campaign objective, duration, and channels." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const anonymousOwnerId = await getAnonymousOwnerId();
    const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const audiences = parsed.data.audienceId ? await getBrandAudiences(workspace.project.id) : [];
    const audience = audiences.find((item) => item.id === parsed.data.audienceId) ?? null;
    const generated = await generateCampaign({
      extraction: workspace.latestExtraction,
      audience,
      objective: parsed.data.objective,
      durationDays: parsed.data.durationDays,
      channels: parsed.data.channels
    });
    const campaign = await saveCampaign({
      projectId: workspace.project.id,
      userId: workspace.project.userId,
      audienceId: audience?.id ?? null,
      name: generated.name,
      objective: generated.objective,
      durationDays: generated.durationDays,
      channels: generated.channels,
      settings: {
        calendar: generated.calendar,
        provider: generated.provider,
        model: generated.model,
        promptVersion: generated.promptVersion
      }
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate campaign.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
