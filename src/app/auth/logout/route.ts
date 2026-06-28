import { NextResponse } from "next/server";
import { createSupabaseCookieClient } from "@/lib/supabase/auth-server";

export async function POST(request: Request) {
  const supabase = await createSupabaseCookieClient();
  await supabase?.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
