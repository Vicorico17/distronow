import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";
import {
  emptyAcquisition,
  stateSchema,
  type AcquisitionState,
} from "./acquisition";

export function acquisitionDb() {
  const key = getSupabaseServiceRoleKey();
  if (!key) throw new Error("Project storage is not configured.");
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function readAcquisition(projectId: string) {
  const { data, error } = await acquisitionDb()
    .from("acquisition_workspaces")
    .select("payload,updated_at,status")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error)
    throw new Error(
      "Acquisition storage is unavailable. Apply the acquisition_workspaces migration and check database connectivity.",
    );
  return {
    state: data ? stateSchema.parse(data.payload) : emptyAcquisition(),
    version: data?.updated_at as string | undefined,
    status: data?.status as string | undefined,
  };
}
export async function writeAcquisition(
  projectId: string,
  state: AcquisitionState,
  version?: string,
  status = "ready",
) {
  const db = acquisitionDb();
  const updated = new Date(
    Math.max(Date.now(), version ? Date.parse(version) + 1 : 0),
  ).toISOString();
  const payload = stateSchema.parse(state);
  const result = version
    ? await db
        .from("acquisition_workspaces")
        .update({ payload, status, updated_at: updated })
        .eq("project_id", projectId)
        .eq("updated_at", version)
        .select("updated_at")
        .maybeSingle()
    : await db
        .from("acquisition_workspaces")
        .insert({ project_id: projectId, status, payload, updated_at: updated })
        .select("updated_at")
        .single();
  if (result.error || !result.data)
    throw new Error(
      "This workspace changed in another session. Refresh before trying again.",
    );
  return result.data.updated_at as string;
}
