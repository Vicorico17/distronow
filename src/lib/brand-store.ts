import { BrandExtraction, BrandProfile } from "@/lib/brand";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type StoredBrandExtraction = {
  projectId: string;
  extractionId: string;
};

export type BrandProjectWorkspace = {
  project: {
    id: string;
    name: string | null;
    websiteUrl: string;
    domain: string;
    createdAt: string;
    updatedAt: string;
  };
  latestExtraction: BrandExtraction & {
    id: string;
    provider: string;
  };
};

function getDomain(sourceUrl: string) {
  return new URL(sourceUrl).hostname.replace(/^www\./, "");
}

export async function saveBrandExtraction(extraction: BrandExtraction): Promise<StoredBrandExtraction | null> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const domain = getDomain(extraction.sourceUrl);
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .upsert(
      {
        website_url: extraction.sourceUrl,
        domain,
        name: extraction.title ?? domain,
        updated_at: new Date().toISOString()
      },
      { onConflict: "domain" }
    )
    .select("id")
    .single();

  if (projectError) {
    throw new Error(`Could not save project: ${projectError.message}`);
  }

  const { data: savedExtraction, error: extractionError } = await supabase
    .from("brand_extractions")
    .insert({
      project_id: project.id,
      provider: "firecrawl",
      source_url: extraction.sourceUrl,
      title: extraction.title ?? null,
      description: extraction.description ?? null,
      branding: extraction.branding as Json,
      raw_metadata: (extraction.rawMetadata ?? null) as Json | null,
      captured_at: extraction.capturedAt
    })
    .select("id")
    .single();

  if (extractionError) {
    throw new Error(`Could not save brand extraction: ${extractionError.message}`);
  }

  return {
    projectId: project.id,
    extractionId: savedExtraction.id
  };
}

export async function getBrandProjectWorkspace(projectId: string): Promise<BrandProjectWorkspace | null> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,name,website_url,domain,created_at,updated_at")
    .eq("id", projectId)
    .single();

  if (projectError) {
    if (projectError.code === "PGRST116") {
      return null;
    }

    throw new Error(`Could not load project: ${projectError.message}`);
  }

  const { data: extraction, error: extractionError } = await supabase
    .from("brand_extractions")
    .select("id,provider,source_url,title,description,branding,raw_metadata,captured_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (extractionError) {
    if (extractionError.code === "PGRST116") {
      return null;
    }

    throw new Error(`Could not load brand extraction: ${extractionError.message}`);
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      websiteUrl: project.website_url,
      domain: project.domain,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    },
    latestExtraction: {
      id: extraction.id,
      provider: extraction.provider,
      sourceUrl: extraction.source_url,
      title: extraction.title ?? undefined,
      description: extraction.description ?? undefined,
      branding: extraction.branding as BrandProfile,
      rawMetadata: (extraction.raw_metadata ?? undefined) as Record<string, unknown> | undefined,
      capturedAt: extraction.captured_at
    }
  };
}

