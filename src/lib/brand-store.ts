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

export type SavedBrandAudience = {
  id: string;
  projectId: string;
  name: string;
  summary: string;
  painPoints: string[];
  goals: string[];
  buyingTriggers: string[];
  objections: string[];
  channels: string[];
  contentAngles: string[];
  isPrimary: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedMarketingAsset = {
  id: string;
  projectId: string;
  brandExtractionId: string | null;
  audienceId: string | null;
  assetType: string;
  title: string;
  brief: string | null;
  prompt: string | null;
  content: Json;
  imageUrl: string | null;
  storagePath: string | null;
  provider: string;
  model: string | null;
  status: string;
  settings: Json;
  createdAt: string;
  updatedAt: string;
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
const audienceSelect =
  "id,project_id,name,summary,pain_points,goals,buying_triggers,objections,channels,content_angles,is_primary,source,created_at,updated_at";
const marketingAssetSelect =
  "id,project_id,brand_extraction_id,audience_id,asset_type,title,brief,prompt,content,image_url,storage_path,provider,model,status,settings,created_at,updated_at";

function mapSavedBrandAudience(audience: {
  id: string;
  project_id: string;
  name: string;
  summary: string;
  pain_points: string[];
  goals: string[];
  buying_triggers: string[];
  objections: string[];
  channels: string[];
  content_angles: string[];
  is_primary: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}): SavedBrandAudience {
  return {
    id: audience.id,
    projectId: audience.project_id,
    name: audience.name,
    summary: audience.summary,
    painPoints: audience.pain_points,
    goals: audience.goals,
    buyingTriggers: audience.buying_triggers,
    objections: audience.objections,
    channels: audience.channels,
    contentAngles: audience.content_angles,
    isPrimary: audience.is_primary,
    source: audience.source,
    createdAt: audience.created_at,
    updatedAt: audience.updated_at
  };
}

function mapSavedMarketingAsset(asset: {
  id: string;
  project_id: string;
  brand_extraction_id: string | null;
  audience_id: string | null;
  asset_type: string;
  title: string;
  brief: string | null;
  prompt: string | null;
  content: Json;
  image_url: string | null;
  storage_path: string | null;
  provider: string;
  model: string | null;
  status: string;
  settings: Json;
  created_at: string;
  updated_at: string;
}): SavedMarketingAsset {
  return {
    id: asset.id,
    projectId: asset.project_id,
    brandExtractionId: asset.brand_extraction_id,
    audienceId: asset.audience_id,
    assetType: asset.asset_type,
    title: asset.title,
    brief: asset.brief,
    prompt: asset.prompt,
    content: asset.content,
    imageUrl: asset.image_url,
    storagePath: asset.storage_path,
    provider: asset.provider,
    model: asset.model,
    status: asset.status,
    settings: asset.settings,
    createdAt: asset.created_at,
    updatedAt: asset.updated_at
  };
}

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

export async function getBrandAudiences(projectId: string): Promise<SavedBrandAudience[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data, error } = await supabase
    .from("brand_audiences")
    .select(audienceSelect)
    .eq("project_id", projectId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      return [];
    }

    throw new Error(`Could not load brand audiences: ${error.message}`);
  }

  return data.map(mapSavedBrandAudience);
}

export async function saveBrandAudiences({
  projectId,
  audiences
}: {
  projectId: string;
  audiences: Array<Omit<SavedBrandAudience, "id" | "projectId" | "createdAt" | "updatedAt">>;
}) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data, error } = await supabase
    .from("brand_audiences")
    .insert(
      audiences.map((audience) => ({
        project_id: projectId,
        name: audience.name,
        summary: audience.summary,
        pain_points: audience.painPoints,
        goals: audience.goals,
        buying_triggers: audience.buyingTriggers,
        objections: audience.objections,
        channels: audience.channels,
        content_angles: audience.contentAngles,
        is_primary: audience.isPrimary,
        source: audience.source
      }))
    )
    .select(audienceSelect);

  if (error) {
    throw new Error(`Could not save brand audiences: ${error.message}`);
  }

  return data.map(mapSavedBrandAudience);
}

export async function updateBrandAudience({
  projectId,
  audienceId,
  updates
}: {
  projectId: string;
  audienceId: string;
  updates: Partial<
    Pick<
      SavedBrandAudience,
      "name" | "summary" | "painPoints" | "goals" | "buyingTriggers" | "objections" | "channels" | "contentAngles" | "isPrimary"
    >
  >;
}) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data, error } = await supabase
    .from("brand_audiences")
    .update({
      name: updates.name,
      summary: updates.summary,
      pain_points: updates.painPoints,
      goals: updates.goals,
      buying_triggers: updates.buyingTriggers,
      objections: updates.objections,
      channels: updates.channels,
      content_angles: updates.contentAngles,
      is_primary: updates.isPrimary
    })
    .eq("project_id", projectId)
    .eq("id", audienceId)
    .select(audienceSelect)
    .single();

  if (error) {
    throw new Error(`Could not update brand audience: ${error.message}`);
  }

  return mapSavedBrandAudience(data);
}

export async function getMarketingAssets(projectId: string): Promise<SavedMarketingAsset[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data, error } = await supabase
    .from("marketing_assets")
    .select(marketingAssetSelect)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    if (error.code === "42P01") {
      return [];
    }

    throw new Error(`Could not load marketing assets: ${error.message}`);
  }

  return data.map(mapSavedMarketingAsset);
}

export async function saveMarketingAsset({
  projectId,
  brandExtractionId,
  audienceId,
  assetType,
  title,
  brief,
  prompt,
  content,
  imageUrl,
  storagePath,
  provider,
  model,
  status,
  settings
}: {
  projectId: string;
  brandExtractionId: string | null;
  audienceId: string | null;
  assetType: string;
  title: string;
  brief?: string | null;
  prompt?: string | null;
  content?: Json;
  imageUrl?: string | null;
  storagePath?: string | null;
  provider: string;
  model?: string | null;
  status?: string;
  settings?: Json;
}) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data, error } = await supabase
    .from("marketing_assets")
    .insert({
      project_id: projectId,
      brand_extraction_id: brandExtractionId,
      audience_id: audienceId,
      asset_type: assetType,
      title,
      brief,
      prompt,
      content: content ?? {},
      image_url: imageUrl,
      storage_path: storagePath,
      provider,
      model,
      status: status ?? "generated",
      settings: settings ?? {}
    })
    .select(marketingAssetSelect)
    .single();

  if (error) {
    throw new Error(`Could not save marketing asset: ${error.message}`);
  }

  return mapSavedMarketingAsset(data);
}
