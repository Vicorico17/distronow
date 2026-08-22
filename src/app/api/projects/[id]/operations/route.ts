/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";

const strategyTypes = ["product_information", "marketing_strategy", "competitor_analysis", "brand_voice", "content_strategy"] as const;
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save_strategy"), documentType: z.enum(strategyTypes), title: z.string().min(1), content: z.string().min(1), status: z.enum(["draft", "review", "confirmed"]).default("draft") }),
  z.object({ action: z.literal("add_signal"), title: z.string().min(1), evidence: z.string().min(1), sourceUrl: z.string().url().optional().or(z.literal("")), sourceName: z.string().optional(), signalType: z.string().default("pain"), fitScore: z.number().int().min(0).max(5).default(0), painScore: z.number().int().min(0).max(5).default(0), timingScore: z.number().int().min(0).max(5).default(0), reachabilityScore: z.number().int().min(0).max(5).default(0), evidenceScore: z.number().int().min(0).max(5).default(0) }),
  z.object({ action: z.literal("add_prospect"), companyName: z.string().min(1), domain: z.string().optional(), contactName: z.string().optional(), contactRole: z.string().optional(), email: z.string().email().optional().or(z.literal("")), fitScore: z.number().int().min(0).max(100).default(0), sourceUrl: z.string().url().optional().or(z.literal("")) }),
  z.object({ action: z.literal("add_account"), platform: z.string().min(1), handle: z.string().min(1), displayName: z.string().optional(), followerCount: z.number().int().min(0).optional() }),
  z.object({ action: z.literal("schedule_post"), title: z.string().min(1), platform: z.string().min(1), scheduledFor: z.string().optional(), notes: z.string().optional() }),
  z.object({ action: z.literal("add_metric"), platform: z.string().min(1), impressions: z.number().int().min(0).default(0), engagements: z.number().int().min(0).default(0), clicks: z.number().int().min(0).default(0), conversions: z.number().int().min(0).default(0) }),
  z.object({ action: z.literal("create_task"), category: z.string().min(1), title: z.string().min(1), description: z.string().default(""), priority: z.enum(["low", "normal", "high", "urgent"]).default("normal") })
]);

type Context = { params: Promise<{ id: string }> };

async function authorizedProject(id: string) {
  const user = await getCurrentUser();
  const anonymousOwnerId = await getAnonymousOwnerId();
  return getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const workspace = await authorizedProject(id);
    if (!workspace) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const supabase = createSupabaseAdminClient() as any;
    if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    const [strategies, signals, profiles, accounts, posts, campaigns, prospects, messages, tasks] = await Promise.all([
      supabase.from("strategy_documents").select("*").eq("project_id", id).order("updated_at", { ascending: false }),
      supabase.from("customer_signals").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("customer_profiles").select("*").eq("project_id", id).order("fit_score", { ascending: false }),
      supabase.from("social_accounts").select("*").eq("project_id", id).order("platform"),
      supabase.from("scheduled_posts").select("*").eq("project_id", id).order("scheduled_for", { ascending: true }),
      supabase.from("acquisition_campaigns").select("*").eq("project_id", id).order("updated_at", { ascending: false }),
      supabase.from("prospects").select("*").eq("project_id", id).order("fit_score", { ascending: false }),
      supabase.from("outreach_messages").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("agent_tasks").select("*").eq("project_id", id).neq("status", "done").order("created_at", { ascending: false })
    ]);
    const result = { strategies, signals, profiles, accounts, posts, campaigns, prospects, messages, tasks };
    const firstError = Object.values(result).find((entry: any) => entry.error)?.error;
    if (firstError) return NextResponse.json({ error: firstError.message }, { status: 400 });
    return NextResponse.json(Object.fromEntries(Object.entries(result).map(([key, entry]: any) => [key, entry.data ?? []])));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load operations." }, { status: 400 });
  }
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send a valid operations action." }, { status: 400 });
  try {
    const workspace = await authorizedProject(id);
    if (!workspace) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const supabase = createSupabaseAdminClient() as any;
    if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    const value = parsed.data;
    const table = value.action === "save_strategy" ? "strategy_documents" : value.action === "add_signal" ? "customer_signals" : value.action === "add_prospect" ? "prospects" : value.action === "add_account" ? "social_accounts" : value.action === "schedule_post" ? "scheduled_posts" : value.action === "add_metric" ? "post_metrics" : "agent_tasks";
    const payload = value.action === "save_strategy"
      ? { project_id: id, document_type: value.documentType, title: value.title, content: value.content, status: value.status }
      : value.action === "add_signal"
        ? { project_id: id, title: value.title, evidence: value.evidence, source_url: value.sourceUrl || null, source_name: value.sourceName || null, signal_type: value.signalType, fit_score: value.fitScore, pain_score: value.painScore, timing_score: value.timingScore, reachability_score: value.reachabilityScore, evidence_score: value.evidenceScore, status: "new" }
        : value.action === "add_prospect"
          ? { project_id: id, company_name: value.companyName, domain: value.domain || null, contact_name: value.contactName || null, contact_role: value.contactRole || null, email: value.email || null, fit_score: value.fitScore, source_url: value.sourceUrl || null, status: "candidate" }
          : value.action === "add_account"
            ? { project_id: id, platform: value.platform, handle: value.handle, display_name: value.displayName || null, follower_count: value.followerCount ?? null, status: "planned" }
            : value.action === "schedule_post"
              ? { project_id: id, title: value.title, platform: value.platform, scheduled_for: value.scheduledFor || null, notes: value.notes || null, status: "planned" }
              : value.action === "add_metric"
                ? { project_id: id, platform: value.platform, impressions: value.impressions, engagements: value.engagements, clicks: value.clicks, conversions: value.conversions }
          : { project_id: id, category: value.category, title: value.title, description: value.description, priority: value.priority };
    const { data, error } = await supabase.from(table).insert(payload).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save operation." }, { status: 400 });
  }
}
