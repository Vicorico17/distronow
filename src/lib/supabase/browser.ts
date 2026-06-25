"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export function createSupabaseBrowserClient() {
  const anonKey = getSupabaseAnonKey();

  if (!anonKey) {
    throw new Error("Missing Supabase publishable key.");
  }

  return createBrowserClient<Database>(getSupabaseUrl(), anonKey);
}
