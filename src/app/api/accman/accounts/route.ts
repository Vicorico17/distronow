/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { encryptEmailPassword, decryptEmailPassword } from "@/lib/accman-crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";

const username = z.string().trim().transform((value) => value.replace(/^@/, "")).pipe(z.string().min(1).max(100));
const fields = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  label: z.string().trim().max(120).default(""),
  instagramUsername: username,
  tiktokUsername: username,
  emailPassword: z.string().min(1).max(4096).optional(),
});
const actionSchema = z.discriminatedUnion("action", [
  fields.extend({ action: z.literal("create"), emailPassword: z.string().min(1).max(4096) }),
  z.object({ action: z.literal("import"), rows: fields.extend({ emailPassword: z.string().min(1).max(4096) }).array().min(1).max(100) }),
  fields.extend({ action: z.literal("update"), id: z.string().uuid() }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
  z.object({ action: z.literal("reveal"), id: z.string().uuid() }),
]);

const noStore = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to access your accounts." }, { status: 401, headers: noStore });
  const db = createSupabaseAdminClient() as any;
  if (!db) return NextResponse.json({ error: "Account storage is not configured." }, { status: 503, headers: noStore });

  const url = new URL(request.url);
  const page = Math.max(0, Math.min(100000, Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0));
  const search = (url.searchParams.get("search") ?? "").trim().slice(0, 100);
  let query = db.from("accman_accounts")
    .select("id,email,label,instagram_username,tiktok_username,created_at,updated_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .range(page * 50, page * 50 + 49);
  if (search) query = query.ilike("email", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: "Could not load accounts." }, { status: 500, headers: noStore });
  return NextResponse.json({ accounts: data ?? [], total: count ?? 0, page }, { headers: noStore });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to manage your accounts." }, { status: 401, headers: noStore });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the email, usernames, and password." }, { status: 400, headers: noStore });
  const db = createSupabaseAdminClient() as any;
  if (!db) return NextResponse.json({ error: "Account storage is not configured." }, { status: 503, headers: noStore });
  const value = parsed.data;

  if (value.action === "import") {
    const emails = value.rows.map((row) => row.email);
    if (new Set(emails).size !== emails.length) return NextResponse.json({ error: "The import contains duplicate emails." }, { status: 400, headers: noStore });
    let rows;
    try {
      rows = value.rows.map((row) => ({
        user_id: user.id,
        email: row.email,
        label: row.label,
        instagram_username: row.instagramUsername,
        tiktok_username: row.tiktokUsername,
        email_password_encrypted: encryptEmailPassword(row.emailPassword),
      }));
    } catch {
      return NextResponse.json({ error: "Account encryption is not configured." }, { status: 503, headers: noStore });
    }
    const { error } = await db.from("accman_accounts").insert(rows);
    if (error?.code === "23505") return NextResponse.json({ error: "An imported email already exists. Remove it and try again." }, { status: 409, headers: noStore });
    if (error) return NextResponse.json({ error: "Could not import accounts. Check that the database migration has been applied." }, { status: 500, headers: noStore });
    return NextResponse.json({ imported: rows.length }, { headers: noStore });
  }

  if (value.action === "reveal") {
    const rate = checkRateLimit({ scope: "accman-reveal", key: user.id, limit: 20, windowMs: 60_000 });
    if (rate.limited) return NextResponse.json({ error: "Too many password requests. Try again shortly." }, { status: 429, headers: noStore });
    const { data, error } = await db.from("accman_accounts").select("email_password_encrypted").eq("id", value.id).eq("user_id", user.id).maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Account not found." }, { status: 404, headers: noStore });
    try {
      return NextResponse.json({ password: decryptEmailPassword(data.email_password_encrypted) }, { headers: noStore });
    } catch {
      return NextResponse.json({ error: "Could not decrypt this password. Check the server credential key." }, { status: 500, headers: noStore });
    }
  }

  if (value.action === "delete") {
    const { data, error } = await db.from("accman_accounts").delete().eq("id", value.id).eq("user_id", user.id).select("id").maybeSingle();
    if (error) return NextResponse.json({ error: "Could not delete account." }, { status: 500, headers: noStore });
    if (!data) return NextResponse.json({ error: "Account not found." }, { status: 404, headers: noStore });
    return NextResponse.json({ deleted: true }, { headers: noStore });
  }

  let encrypted: string | undefined;
  if (value.emailPassword) {
    try { encrypted = encryptEmailPassword(value.emailPassword); }
    catch { return NextResponse.json({ error: "Account encryption is not configured." }, { status: 503, headers: noStore }); }
  }
  const row = {
    email: value.email,
    label: value.label,
    instagram_username: value.instagramUsername,
    tiktok_username: value.tiktokUsername,
    updated_at: new Date().toISOString(),
    ...(encrypted ? { email_password_encrypted: encrypted } : {}),
  };
  const query = value.action === "create"
    ? db.from("accman_accounts").insert({ ...row, user_id: user.id })
    : db.from("accman_accounts").update(row).eq("id", value.id).eq("user_id", user.id);
  const { data, error } = await query.select("id,email,label,instagram_username,tiktok_username,created_at,updated_at").maybeSingle();
  if (error?.code === "23505") return NextResponse.json({ error: "This email is already in your accounts." }, { status: 409, headers: noStore });
  if (error) return NextResponse.json({ error: "Could not save account. Check that the database migration has been applied." }, { status: 500, headers: noStore });
  if (!data) return NextResponse.json({ error: "Account not found." }, { status: 404, headers: noStore });
  return NextResponse.json({ account: data }, { headers: noStore });
}
