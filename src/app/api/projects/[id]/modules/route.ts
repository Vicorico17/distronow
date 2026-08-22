/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { MODULE_SEED_RECORDS } from "@/lib/module-seed-data";
import { CORE_MODULE_SLUGS } from "@/lib/module-catalog";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("import_all") }),
  z.object({ action: z.literal("upsert_record"), module: z.string().min(1), recordType: z.string().min(1), externalId: z.string().min(1), name: z.string().min(1), status: z.string().min(1), sourceRepo: z.string().min(1), payload: z.record(z.string(), z.unknown()).default({}) })
]);

type Context = { params: Promise<{ id: string }> };

async function authorizedProject(id: string) {
  const user = await getCurrentUser();
  const anonymousOwnerId = await getAnonymousOwnerId();
  return getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const workspace = await authorizedProject(id);
  if (!workspace) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const supabase = createSupabaseAdminClient() as any;
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data, error } = await supabase.from("module_records").select("*").eq("project_id", id).order("module").order("record_type").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ records: data ?? [] });
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send a valid module migration action." }, { status: 400 });
  const workspace = await authorizedProject(id);
  if (!workspace) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const supabase = createSupabaseAdminClient() as any;
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const records = parsed.data.action === "import_all" ? MODULE_SEED_RECORDS.filter((record) => CORE_MODULE_SLUGS.includes(record.module as (typeof CORE_MODULE_SLUGS)[number]) || record.module === "reclip") : [parsed.data];
  const payload = records.map((record) => ({
    project_id: id,
    module: record.module,
    record_type: record.recordType,
    external_id: record.externalId,
    name: record.name,
    status: record.status,
    source_repo: record.sourceRepo,
    payload: record.payload
  }));
  const { data, error } = await supabase.from("module_records").upsert(payload, { onConflict: "project_id,module,record_type,external_id" }).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ records: data ?? [], imported: payload.length });
}
