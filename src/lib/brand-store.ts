import { BrandExtraction, BrandProfile } from "@/lib/brand";
import {
  ContentChannel,
  ContentIntent,
  ContentLength,
  DraftGenerationSettings,
  DraftProvider,
  GeneratedPostDraft
} from "@/lib/post-generator";
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
    language: string | null;
    tone: string | null;
    audience: string | null;
    createdAt: string;
    updatedAt: string;
  };
  latestExtraction: BrandExtraction & {
    id: string;
    provider: string;
  };
  postDrafts: SavedPostDraft[];
};

export type SavedPostDraft = Omit<
  GeneratedPostDraft,
  "language" | "tone" | "length" | "provider" | "model" | "promptVersion" | "settings"
> & {
  id: string;
  projectId: string;
  brandExtractionId: string | null;
  status: "generated" | "edited" | "approved" | "published";
  language: string | null;
  tone: string | null;
  length: ContentLength | null;
  provider: DraftProvider;
  model: string | null;
  promptVersion: string | null;
  settings: DraftGenerationSettings | null;
  createdAt: string;
  updatedAt: string | null;
};

function mapSavedPostDraft(draft: {
  id: string;
  project_id: string;
  brand_extraction_id: string | null;
  channel: string;
  intent: string;
  headline: string;
  body: string;
  cta: string | null;
  hashtags: string[];
  status: string;
  language: string | null;
  tone: string | null;
  length: string | null;
  provider: string;
  model: string | null;
  prompt_version: string | null;
  settings: Json;
  created_at: string;
  updated_at: string;
}): SavedPostDraft {
  return {
    id: draft.id,
    projectId: draft.project_id,
    brandExtractionId: draft.brand_extraction_id,
    channel: draft.channel as ContentChannel,
    intent: draft.intent as ContentIntent,
    status: draft.status as SavedPostDraft["status"],
    language: draft.language,
    tone: draft.tone,
    length: draft.length as ContentLength | null,
    headline: draft.headline,
    body: draft.body,
    cta: draft.cta ?? "",
    hashtags: draft.hashtags,
    provider: draft.provider as DraftProvider,
    model: draft.model,
    promptVersion: draft.prompt_version,
    settings: (draft.settings ?? null) as DraftGenerationSettings | null,
    createdAt: draft.created_at,
    updatedAt: draft.updated_at
  };
}

const postDraftSelect =
  "id,project_id,brand_extraction_id,channel,intent,headline,body,cta,hashtags,status,language,tone,length,provider,model,prompt_version,settings,created_at,updated_at";

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
        language: extraction.language ?? null,
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
      language: extraction.language ?? null,
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
    .select("id,name,website_url,domain,language,tone,audience,created_at,updated_at")
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
    .select("id,provider,source_url,title,description,language,branding,raw_metadata,captured_at")
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
      language: project.language,
      tone: project.tone,
      audience: project.audience,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    },
    latestExtraction: {
      id: extraction.id,
      provider: extraction.provider,
      sourceUrl: extraction.source_url,
      title: extraction.title ?? undefined,
      description: extraction.description ?? undefined,
      language: extraction.language ?? undefined,
      branding: extraction.branding as BrandProfile,
      rawMetadata: (extraction.raw_metadata ?? undefined) as Record<string, unknown> | undefined,
      capturedAt: extraction.captured_at
    },
    postDrafts: await getPostDrafts(project.id)
  };
}

export async function getPostDrafts(projectId: string): Promise<SavedPostDraft[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data, error } = await supabase
    .from("post_drafts")
    .select(postDraftSelect)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    if (error.code === "42P01") {
      return [];
    }

    throw new Error(`Could not load post drafts: ${error.message}`);
  }

  return data.map(mapSavedPostDraft);
}

export async function savePostDrafts({
  projectId,
  brandExtractionId,
  drafts
}: {
  projectId: string;
  brandExtractionId: string;
  drafts: GeneratedPostDraft[];
}) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data, error } = await supabase
    .from("post_drafts")
    .insert(
      drafts.map((draft) => ({
        project_id: projectId,
        brand_extraction_id: brandExtractionId,
        channel: draft.channel,
        intent: draft.intent,
        headline: draft.headline,
        body: draft.body,
        cta: draft.cta,
        hashtags: draft.hashtags,
        language: draft.language,
        tone: draft.tone,
        length: draft.length,
        provider: draft.provider,
        model: draft.model,
        prompt_version: draft.promptVersion,
        settings: draft.settings as unknown as Json
      }))
    )
    .select(postDraftSelect);

  if (error) {
    throw new Error(`Could not save post drafts: ${error.message}`);
  }

  return data.map(mapSavedPostDraft);
}

export async function updatePostDraft({
  projectId,
  draftId,
  updates
}: {
  projectId: string;
  draftId: string;
  updates: Partial<Pick<SavedPostDraft, "headline" | "body" | "cta" | "hashtags" | "status">>;
}) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data, error } = await supabase
    .from("post_drafts")
    .update({
      headline: updates.headline,
      body: updates.body,
      cta: updates.cta,
      hashtags: updates.hashtags,
      status: updates.status
    })
    .eq("project_id", projectId)
    .eq("id", draftId)
    .select(postDraftSelect)
    .single();

  if (error) {
    throw new Error(`Could not update post draft: ${error.message}`);
  }

  return mapSavedPostDraft(data);
}

export async function deletePostDraft({ projectId, draftId }: { projectId: string; draftId: string }) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { error } = await supabase.from("post_drafts").delete().eq("project_id", projectId).eq("id", draftId);

  if (error) {
    throw new Error(`Could not delete post draft: ${error.message}`);
  }
}

export async function duplicatePostDraft({ projectId, draftId }: { projectId: string; draftId: string }) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data: draft, error: loadError } = await supabase
    .from("post_drafts")
    .select(postDraftSelect)
    .eq("project_id", projectId)
    .eq("id", draftId)
    .single();

  if (loadError) {
    throw new Error(`Could not load post draft: ${loadError.message}`);
  }

  const { data, error } = await supabase
    .from("post_drafts")
    .insert({
      project_id: projectId,
      brand_extraction_id: draft.brand_extraction_id,
      channel: draft.channel,
      intent: draft.intent,
      headline: draft.headline,
      body: draft.body,
      cta: draft.cta,
      hashtags: draft.hashtags,
      status: "generated",
      language: draft.language,
      tone: draft.tone,
      length: draft.length,
      provider: draft.provider,
      model: draft.model,
      prompt_version: draft.prompt_version,
      settings: draft.settings
    })
    .select(postDraftSelect)
    .single();

  if (error) {
    throw new Error(`Could not duplicate post draft: ${error.message}`);
  }

  return mapSavedPostDraft(data);
}
