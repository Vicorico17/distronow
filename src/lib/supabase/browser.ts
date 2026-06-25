"use client";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export function createSupabaseBrowserClient() {
  const anonKey = getSupabaseAnonKey();

  if (!anonKey) {
    throw new Error("Missing Supabase publishable key.");
  }

  return createClient<Database>(getSupabaseUrl(), anonKey);
}
