import { NextResponse } from "next/server";
import { z } from "zod";
import { getBrandProjectWorkspace, savePostDrafts } from "@/lib/brand-store";
import { CHANNELS, generatePostDrafts, INTENTS } from "@/lib/post-generator";

const requestSchema = z.object({
  channel: z.enum(CHANNELS),
  intent: z.enum(INTENTS)
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
    return NextResponse.json({ error: "Choose a channel and intent." }, { status: 400 });
  }

  try {
    const workspace = await getBrandProjectWorkspace(id);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const generated = generatePostDrafts({
      extraction: workspace.latestExtraction,
      channel: parsed.data.channel,
      intent: parsed.data.intent
    });
    const drafts = await savePostDrafts({
      projectId: workspace.project.id,
      brandExtractionId: workspace.latestExtraction.id,
      drafts: generated
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate post drafts.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
