export const SUPABASE_PROJECT_REF = "czxrhuuopbcujyeryxml";
export const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? SUPABASE_URL;
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

