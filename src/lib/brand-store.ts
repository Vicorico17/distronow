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
    userId: string | null;
    name: string | null;
    websiteUrl: string;
    domain: string;
    language: string | null;
    tone: string | null;
    audience: string | null;
    brandName: string | null;
    brandDescription: string | null;
    brandColors: Json;
    brandFonts: Json;
    brandLogo: string | null;
    brandAssets: Json;
    brandConfidence: Json;
    brandFieldsStatus: Json;
    createdAt: string;
    updatedAt: string;
  };
  latestExtraction: BrandExtraction & {
    id: string;
    provider: string;
  };
  postDrafts: SavedPostDraft[];
};

export type BrandProjectListItem = {
  id: string;
  name: string | null;
  domain: string;
  websiteUrl: string;
  language: string | null;
  brandColors: Json;
  updatedAt: string;
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
  user_id: string | null;
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
  "id,project_id,user_id,brand_extraction_id,channel,intent,headline,body,cta,hashtags,status,language,tone,length,provider,model,prompt_version,settings,created_at,updated_at";
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

function hasColorTokens(colors: BrandProfile["colors"] | undefined) {
  return Object.values(colors ?? {}).some((value) => typeof value === "string" && value.trim().length > 0);
}

const BRAND_ASSET_BUCKET = "brand-assets";

const PLATFORM_IMAGE_SIZES = [
  { platform: "Instagram", label: "Square post", size: "1080x1080", status: "planned" },
  { platform: "Instagram", label: "Story/Reel", size: "1080x1920", status: "planned" },
  { platform: "TikTok", label: "Vertical video cover", size: "1080x1920", status: "planned" },
  { platform: "LinkedIn", label: "Carousel slide", size: "1080x1350", status: "planned" },
  { platform: "X", label: "Feed image", size: "1600x900", status: "planned" }
];

type BrandAssetRef = {
  kind: "logo" | "favicon" | "ogImage";
  sourceUrl: string;
  storagePath?: string;
  publicUrl?: string;
  copiedAt?: string;
  status: "referenced" | "copied" | "copy_failed";
};

function readImageUrl(extraction: BrandExtraction, kind: BrandAssetRef["kind"]) {
  if (kind === "logo") return extraction.branding.logo ?? extraction.branding.images?.logo;
  if (kind === "favicon") return extraction.branding.images?.favicon;
  return extraction.branding.images?.ogImage;
}

function buildBrandAssets(extraction: BrandExtraction) {
  const assets: Partial<Record<BrandAssetRef["kind"], BrandAssetRef>> = {};

  (["logo", "favicon", "ogImage"] as const).forEach((kind) => {
    const sourceUrl = readImageUrl(extraction, kind);

    if (sourceUrl) {
      assets[kind] = {
        kind,
        sourceUrl,
        status: "referenced"
      };
    }
  });

  return {
    ...assets,
    platformSizes: PLATFORM_IMAGE_SIZES
  };
}

function confidenceLevel(score: number) {
  if (score >= 0.75) return "high";
  if (score >= 0.45) return "medium";
  return "low";
}

function buildBrandConfidence(extraction: BrandExtraction) {
  const colorCount = Object.values(extraction.branding.colors ?? {}).filter(
    (value) => typeof value === "string" && value.trim()
  ).length;
  const fontCount = extraction.branding.fonts?.filter((font) => font.family?.trim()).length ?? 0;
  const hasLogo = Boolean(extraction.branding.logo ?? extraction.branding.images?.logo ?? extraction.branding.images?.favicon);
  const hasOgImage = Boolean(extraction.branding.images?.ogImage);
  const values = {
    identity: extraction.title ? 0.85 : 0.25,
    description: extraction.description ? 0.8 : 0.25,
    language: extraction.language ? 0.75 : 0.35,
    colors: Math.min(0.25 + colorCount * 0.16, 0.95),
    fonts: Math.min(0.3 + fontCount * 0.2, 0.9),
    logo: hasLogo ? 0.8 : 0.2,
    ogImage: hasOgImage ? 0.75 : 0.2
  };
  const overall = Object.values(values).reduce((total, score) => total + score, 0) / Object.values(values).length;

  return {
    overall: { score: Number(overall.toFixed(2)), level: confidenceLevel(overall) },
    fields: Object.fromEntries(
      Object.entries(values).map(([field, score]) => [field, { score: Number(score.toFixed(2)), level: confidenceLevel(score) }])
    )
  };
}

function assetExtension(contentType: string | null, url: string) {
  if (contentType?.includes("svg")) return "svg";
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";

  const pathname = new URL(url).pathname;
  const extension = pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();

  return extension && ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(extension) ? extension : "jpg";
}

async function copyBrandAssetsToStorage(projectId: string, assets: ReturnType<typeof buildBrandAssets>) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return assets;
  }

  const nextAssets = { ...assets };

  for (const kind of ["logo", "favicon", "ogImage"] as const) {
    const asset = nextAssets[kind];

    if (!asset?.sourceUrl) {
      continue;
    }

    try {
      const response = await fetch(asset.sourceUrl, { signal: AbortSignal.timeout(8000) });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") ?? "image/jpeg";

      if (!contentType.startsWith("image/")) {
        throw new Error(`Unexpected content type ${contentType}`);
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      const extension = assetExtension(contentType, asset.sourceUrl);
      const storagePath = `${projectId}/${kind}.${extension}`;
      const { error } = await supabase.storage
        .from(BRAND_ASSET_BUCKET)
        .upload(storagePath, bytes, { contentType, upsert: true });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage.from(BRAND_ASSET_BUCKET).getPublicUrl(storagePath);

      nextAssets[kind] = {
        ...asset,
        storagePath,
        publicUrl: data.publicUrl,
        copiedAt: new Date().toISOString(),
        status: "copied"
      };
    } catch (error) {
      console.error(error);
      nextAssets[kind] = {
        ...asset,
        status: "copy_failed"
      };
    }
  }

  return nextAssets;
}

