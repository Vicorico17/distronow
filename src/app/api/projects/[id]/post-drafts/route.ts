import { NextResponse } from "next/server";
import { z } from "zod";
import { getBrandProjectWorkspace, savePostDrafts } from "@/lib/brand-store";
import { CHANNELS, generatePostDrafts, INTENTS, LANGUAGES, LENGTHS, TONES } from "@/lib/post-generator";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

const requestSchema = z.object({
  channel: z.enum(CHANNELS),
  intent: z.enum(INTENTS),
  language: z.enum(LANGUAGES).default("Auto"),
  tone: z.enum(TONES).default("Auto"),
  length: z.enum(LENGTHS).default("Medium")
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit({
    scope: "post-draft-generation",
    key: getClientKey(request),
    limit: 30,
    windowMs: 60 * 60 * 1000
  });

  if (rateLimit.limited) {
    return NextResponse.json({ error: "Too many generation requests. Try again later." }, { status: 429 });
  }

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

    const generated = await generatePostDrafts({
      extraction: workspace.latestExtraction,
      settings: parsed.data
    });
    const drafts = await savePostDrafts({
      projectId: workspace.project.id,
      brandExtractionId: workspace.latestExtraction.id,
      drafts: generated
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate post drafts.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
