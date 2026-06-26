import { NextResponse } from "next/server";
import { z } from "zod";
import { updateBrandProject } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

const requestSchema = z.object({
  brandName: z.string().min(1),
  brandDescription: z.string().optional().default(""),
  language: z.string().optional().default(""),
  tone: z.string().optional(),
  audience: z.string().optional(),
  brandLogo: z.string().url().optional().or(z.literal("")),
  brandColors: z.record(z.string()).default({}),
  brandFonts: z.array(z.object({ family: z.string().min(1) })).default([]),
  brandFieldsStatus: z.record(z.enum(["pending", "confirmed", "ignored"])).default({})
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Send valid brand profile updates." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    await updateBrandProject({
      projectId: id,
      userId: user?.id,
      updates: {
        brandName: parsed.data.brandName,
        brandDescription: parsed.data.brandDescription ?? null,
        language: parsed.data.language ?? null,
        tone: parsed.data.tone ?? null,
        audience: parsed.data.audience ?? null,
        brandLogo: parsed.data.brandLogo || null,
        brandColors: parsed.data.brandColors,
        brandFonts: parsed.data.brandFonts,
        brandFieldsStatus: parsed.data.brandFieldsStatus
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update brand profile.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
