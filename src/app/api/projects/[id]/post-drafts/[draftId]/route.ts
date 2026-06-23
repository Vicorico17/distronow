import { NextResponse } from "next/server";
import { z } from "zod";
import { deletePostDraft, duplicatePostDraft, updatePostDraft } from "@/lib/brand-store";

const statusSchema = z.enum(["generated", "edited", "approved", "published"]);

const patchSchema = z.object({
  headline: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  status: statusSchema.optional()
});

const postSchema = z.object({
  action: z.enum(["duplicate"])
});

type RouteContext = {
  params: Promise<{
    id: string;
    draftId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id, draftId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Send valid draft updates." }, { status: 400 });
  }

  try {
    const draft = await updatePostDraft({
      projectId: id,
      draftId,
      updates: parsed.data
    });

    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update post draft.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { id, draftId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid draft action." }, { status: 400 });
  }

  try {
    const draft = await duplicatePostDraft({ projectId: id, draftId });

    return NextResponse.json({ draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not duplicate post draft.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, draftId } = await context.params;

  try {
    await deletePostDraft({ projectId: id, draftId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete post draft.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
