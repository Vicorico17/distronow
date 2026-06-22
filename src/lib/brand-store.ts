import { BrandExtraction } from "@/lib/brand";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type StoredBrandExtraction = {
  projectId: string;
  extractionId: string;
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