export async function saveBrandExtraction(
  extraction: BrandExtraction,
  userId?: string | null
): Promise<StoredBrandExtraction | null> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const domain = getDomain(extraction.sourceUrl);
  const { data: existingProject, error: existingProjectError } = await supabase
    .from("projects")
    .select("id,user_id,brand_colors")
    .eq("domain", domain)
    .maybeSingle();

  if (existingProjectError) {
    throw new Error(`Could not check project: ${existingProjectError.message}`);
  }

  if (existingProject?.user_id && existingProject.user_id !== userId) {
    throw new Error("This brand is already owned by another account.");
  }

  const brandAssets = buildBrandAssets(extraction);
  const brandConfidence = buildBrandConfidence(extraction);
  const projectPayload = {
    website_url: extraction.sourceUrl,
    domain,
    name: extraction.title ?? domain,
    language: extraction.language ?? null,
    brand_name: extraction.title ?? domain,
    brand_description: extraction.description ?? null,
    brand_colors: (
      hasColorTokens(extraction.branding.colors) ? extraction.branding.colors : existingProject?.brand_colors ?? {}
    ) as Json,
    brand_fonts: (extraction.branding.fonts ?? []) as Json,
    brand_logo: extraction.branding.logo ?? extraction.branding.images?.logo ?? extraction.branding.images?.favicon ?? null,
    brand_assets: brandAssets as unknown as Json,
    brand_confidence: brandConfidence as unknown as Json,
    updated_at: new Date().toISOString(),
    user_id: userId ?? existingProject?.user_id ?? null
  };
  const { data: project, error: projectError } = existingProject
    ? await supabase
        .from("projects")
        .update(projectPayload)
        .eq("id", existingProject.id)
        .select("id")
        .single()
    : await supabase
        .from("projects")
        .insert({
          ...projectPayload,
          website_url: extraction.sourceUrl,
          domain
        })
        .select("id")
        .single();

  if (projectError) {
    throw new Error(`Could not save project: ${projectError.message}`);
  }

  const copiedBrandAssets = await copyBrandAssetsToStorage(project.id, brandAssets);
  const { error: assetUpdateError } = await supabase
    .from("projects")
    .update({ brand_assets: copiedBrandAssets as unknown as Json })
    .eq("id", project.id);

  if (assetUpdateError) {
    console.error(assetUpdateError);
  }

  const { data: savedExtraction, error: extractionError } = await supabase
    .from("brand_extractions")
    .insert({
      project_id: project.id,
      user_id: userId ?? null,
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

export async function getBrandProjectWorkspace(
  projectId: string,
  userId?: string | null
): Promise<BrandProjectWorkspace | null> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id,user_id,name,website_url,domain,language,tone,audience,brand_name,brand_description,brand_colors,brand_fonts,brand_logo,brand_assets,brand_confidence,brand_fields_status,created_at,updated_at"
    )
    .eq("id", projectId)
    .single();

  if (projectError) {
    if (projectError.code === "PGRST116") {
      return null;
    }

    throw new Error(`Could not load project: ${projectError.message}`);
  }

  if (project.user_id && project.user_id !== userId) {
    return null;
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

  const editedBranding = {
    ...(extraction.branding as BrandProfile),
    colors: (project.brand_colors as BrandProfile["colors"]) ?? (extraction.branding as BrandProfile).colors,
    fonts: (project.brand_fonts as BrandProfile["fonts"]) ?? (extraction.branding as BrandProfile).fonts,
    logo: project.brand_logo ?? (extraction.branding as BrandProfile).logo
  };

  return {
    project: {
      id: project.id,
      userId: project.user_id,
      name: project.name,
      websiteUrl: project.website_url,
      domain: project.domain,
      language: project.language,
      tone: project.tone,
      audience: project.audience,
      brandName: project.brand_name,
      brandDescription: project.brand_description,
      brandColors: project.brand_colors,
      brandFonts: project.brand_fonts,
      brandLogo: project.brand_logo,
      brandAssets: project.brand_assets,
      brandConfidence: project.brand_confidence,
      brandFieldsStatus: project.brand_fields_status,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    },
    latestExtraction: {
      id: extraction.id,
      provider: extraction.provider,
      sourceUrl: extraction.source_url,
      title: project.brand_name ?? extraction.title ?? undefined,
      description: project.brand_description ?? extraction.description ?? undefined,
      language: project.language ?? extraction.language ?? undefined,
      branding: editedBranding,
      rawMetadata: (extraction.raw_metadata ?? undefined) as Record<string, unknown> | undefined,
      capturedAt: extraction.captured_at
    },
    postDrafts: await getPostDrafts(project.id)
  };
}

export async function getBrandProjects(userId?: string | null): Promise<BrandProjectListItem[]> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  let query = supabase
    .from("projects")
    .select("id,name,domain,website_url,language,brand_colors,updated_at")
    .order("updated_at", { ascending: false })
    .limit(24);

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.is("user_id", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load projects: ${error.message}`);
  }

  return data.map((project) => ({
    id: project.id,
    name: project.name,
    domain: project.domain,
    websiteUrl: project.website_url,
    language: project.language,
    brandColors: project.brand_colors,
    updatedAt: project.updated_at
  }));
}

export async function updateBrandProject({
  projectId,
  userId,
  updates
}: {
  projectId: string;
  userId?: string | null;
  updates: {
    brandName?: string | null;
    brandDescription?: string | null;
    language?: string | null;
    tone?: string | null;
    audience?: string | null;
    brandLogo?: string | null;
    brandColors?: Json;
    brandFonts?: Json;
    brandFieldsStatus?: Json;
  };
}) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const workspace = await getBrandProjectWorkspace(projectId, userId);

  if (!workspace) {
    throw new Error("Project not found.");
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      name: updates.brandName,
      brand_name: updates.brandName,
      brand_description: updates.brandDescription,
      language: updates.language,
      tone: updates.tone,
      audience: updates.audience,
      brand_logo: updates.brandLogo,
      brand_colors: updates.brandColors,
      brand_fonts: updates.brandFonts,
      brand_fields_status: updates.brandFieldsStatus
    })
    .eq("id", projectId)
    .select(
      "id,user_id,name,website_url,domain,language,tone,audience,brand_name,brand_description,brand_colors,brand_fonts,brand_logo,brand_fields_status,created_at,updated_at"
    )
    .single();

  if (error) {
    throw new Error(`Could not update brand profile: ${error.message}`);
  }

  return data;
}

export async function deleteBrandProject({ projectId, userId }: { projectId: string; userId?: string | null }) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const workspace = await getBrandProjectWorkspace(projectId, userId);

  if (!workspace) {
    throw new Error("Project not found.");
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    throw new Error(`Could not delete project: ${error.message}`);
  }
}

export async function claimAnonymousProjects(userId: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Missing Supabase server credentials.");
  }

  const { data: projects, error: loadError } = await supabase.from("projects").select("id").is("user_id", null);

  if (loadError) {
    throw new Error(`Could not load anonymous projects: ${loadError.message}`);
  }

  const projectIds = projects.map((project) => project.id);

  if (!projectIds.length) {
    return { projects: 0 };
  }

  const tables = ["projects", "brand_extractions", "post_drafts", "brand_audiences", "marketing_assets", "campaigns"] as const;

  for (const table of tables) {
    const query =
      table === "projects"
        ? supabase.from(table).update({ user_id: userId }).in("id", projectIds).is("user_id", null)
        : supabase.from(table).update({ user_id: userId }).in("project_id", projectIds).is("user_id", null);
    const { error } = await query;

    if (error) {
      throw new Error(`Could not claim ${table}: ${error.message}`);
    }
  }

  return { projects: projectIds.length };
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
  drafts,
  userId
}: {
  projectId: string;
  brandExtractionId: string;
  drafts: GeneratedPostDraft[];
  userId?: string | null;
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
        user_id: userId ?? null,
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
      user_id: draft.user_id,
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
  audiences,
  userId
}: {
  projectId: string;
  audiences: Array<Omit<SavedBrandAudience, "id" | "projectId" | "createdAt" | "updatedAt">>;
  userId?: string | null;
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
        user_id: userId ?? null,
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
  userId,
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
  userId?: string | null;
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
      user_id: userId ?? null,
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
