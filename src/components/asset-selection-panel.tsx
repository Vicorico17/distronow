"use client";

import { useMemo, useState } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";
import {
  CONTENT_ASSET_TYPES,
  ContentAssetType,
  IMAGE_ASSET_TYPES,
  ImageAssetType,
  PLANNED_CONTENT_ASSET_TYPES
} from "@/lib/asset-types";
import type { Json } from "@/lib/supabase/types";
import type { SavedBrandAudience, SavedCampaign, SavedMarketingAsset, SavedPostDraft } from "@/lib/brand-store";
import {
  CHANNELS,
  ContentChannel,
  ContentIntent,
  ContentLanguage,
  ContentLength,
  ContentTone,
  GENERATION_INTENTS,
  LANGUAGES,
  LENGTHS,
  TONES
} from "@/lib/post-generator";

type AudienceDraft = {
  name: string;
  summary: string;
  painPoints: string;
  goals: string;
  buyingTriggers: string;
  objections: string;
  channels: string;
  contentAngles: string;
  isPrimary: boolean;
};

type AssetSelectionPanelProps = {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  projectDomain: string;
  projectLanguage?: string | null;
  projectLogo?: string | null;
  projectColors?: Json;
  draftCount: number;
  initialAudiences: SavedBrandAudience[];
  initialAssets: SavedMarketingAsset[];
  initialCampaigns: SavedCampaign[];
  initialDrafts: SavedPostDraft[];
  initialLanguage?: string;
};

type AssetFlowStep = "audience" | "content" | "hook" | "script" | "assets" | "campaign";

const GOAL_OPTIONS = [
  "Launch or announce",
  "Explain a product benefit",
  "Drive leads or signups",
  "Build trust with proof",
  "Educate the audience",
  "Promote an offer",
  "Grow community engagement",
  "Custom"
] as const;

type GoalOption = (typeof GOAL_OPTIONS)[number];

type CreationTool = {
  name: string;
  description: string;
  status: string;
  active?: boolean;
};

type CampaignCalendarItem = {
  day: number;
  channel: string;
  assetType: string;
  topic: string;
  hook: string;
  cta: string;
};

type LibraryFilter = "All" | "Posts" | "Assets" | "Images" | "Videos" | "Campaigns" | "Approved" | "Published";

type DetailSelection =
  | { type: "draft"; item: SavedPostDraft }
  | { type: "asset"; item: SavedMarketingAsset }
  | { type: "campaign"; item: SavedCampaign }
  | null;

const LIBRARY_FILTERS: LibraryFilter[] = ["All", "Posts", "Assets", "Images", "Videos", "Campaigns", "Approved", "Published"];

function joinList(values: string[]) {
  return values.join(", ");
}

function splitList(value: string) {
  return value
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function draftFromAudience(audience?: SavedBrandAudience): AudienceDraft {
  return {
    name: audience?.name ?? "",
    summary: audience?.summary ?? "",
    painPoints: joinList(audience?.painPoints ?? []),
    goals: joinList(audience?.goals ?? []),
    buyingTriggers: joinList(audience?.buyingTriggers ?? []),
    objections: joinList(audience?.objections ?? []),
    channels: joinList(audience?.channels ?? ["Instagram", "TikTok"]),
    contentAngles: joinList(audience?.contentAngles ?? []),
    isPrimary: audience?.isPrimary ?? false
  };
}

function audienceKey(audience: Pick<SavedBrandAudience, "name">) {
  return audience.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function uniqueAudiences(audiences: SavedBrandAudience[]) {
  const seen = new Set<string>();

  return audiences.filter((audience) => {
    const key = audienceKey(audience);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isObjectJson(value: Json): value is Record<string, Json> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

function colorEntriesFromJson(value: Json | undefined) {
  const colors = value ?? null;

  if (!isObjectJson(colors)) {
    return [];
  }

  return Object.entries(colors)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0)
    .slice(0, 6);
}

function getTextContent(asset: SavedMarketingAsset | null) {
  if (!asset || !isObjectJson(asset.content)) {
    return {
      body: "",
      cta: "",
      caption: "",
      visualDirection: asset?.prompt ?? ""
    };
  }

  return {
    body: readString(asset.content.body),
    cta: readString(asset.content.cta),
    caption: readString(asset.content.caption),
    visualDirection: readString(asset.content.visualDirection) || asset.prompt || ""
  };
}

function getVideoUrl(asset: SavedMarketingAsset | null) {
  if (!asset || !isObjectJson(asset.content)) {
    return "";
  }

  return readString(asset.content.videoUrl);
}

function imageNotesFromText(asset: SavedMarketingAsset | null, notes: string) {
  const content = getTextContent(asset);

  return [
    asset ? `Generated content type: ${asset.assetType}` : null,
    asset?.title ? `Title: ${asset.title}` : null,
    content.body ? `Text:\n${content.body}` : null,
    content.cta ? `CTA: ${content.cta}` : null,
    content.visualDirection ? `Visual direction: ${content.visualDirection}` : null,
    notes ? `Extra image direction: ${notes}` : null
  ]
    .filter(Boolean)
    .join("\n\n");
}

function imageNotesFromDraft(draft: SavedPostDraft | null, notes: string) {
  return [
    draft ? `Generated content type: Social content` : null,
    draft?.channel ? `Channel: ${draft.channel}` : null,
    draft?.intent ? `Intent: ${draft.intent}` : null,
    draft?.headline ? `Headline: ${draft.headline}` : null,
    draft?.body ? `Body:\n${draft.body}` : null,
    draft?.cta ? `CTA: ${draft.cta}` : null,
    draft?.hashtags.length ? `Hashtags: ${draft.hashtags.join(" ")}` : null,
    notes ? `Extra image direction: ${notes}` : null
  ]
    .filter(Boolean)
    .join("\n\n");
}

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "export";
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function draftMarkdown(draft: SavedPostDraft) {
  return [
    `# ${draft.headline}`,
    "",
    `Channel: ${draft.channel}`,
    `Intent: ${draft.intent}`,
    draft.language ? `Language: ${draft.language}` : null,
    "",
    draft.body,
    "",
    draft.cta ? `CTA: ${draft.cta}` : null,
    draft.hashtags.length ? `Hashtags: ${draft.hashtags.join(" ")}` : null
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function assetMarkdown(asset: SavedMarketingAsset) {
  const content = getTextContent(asset);

  return [
    `# ${asset.title}`,
    "",
    `Asset type: ${asset.assetType}`,
    `Provider: ${asset.provider}`,
    asset.imageUrl ? `Image: ${asset.imageUrl}` : null,
    getVideoUrl(asset) ? `Video: ${getVideoUrl(asset)}` : null,
    "",
    content.body || asset.brief || "",
    "",
    content.cta ? `CTA: ${content.cta}` : null,
    content.caption ? `Caption: ${content.caption}` : null,
    content.visualDirection ? `Visual direction:\n${content.visualDirection}` : null,
    asset.prompt ? `Prompt:\n${asset.prompt}` : null
  ]
    .filter((line): line is string => line !== null && line.length > 0)
    .join("\n");
}

function campaignCalendar(campaign: SavedCampaign) {
  if (!isObjectJson(campaign.settings) || !Array.isArray(campaign.settings.calendar)) {
    return [];
  }

  return campaign.settings.calendar
    .map((entry, index): CampaignCalendarItem | null => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const row = entry as Record<string, Json | undefined>;

      return {
        day: typeof row.day === "number" ? row.day : index + 1,
        channel: readString(row.channel),
        assetType: readString(row.assetType),
        topic: readString(row.topic),
        hook: readString(row.hook),
        cta: readString(row.cta)
      };
    })
    .filter((entry): entry is CampaignCalendarItem => Boolean(entry));
}

function campaignMarkdown(campaign: SavedCampaign) {
  const rows = campaignCalendar(campaign);

  return [
    `# ${campaign.name}`,
    "",
    campaign.objective ? `Objective: ${campaign.objective}` : null,
    `Duration: ${campaign.durationDays} days`,
    `Channels: ${campaign.channels.join(", ")}`,
    "",
    ...rows.flatMap((item) => [
      `## Day ${item.day}: ${item.channel}`,
      `Type: ${item.assetType}`,
      `Topic: ${item.topic}`,
      `Hook: ${item.hook}`,
      `CTA: ${item.cta}`,
      ""
    ])
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function publishingPackageMarkdown({
  drafts,
  assets,
  campaigns
}: {
  drafts: SavedPostDraft[];
  assets: SavedMarketingAsset[];
  campaigns: SavedCampaign[];
}) {
  return [
    "# Publishing Package",
    "",
    "## Posts",
    drafts.length ? drafts.map(draftMarkdown).join("\n\n---\n\n") : "No posts selected.",
    "",
    "## Assets",
    assets.length ? assets.map(assetMarkdown).join("\n\n---\n\n") : "No assets selected.",
    "",
    "## Campaigns",
    campaigns.length ? campaigns.map(campaignMarkdown).join("\n\n---\n\n") : "No campaigns selected."
  ].join("\n");
}

function csvCell(value: string | null | undefined) {
  return `"${(value ?? "").replace(/"/g, '""')}"`;
}

function publishingPackageCsv({
  drafts,
  assets,
  campaigns
}: {
  drafts: SavedPostDraft[];
  assets: SavedMarketingAsset[];
  campaigns: SavedCampaign[];
}) {
  const rows = [
    ["type", "title", "channel", "status", "provider", "body", "cta", "url"],
    ...drafts.map((draft) => [
      "post",
      draft.headline,
      draft.channel,
      draft.status,
      draft.provider,
      draft.body,
      draft.cta,
      ""
    ]),
    ...assets.map((asset) => {
      const content = getTextContent(asset);

      return [
        asset.imageUrl ? "image" : getVideoUrl(asset) ? "video" : "asset",
        asset.title,
        "",
        asset.status,
        asset.provider,
        content.body || asset.brief || "",
        content.cta,
        asset.imageUrl ?? getVideoUrl(asset) ?? ""
      ];
    }),
    ...campaigns.flatMap((campaign) =>
      campaignCalendar(campaign).map((item) => [
        "campaign",
        `${campaign.name} - Day ${item.day}`,
        item.channel,
        "",
        "",
        `${item.assetType}: ${item.topic}. ${item.hook}`,
        item.cta,
        ""
      ])
    )
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function isPublishableStatus(status: string) {
  return status === "approved" || status === "published";
}

export function AssetSelectionPanel({
  projectId,
  projectTitle,
  projectDescription,
  projectDomain,
  projectLanguage,
  projectLogo,
  projectColors,
  draftCount,
  initialAudiences,
  initialAssets,
  initialCampaigns,
  initialDrafts,
  initialLanguage = "Auto"
}: AssetSelectionPanelProps) {
  const [audiences, setAudiences] = useState(initialAudiences);
  const [assets, setAssets] = useState(initialAssets);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [selectedAudienceId, setSelectedAudienceId] = useState(initialAudiences[0]?.id ?? "");
  const [editingAudienceId, setEditingAudienceId] = useState<string | "new" | null>(null);
  const [audienceDraft, setAudienceDraft] = useState<AudienceDraft>(draftFromAudience());
  const [currentStep, setCurrentStep] = useState<AssetFlowStep>("audience");
  const [selectedContentType, setSelectedContentType] = useState<ContentAssetType>("Social content");
  const [selectedGoal, setSelectedGoal] = useState<GoalOption>("Launch or announce");
  const [customGoal, setCustomGoal] = useState("");
  const [generatedTextAsset, setGeneratedTextAsset] = useState<SavedMarketingAsset | null>(null);
  const [sourceDraft, setSourceDraft] = useState<SavedPostDraft | null>(null);
  const [channel, setChannel] = useState<ContentChannel>("LinkedIn");
  const [intent, setIntent] = useState<ContentIntent>("Launch announcement");
  const [language, setLanguage] = useState<ContentLanguage>(
    LANGUAGES.includes(initialLanguage as ContentLanguage) ? (initialLanguage as ContentLanguage) : "Auto"
  );
  const [tone, setTone] = useState<ContentTone>("Auto");
  const [length, setLength] = useState<ContentLength>("Medium");
  const [hooks, setHooks] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState("");
  const [drafts, setDrafts] = useState<SavedPostDraft[]>([]);
  const [savedDrafts, setSavedDrafts] = useState(initialDrafts);
  const [selectedImageType, setSelectedImageType] = useState<ImageAssetType>("Social post graphic");
  const [imageNotes, setImageNotes] = useState("");
  const [videoNotes, setVideoNotes] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("Build a 7-day content plan from this brand profile.");
  const [campaignDuration, setCampaignDuration] = useState<7 | 30>(7);
  const [campaignChannels, setCampaignChannels] = useState<ContentChannel[]>(["LinkedIn", "Instagram", "TikTok script"]);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("All");
  const [detailSelection, setDetailSelection] = useState<DetailSelection>(null);
  const [showSavedLibrary, setShowSavedLibrary] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const visibleAudiences = useMemo(() => uniqueAudiences(audiences), [audiences]);
  const selectedAudience = useMemo(
    () => visibleAudiences.find((audience) => audience.id === selectedAudienceId) ?? visibleAudiences[0] ?? null,
    [visibleAudiences, selectedAudienceId]
  );
  const generatedText = getTextContent(generatedTextAsset);
  const generatedImageAssets = assets.filter((asset) => Boolean(asset.imageUrl));
  const generatedVideoAssets = assets.filter((asset) => Boolean(getVideoUrl(asset)));
  const savedFolderAssets = assets.filter((asset) => Boolean(asset.imageUrl || asset.content));
  const filteredDrafts = savedDrafts.filter((draft) => {
    if (libraryFilter === "Posts" || libraryFilter === "All") return true;
    if (libraryFilter === "Approved") return draft.status === "approved";
    if (libraryFilter === "Published") return draft.status === "published";
    return false;
  });
  const filteredAssets = savedFolderAssets.filter((asset) => {
    if (libraryFilter === "Assets" || libraryFilter === "All") return true;
    if (libraryFilter === "Images") return Boolean(asset.imageUrl);
    if (libraryFilter === "Videos") return Boolean(getVideoUrl(asset));
    if (libraryFilter === "Approved") return asset.status === "approved";
    if (libraryFilter === "Published") return asset.status === "published";
    return false;
  });
  const filteredCampaigns = libraryFilter === "Campaigns" || libraryFilter === "All" ? campaigns : [];
  const plannedContent = PLANNED_CONTENT_ASSET_TYPES.includes(selectedContentType);
  const isProductVideo = selectedContentType === "Product video with audio";
  const hasGeneratedContent = Boolean(generatedTextAsset || sourceDraft);
  const goalText = selectedGoal === "Custom" ? customGoal.trim() : selectedGoal;
  const recommendAudienceLabel = visibleAudiences.length ? "Recommend other audiences" : "Recommend audiences";
  const currentDraftCount = savedDrafts.length || draftCount + drafts.length;
  const savedLibraryCount = savedDrafts.length + savedFolderAssets.length + campaigns.length;
  const brandColorEntries = colorEntriesFromJson(projectColors);
  const hookGenerationInputs: Array<[string, string]> = [
    ["Brand", projectTitle],
    ["Audience", selectedAudience?.name ?? "Not selected"],
    ["Goal", goalText],
    ["Channel", channel],
    ["Intent", intent],
    ["Language", language],
    ["Tone", tone],
    ["Length", length]
  ];
  const scriptGenerationInputs: Array<[string, string]> = [
    ...hookGenerationInputs,
    ["Selected hook", selectedHook || "Choose a hook first"]
  ];
  const imageGenerationInputs: Array<[string, string]> = [
    ["Brand", projectTitle],
    ["Audience", selectedAudience?.name ?? "Not selected"],
    ["Asset type", selectedImageType],
    ["Logo", projectLogo ? "Included from brand scrape" : "No logo saved"],
    ["Colors", brandColorEntries.length ? brandColorEntries.map(([name, value]) => `${name}: ${value}`).join(", ") : "No colors saved"],
    ["Source content", sourceDraft?.headline ?? generatedTextAsset?.title ?? "Choose or generate content first"],
    ["Extra direction", imageNotes || "None"]
  ];
  const campaignInputs: Array<[string, string]> = [
    ["Audience", selectedAudience?.name ?? "Not selected"],
    ["Objective", campaignObjective],
    ["Duration", `${campaignDuration} days`],
    ["Channels", campaignChannels.join(", ")]
  ];
  const creationTools: CreationTool[] = [
    {
      name: "DistroNow AI",
      description: "Creates the content brief and copy directly in this workspace.",
      status: "Ready"
    },
    {
      name: "Higgsfield MCP",
      description: "Cinematic image and video creation through the connected Codex tool.",
      status: "Use in Codex"
    },
    {
      name: "Comfy Cloud MCP",
      description: "Workflow-based image, video, audio, and 3D creation through Comfy Cloud.",
      status: "Use in Codex"
    },
    {
      name: "HyperFrames",
      description: "Renders branded, narrated product videos into MP4 files.",
      status: selectedContentType === "Product video with audio" ? "Selected" : "Choose product video",
      active: selectedContentType === "Product video with audio"
    }
  ];

  function campaignName(campaignId: string | null) {
    return campaigns.find((campaign) => campaign.id === campaignId)?.name ?? null;
  }

  function resetGeneratedContent() {
    setGeneratedTextAsset(null);
    setSourceDraft(null);
    setHooks([]);
    setSelectedHook("");
    setDrafts([]);
  }

  async function recommendAudiences() {
    if (busyAction === "audiences") {
      return;
    }

    setBusyAction("audiences");
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/audiences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recommend" })
    });
    const payload = (await response.json()) as {
      audiences?: SavedBrandAudience[];
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok || !payload.audiences) {
      setMessage(payload.error ?? "Could not recommend audiences.");
      return;
    }

    if (!payload.audiences.length) {
      setMessage("No new audience segments found. Edit the existing audiences or add a more specific one manually.");
      return;
    }

    setAudiences((current) => uniqueAudiences([...payload.audiences!, ...current]));
    setSelectedAudienceId(payload.audiences[0]?.id ?? "");
    resetGeneratedContent();
    setCurrentStep("audience");
  }

  function startEditing(audience?: SavedBrandAudience) {
    setEditingAudienceId(audience?.id ?? "new");
    setAudienceDraft(draftFromAudience(audience));
  }

  async function saveAudience() {
    if (!editingAudienceId) {
      return;
    }

    setBusyAction("audience-save");
    setMessage(null);

    const audiencePayload = {
      name: audienceDraft.name,
      summary: audienceDraft.summary,
      painPoints: splitList(audienceDraft.painPoints),
      goals: splitList(audienceDraft.goals),
      buyingTriggers: splitList(audienceDraft.buyingTriggers),
      objections: splitList(audienceDraft.objections),
      channels: splitList(audienceDraft.channels),
      contentAngles: splitList(audienceDraft.contentAngles),
      isPrimary: audienceDraft.isPrimary
    };
    const response =
      editingAudienceId === "new"
        ? await fetch(`/api/projects/${projectId}/audiences`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "create", audience: audiencePayload })
          })
        : await fetch(`/api/projects/${projectId}/audiences/${editingAudienceId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(audiencePayload)
          });
    const payload = (await response.json()) as {
      audience?: SavedBrandAudience;
      audiences?: SavedBrandAudience[];
      error?: string;
    };

    setBusyAction(null);

    const savedAudience = payload.audience ?? payload.audiences?.[0];

    if (!response.ok || !savedAudience) {
      setMessage(payload.error ?? "Could not save audience.");
      return;
    }

    setAudiences((current) =>
      editingAudienceId === "new"
        ? [savedAudience, ...current]
        : current.map((audience) => (audience.id === savedAudience.id ? savedAudience : audience))
    );
    setSelectedAudienceId(savedAudience.id);
    resetGeneratedContent();
    setCurrentStep("audience");
    setEditingAudienceId(null);
  }

  async function deleteSelectedAudience() {
    if (!selectedAudience) {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedAudience.name}? Generated posts and assets stay saved.`);

    if (!confirmed) {
      return;
    }

    setBusyAction("audience-delete");
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/audiences/${selectedAudience.id}`, {
      method: "DELETE"
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok) {
      setMessage(payload.error ?? "Could not delete audience.");
      return;
    }

    const nextAudiences = uniqueAudiences(audiences.filter((audience) => audience.id !== selectedAudience.id));

    setAudiences(nextAudiences);
    setSelectedAudienceId(nextAudiences[0]?.id ?? "");
    resetGeneratedContent();
    setCurrentStep("audience");
  }

  function continueFromContent() {
    if (plannedContent || !goalText) {
      return;
    }

    resetGeneratedContent();

    if (selectedContentType === "Campaign calendar") {
      setCampaignObjective(goalText);
      setCurrentStep("campaign");
      return;
    }

    if (selectedContentType === "Social content") {
      setCurrentStep("hook");
      return;
    }

    setCurrentStep("script");
  }

  async function generateHooks() {
    if (!selectedAudience) {
      return;
    }

    setBusyAction("hooks");
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/post-hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        intent,
        language,
        tone,
        length,
        audienceId: selectedAudience.id,
        goal: goalText
      })
    });
    const payload = (await response.json()) as {
      hooks?: string[];
      hook?: string;
      error?: string;
    };

    setBusyAction(null);

    const nextHooks = payload.hooks?.length ? payload.hooks : payload.hook ? [payload.hook] : [];

    if (!response.ok || !nextHooks.length) {
      setMessage(payload.error ?? "Could not generate hooks.");
      return;
    }

    setHooks(nextHooks);
    setSelectedHook("");
    setDrafts([]);
    setSourceDraft(null);
  }

  async function generateScript(hookOverride?: string) {
    const hook = hookOverride ?? selectedHook;

    if (!selectedAudience || !hook.trim()) {
      return;
    }

    setBusyAction("script");
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/post-drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        intent,
        language,
        tone,
        length,
        audienceId: selectedAudience.id,
        goal: goalText,
        hook
      })
    });
    const payload = (await response.json()) as {
      drafts?: SavedPostDraft[];
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok || !payload.drafts?.length) {
      setMessage(payload.error ?? "Could not generate script.");
      return;
    }

    setDrafts(payload.drafts);
    setSavedDrafts((current) => [...payload.drafts!, ...current]);
    setSourceDraft(null);
  }

  async function generateTextAsset() {
    if (!selectedAudience || plannedContent) {
      return;
    }

    setBusyAction("text");
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/text-assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetType: selectedContentType,
        audienceId: selectedAudience.id,
        notes: goalText
      })
    });
    const payload = (await response.json()) as {
      asset?: SavedMarketingAsset;
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok || !payload.asset) {
      setMessage(payload.error ?? "Could not generate text.");
      return;
    }

    setGeneratedTextAsset(payload.asset);
    setSourceDraft(null);
    setAssets((current) => [payload.asset!, ...current]);
    setCurrentStep("assets");
  }

  async function generateImageAsset() {
    if (!hasGeneratedContent) {
      return;
    }

    setBusyAction("image");
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/image-assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetType: selectedImageType,
        audienceId: selectedAudience?.id ?? null,
        notes: sourceDraft ? imageNotesFromDraft(sourceDraft, imageNotes) : imageNotesFromText(generatedTextAsset, imageNotes)
      })
    });
    const payload = (await response.json()) as {
      asset?: SavedMarketingAsset;
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok || !payload.asset) {
      setMessage(payload.error ?? "Could not generate image asset.");
      return;
    }

    setAssets((current) => [payload.asset!, ...current]);
  }

  async function generateProductVideo() {
    if (!hasGeneratedContent) {
      return;
    }

    const text = sourceDraft
      ? { title: sourceDraft.headline, body: sourceDraft.body, cta: sourceDraft.cta }
      : { title: generatedTextAsset?.title ?? "Product spotlight", body: generatedText.body, cta: generatedText.cta };

    setBusyAction("video");
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/product-videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audienceId: selectedAudience?.id ?? null,
        title: text.title,
        voiceover: text.body,
        cta: text.cta,
        notes: videoNotes
      })
    });
    const payload = (await response.json()) as { asset?: SavedMarketingAsset; error?: string };

    setBusyAction(null);

    if (!response.ok || !payload.asset) {
      setMessage(payload.error ?? "Could not generate product video.");
      return;
    }

    setAssets((current) => [payload.asset!, ...current]);
  }

  function toggleCampaignChannel(option: ContentChannel) {
    setCampaignChannels((current) => {
      if (current.includes(option)) {
        return current.length === 1 ? current : current.filter((item) => item !== option);
      }

      return [...current, option];
    });
  }

  async function generateCampaignPlan() {
    if (!selectedAudience || !campaignObjective.trim()) {
      return;
    }

    setBusyAction("campaign");
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objective: campaignObjective,
        durationDays: campaignDuration,
        channels: campaignChannels,
        audienceId: selectedAudience.id
      })
    });
    const payload = (await response.json()) as {
      campaign?: SavedCampaign;
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok || !payload.campaign) {
      setMessage(payload.error ?? "Could not generate campaign.");
      return;
    }

    setCampaigns((current) => [payload.campaign!, ...current]);
  }

  async function generateCampaignAssets(campaign: SavedCampaign) {
    setBusyAction(`campaign-assets-${campaign.id}`);
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/campaigns/${campaign.id}/assets`, {
      method: "POST"
    });
    const payload = (await response.json().catch(() => ({}))) as {
      drafts?: SavedPostDraft[];
      assets?: SavedMarketingAsset[];
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok || !payload.drafts || !payload.assets) {
      setMessage(payload.error ?? "Could not generate campaign assets.");
      return;
    }

    setSavedDrafts((current) => [...payload.drafts!, ...current]);
    setAssets((current) => [...payload.assets!, ...current]);
  }

  async function updateDraftStatus(draft: SavedPostDraft, status: SavedPostDraft["status"]) {
    setBusyAction(`draft-${draft.id}`);
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/post-drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const payload = (await response.json().catch(() => ({}))) as {
      draft?: SavedPostDraft;
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok || !payload.draft) {
      setMessage(payload.error ?? "Could not update draft status.");
      return;
    }

    setSavedDrafts((current) => current.map((item) => (item.id === draft.id ? payload.draft! : item)));
    setDetailSelection((current) =>
      current?.type === "draft" && current.item.id === draft.id ? { type: "draft", item: payload.draft! } : current
    );
  }

  async function updateAssetStatus(asset: SavedMarketingAsset, status: string) {
    setBusyAction(`asset-${asset.id}`);
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/marketing-assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const payload = (await response.json().catch(() => ({}))) as {
      asset?: SavedMarketingAsset;
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok || !payload.asset) {
      setMessage(payload.error ?? "Could not update asset status.");
      return;
    }

    setAssets((current) => current.map((item) => (item.id === asset.id ? payload.asset! : item)));
    setDetailSelection((current) =>
      current?.type === "asset" && current.item.id === asset.id ? { type: "asset", item: payload.asset! } : current
    );
  }

  async function renameAsset(asset: SavedMarketingAsset) {
    const title = window.prompt("Asset name", asset.title)?.trim();

    if (!title || title === asset.title) {
      return;
    }

    setBusyAction(`asset-${asset.id}`);
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/marketing-assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    const payload = (await response.json().catch(() => ({}))) as {
      asset?: SavedMarketingAsset;
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok || !payload.asset) {
      setMessage(payload.error ?? "Could not rename asset.");
      return;
    }

    setAssets((current) => current.map((item) => (item.id === payload.asset!.id ? payload.asset! : item)));
    if (generatedTextAsset?.id === payload.asset.id) {
      setGeneratedTextAsset(payload.asset);
    }
    setDetailSelection((current) =>
      current?.type === "asset" && current.item.id === payload.asset!.id ? { type: "asset", item: payload.asset! } : current
    );
  }

  async function deleteAsset(asset: SavedMarketingAsset) {
    const confirmed = window.confirm(`Delete ${asset.title}? This removes the saved asset${asset.imageUrl ? " and image file" : ""}.`);

    if (!confirmed) {
      return;
    }

    setBusyAction(`asset-${asset.id}`);
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/marketing-assets/${asset.id}`, {
      method: "DELETE"
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok) {
      setMessage(payload.error ?? "Could not delete asset.");
      return;
    }

    setAssets((current) => current.filter((item) => item.id !== asset.id));
    if (generatedTextAsset?.id === asset.id) {
      setGeneratedTextAsset(null);
    }
    setDetailSelection((current) => (current?.type === "asset" && current.item.id === asset.id ? null : current));
  }

  async function deleteCampaignPlan(campaign: SavedCampaign) {
    const confirmed = window.confirm(`Delete ${campaign.name}?`);

    if (!confirmed) {
      return;
    }

    setBusyAction(`campaign-${campaign.id}`);
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/campaigns/${campaign.id}`, {
      method: "DELETE"
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setBusyAction(null);

    if (!response.ok) {
      setMessage(payload.error ?? "Could not delete campaign.");
      return;
    }

    setCampaigns((current) => current.filter((item) => item.id !== campaign.id));
    setDetailSelection((current) => (current?.type === "campaign" && current.item.id === campaign.id ? null : current));
  }

  function renderAudienceStep() {
    return (
      <section className="selection-panel audience-panel">
        <div className="panel-title">
          <h3>1. Audience</h3>
          <div className="audience-primary-actions">
            <button disabled={busyAction === "audiences"} onClick={recommendAudiences} type="button">
              {busyAction === "audiences" ? <LoadingIndicator compact label="Analyzing" /> : recommendAudienceLabel}
            </button>
            <button onClick={() => startEditing()} type="button">
              Add audiences
            </button>
          </div>
        </div>
        {busyAction === "audiences" ? (
          <div className="loading-panel">
            <LoadingIndicator label="Analyzing the brand and building audiences" />
          </div>
        ) : null}

        <div className="audience-list">
          {visibleAudiences.length ? (
            visibleAudiences.map((audience) => (
              <button
                className={audience.id === selectedAudience?.id ? "audience-card selected" : "audience-card"}
                key={audience.id}
                onClick={() => {
                  setSelectedAudienceId(audience.id);
                  resetGeneratedContent();
                }}
                type="button"
              >
                <span>{audience.isPrimary ? "Best customer" : "Audience"}</span>
                <strong>{audience.name}</strong>
                <small>{audience.summary}</small>
              </button>
            ))
          ) : (
            <div className="empty-copy">Recommend audiences or add one.</div>
          )}
        </div>

        <div className="audience-actions">
          <button disabled={!selectedAudience} onClick={() => selectedAudience && startEditing(selectedAudience)} type="button">
            Edit selected
          </button>
          <button disabled={!selectedAudience || busyAction === "audience-delete"} onClick={deleteSelectedAudience} type="button">
            {busyAction === "audience-delete" ? <LoadingIndicator compact label="Deleting" /> : "Delete selected"}
          </button>
          <button disabled={!selectedAudience} onClick={() => setCurrentStep("content")} type="button">
            Continue
          </button>
        </div>
      </section>
    );
  }

  function renderAudienceEditor() {
    if (!editingAudienceId) {
      return null;
    }

    return (
      <section className="selection-panel audience-editor">
        <div className="panel-title">
          <h3>{editingAudienceId === "new" ? "Add audience" : "Edit audience"}</h3>
          <button disabled={busyAction === "audience-save"} onClick={saveAudience} type="button">
            {busyAction === "audience-save" ? <LoadingIndicator compact label="Saving" /> : "Save audience"}
          </button>
        </div>
        <div className="audience-form">
          <label>
            <span>Name</span>
            <input
              onChange={(event) => setAudienceDraft({ ...audienceDraft, name: event.target.value })}
              value={audienceDraft.name}
            />
          </label>
          <label>
            <span>Summary</span>
            <textarea
              onChange={(event) => setAudienceDraft({ ...audienceDraft, summary: event.target.value })}
              value={audienceDraft.summary}
            />
          </label>
          <label>
            <span>Channels</span>
            <input
              onChange={(event) => setAudienceDraft({ ...audienceDraft, channels: event.target.value })}
              value={audienceDraft.channels}
            />
          </label>
          <label>
            <span>Pain points</span>
            <input
              onChange={(event) => setAudienceDraft({ ...audienceDraft, painPoints: event.target.value })}
              value={audienceDraft.painPoints}
            />
          </label>
          <label>
            <span>Goals</span>
            <input
              onChange={(event) => setAudienceDraft({ ...audienceDraft, goals: event.target.value })}
              value={audienceDraft.goals}
            />
          </label>
          <label>
            <span>Buying triggers</span>
            <input
              onChange={(event) => setAudienceDraft({ ...audienceDraft, buyingTriggers: event.target.value })}
              value={audienceDraft.buyingTriggers}
            />
          </label>
          <label>
            <span>Objections</span>
            <input
              onChange={(event) => setAudienceDraft({ ...audienceDraft, objections: event.target.value })}
              value={audienceDraft.objections}
            />
          </label>
          <label>
            <span>Content angles</span>
            <input
              onChange={(event) => setAudienceDraft({ ...audienceDraft, contentAngles: event.target.value })}
              value={audienceDraft.contentAngles}
            />
          </label>
          <label className="checkbox-row">
            <input
              checked={audienceDraft.isPrimary}
              onChange={(event) => setAudienceDraft({ ...audienceDraft, isPrimary: event.target.checked })}
              type="checkbox"
            />
            <span>Best customer</span>
          </label>
        </div>
      </section>
    );
  }

  function renderContentStep() {
    return (
      <section className="selection-panel asset-step-panel">
        <div className="panel-title">
          <h3>2. Content</h3>
        </div>
        <div className="asset-step-grid">
          <label>
            <span>Content type</span>
            <select
              onChange={(event) => {
                setSelectedContentType(event.target.value as ContentAssetType);
                resetGeneratedContent();
              }}
              value={selectedContentType}
            >
              {CONTENT_ASSET_TYPES.map((type) => (
                <option disabled={PLANNED_CONTENT_ASSET_TYPES.includes(type)} key={type} value={type}>
                  {type}
                  {PLANNED_CONTENT_ASSET_TYPES.includes(type) ? " (planned)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Goal</span>
            <select
              onChange={(event) => {
                setSelectedGoal(event.target.value as GoalOption);
                resetGeneratedContent();
              }}
              value={selectedGoal}
            >
              {GOAL_OPTIONS.map((goal) => (
                <option key={goal}>{goal}</option>
              ))}
            </select>
          </label>
          {selectedGoal === "Custom" ? (
            <label className="asset-notes">
              <span>Custom goal</span>
              <textarea
                onChange={(event) => {
                  setCustomGoal(event.target.value);
                  resetGeneratedContent();
                }}
                placeholder="What should this content achieve?"
                value={customGoal}
              />
            </label>
          ) : null}
          <button disabled={plannedContent || !goalText} onClick={continueFromContent} type="button">
            Continue
          </button>
        </div>
        <div className="creation-tools">
          <div className="creation-tools-heading">
            <strong>Content creation tools</strong>
            <span>Available in this workspace</span>
          </div>
          <div className="creation-tools-grid">
            {creationTools.map((tool) => (
              <article className={tool.active ? "creation-tool-card active" : "creation-tool-card"} key={tool.name}>
                <div>
                  <strong>{tool.name}</strong>
                  <span>{tool.status}</span>
                </div>
                <p>{tool.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderGenerationInputs(title: string, items: Array<[string, string]>) {
    return (
      <div className="generation-inputs">
        <span>{title}</span>
        <dl>
          {items.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  function renderHookStep() {
    return (
      <section className="selection-panel asset-step-panel">
        <div className="panel-title">
          <h3>3. Hook</h3>
        </div>
        <div className="asset-step-grid">
          <label>
            <span>Channel</span>
            <select onChange={(event) => setChannel(event.target.value as ContentChannel)} value={channel}>
              {CHANNELS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Intent</span>
            <select onChange={(event) => setIntent(event.target.value as ContentIntent)} value={intent}>
              {GENERATION_INTENTS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Language</span>
            <select onChange={(event) => setLanguage(event.target.value as ContentLanguage)} value={language}>
              {LANGUAGES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Tone</span>
            <select onChange={(event) => setTone(event.target.value as ContentTone)} value={tone}>
              {TONES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Length</span>
            <select onChange={(event) => setLength(event.target.value as ContentLength)} value={length}>
              {LENGTHS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <button disabled={busyAction === "hooks"} onClick={generateHooks} type="button">
            {busyAction === "hooks" ? <LoadingIndicator compact label="Generating" /> : hooks.length ? "Regenerate hooks" : "Generate hooks"}
          </button>
        </div>
        {renderGenerationInputs("Hook generation inputs", hookGenerationInputs)}
        {busyAction === "hooks" ? (
          <div className="loading-panel">
            <LoadingIndicator label="Generating hook options" />
          </div>
        ) : null}
        {hooks.length ? (
          <div className="hook-choice-grid">
            {hooks.map((hook) => (
              <button
                className={hook === selectedHook ? "hook-choice-card selected" : "hook-choice-card"}
                key={hook}
                onClick={() => {
                  setSelectedHook(hook);
                  setDrafts([]);
                  setSourceDraft(null);
                  setCurrentStep("script");
                  void generateScript(hook);
                }}
                type="button"
              >
                <span>Use hook</span>
                <strong>{hook}</strong>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  function renderScriptStep() {
    if (selectedContentType !== "Social content") {
      return (
        <section className="selection-panel asset-step-panel">
          <div className="panel-title">
            <h3>3. Content</h3>
          </div>
          <div className="asset-step-grid">
            <button disabled={busyAction === "text" || plannedContent} onClick={generateTextAsset} type="button">
              {busyAction === "text" ? <LoadingIndicator compact label="Generating" /> : "Generate content"}
            </button>
          </div>
          {busyAction === "text" ? (
            <div className="loading-panel">
              <LoadingIndicator label="Generating content" />
            </div>
          ) : null}
          {generatedTextAsset ? (
            <article className="text-output-card">
              <span>{generatedTextAsset.assetType}</span>
              <strong>{generatedTextAsset.title}</strong>
              {generatedText.body ? <p>{generatedText.body}</p> : null}
              {generatedText.cta ? <small>{generatedText.cta}</small> : null}
              <button onClick={() => setCurrentStep("assets")} type="button">
                Continue to assets
              </button>
            </article>
          ) : null}
        </section>
      );
    }

    return (
      <section className="selection-panel asset-step-panel">
        <div className="panel-title">
          <h3>4. Script</h3>
        </div>
        <div className="script-actions">
          <button disabled={busyAction === "script" || !selectedHook} onClick={() => generateScript()} type="button">
            {busyAction === "script" ? <LoadingIndicator compact label="Generating" /> : drafts.length ? "Regenerate script" : "Generate script"}
          </button>
          <button onClick={() => setCurrentStep("hook")} type="button">
            Change hook
          </button>
        </div>
        {renderGenerationInputs("Script generation inputs", scriptGenerationInputs)}
        {busyAction === "script" ? (
          <div className="loading-panel">
            <LoadingIndicator label="Writing the full post from the selected hook" />
          </div>
        ) : null}
        {drafts.length ? (
          <div className="draft-grid compact-draft-grid">
            {drafts.map((draft) => (
              <article className={sourceDraft?.id === draft.id ? "draft-card selected" : "draft-card"} key={draft.id}>
                <div className="draft-meta">
                  <span>{draft.channel}</span>
                  <span>{draft.intent}</span>
                </div>
                <h3>{draft.headline}</h3>
                <p>{draft.body}</p>
                <strong>{draft.cta}</strong>
                {draft.hashtags.length ? (
                  <div className="hashtag-row">
                    {draft.hashtags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                ) : null}
                <div className="draft-actions">
                  <button
                    onClick={() => {
                      setSourceDraft(draft);
                      setGeneratedTextAsset(null);
                      setCurrentStep("assets");
                    }}
                    type="button"
                  >
                    Continue to assets
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  function renderAssetStep() {
    return (
      <section className="selection-panel image-generator-panel">
        <div className="panel-title">
          <h3>{selectedContentType === "Social content" ? "5. Assets" : "4. Assets"}</h3>
          <span>{isProductVideo ? "HyperFrames + OpenAI Voice" : "GPT Image 2"}</span>
        </div>
        {isProductVideo ? (
          <div className="image-generator-grid">
            <label className="image-notes">
              <span>Video direction</span>
              <textarea
                onChange={(event) => setVideoNotes(event.target.value)}
                placeholder="Optional product angle or voiceover refinement."
                value={videoNotes}
              />
            </label>
            <button disabled={busyAction === "video"} onClick={generateProductVideo} type="button">
              {busyAction === "video" ? <LoadingIndicator compact label="Rendering" /> : "Create audio product video"}
            </button>
          </div>
        ) : null}
        {isProductVideo && busyAction === "video" ? (
          <div className="loading-panel">
            <LoadingIndicator label="Generating voiceover and rendering the MP4" />
          </div>
        ) : null}
        {isProductVideo && generatedVideoAssets.length ? (
          <div className="asset-output-grid">
            {generatedVideoAssets.map((asset) => {
              const videoUrl = getVideoUrl(asset);
              return (
                <article className="asset-output-card" key={asset.id}>
                  <video controls preload="metadata" src={videoUrl} />
                  <div>
                    <span>{asset.assetType}</span>
                    <strong>{asset.title}</strong>
                    <div className="asset-card-actions">
                      <a href={videoUrl} download rel="noreferrer" target="_blank">Video</a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
        {!isProductVideo ? <>
        <div className="image-generator-grid">
          <label>
            <span>Asset type</span>
            <select
              onChange={(event) => setSelectedImageType(event.target.value as ImageAssetType)}
              value={selectedImageType}
            >
              {IMAGE_ASSET_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="image-notes">
            <span>Image direction</span>
            <textarea
              onChange={(event) => setImageNotes(event.target.value)}
              placeholder="Optional visual detail."
              value={imageNotes}
            />
          </label>
          <button disabled={busyAction === "image"} onClick={generateImageAsset} type="button">
            {busyAction === "image" ? <LoadingIndicator compact label="Generating" /> : "Generate image"}
          </button>
        </div>
        {renderGenerationInputs("Image generation inputs", imageGenerationInputs)}
        {busyAction === "image" ? (
          <div className="loading-panel">
            <LoadingIndicator label="Generating image and saving it" />
          </div>
        ) : null}

        {generatedImageAssets.length ? (
          <div className="asset-output-grid">
            {generatedImageAssets.map((asset) => (
              <article className="asset-output-card" key={asset.id}>
                {asset.imageUrl ? <img alt="" src={asset.imageUrl} /> : null}
                <div>
                  <span>{asset.assetType}</span>
                  <strong>{asset.title}</strong>
                  {asset.prompt ? <p>{asset.prompt}</p> : null}
                  <div className="asset-card-actions">
                    <button onClick={() => downloadText(`${sanitizeFilename(asset.title)}.md`, assetMarkdown(asset))} type="button">
                      Export
                    </button>
                    {asset.imageUrl ? (
                      <a href={asset.imageUrl} download rel="noreferrer" target="_blank">
                        Image
                      </a>
                    ) : null}
                    <button disabled={busyAction === `asset-${asset.id}`} onClick={() => renameAsset(asset)} type="button">
                      Rename
                    </button>
                    <button disabled={busyAction === `asset-${asset.id}`} onClick={() => deleteAsset(asset)} type="button">
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        </> : null}
      </section>
    );
  }

  function renderCampaignPanel() {
    return (
      <section className="selection-panel campaign-panel">
        <div className="panel-title">
          <h3>3. Campaign calendar</h3>
          <span>{campaigns.length} saved</span>
        </div>
        <div className="campaign-form-grid">
          <label className="campaign-objective">
            <span>Objective</span>
            <textarea
              onChange={(event) => setCampaignObjective(event.target.value)}
              value={campaignObjective}
            />
          </label>
          <label>
            <span>Duration</span>
            <select onChange={(event) => setCampaignDuration(Number(event.target.value) as 7 | 30)} value={campaignDuration}>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
            </select>
          </label>
          <div className="campaign-channel-grid">
            <span>Channels</span>
            <div>
              {CHANNELS.map((option) => (
                <label className="checkbox-row" key={option}>
                  <input
                    checked={campaignChannels.includes(option)}
                    onChange={() => toggleCampaignChannel(option)}
                    type="checkbox"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
          <button disabled={!selectedAudience || busyAction === "campaign"} onClick={generateCampaignPlan} type="button">
            {busyAction === "campaign" ? <LoadingIndicator compact label="Generating" /> : "Generate campaign"}
          </button>
        </div>
        {renderGenerationInputs("Campaign inputs", campaignInputs)}
        {campaigns.length ? (
          <div className="campaign-grid">
            {campaigns.slice(0, 3).map((campaign) => {
              const calendar = campaignCalendar(campaign);

              return (
                <article className="campaign-card" key={campaign.id}>
                  <div>
                    <span>{campaign.durationDays} days</span>
                    <strong>{campaign.name}</strong>
                    <small>{campaign.channels.join(", ")}</small>
                  </div>
                  <ol>
                    {calendar.slice(0, 5).map((item) => (
                      <li key={`${campaign.id}-${item.day}`}>
                        <span>Day {item.day}</span>
                        <strong>{item.topic}</strong>
                        <small>{item.channel} · {item.assetType}</small>
                      </li>
                    ))}
                  </ol>
                  <div className="asset-card-actions">
                    <button onClick={() => setDetailSelection({ type: "campaign", item: campaign })} type="button">
                      Open
                    </button>
                    <button onClick={() => downloadText(`${sanitizeFilename(campaign.name)}.md`, campaignMarkdown(campaign))} type="button">
                      Export
                    </button>
                    <button
                      disabled={busyAction === `campaign-assets-${campaign.id}`}
                      onClick={() => generateCampaignAssets(campaign)}
                      type="button"
                    >
                      {busyAction === `campaign-assets-${campaign.id}` ? <LoadingIndicator compact label="Generating" /> : "Generate assets"}
                    </button>
                    <button disabled={busyAction === `campaign-${campaign.id}`} onClick={() => deleteCampaignPlan(campaign)} type="button">
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    );
  }

  function renderDetailPanel() {
    if (!detailSelection) {
      return null;
    }

    if (detailSelection.type === "draft") {
      const draft = detailSelection.item;

      return (
        <section className="selection-panel detail-panel">
          <div className="panel-title">
            <h3>{draft.headline}</h3>
            <button onClick={() => setDetailSelection(null)} type="button">
              Close
            </button>
          </div>
          <div className="detail-meta">
            <span>{draft.channel}</span>
            <span>{draft.intent}</span>
            <span>{draft.status}</span>
            <span>{draft.provider}</span>
            {campaignName(draft.campaignId) ? <span>{campaignName(draft.campaignId)}</span> : null}
          </div>
          <div className="detail-body">
            <p>{draft.body}</p>
            {draft.cta ? <strong>{draft.cta}</strong> : null}
            {draft.hashtags.length ? <small>{draft.hashtags.join(" ")}</small> : null}
          </div>
          <div className="asset-card-actions">
            <button onClick={() => downloadText(`${sanitizeFilename(draft.headline)}.md`, draftMarkdown(draft))} type="button">
              Export
            </button>
            <button disabled={busyAction === `draft-${draft.id}`} onClick={() => updateDraftStatus(draft, "approved")} type="button">
              Approve
            </button>
            <button disabled={busyAction === `draft-${draft.id}`} onClick={() => updateDraftStatus(draft, "published")} type="button">
              Mark published
            </button>
          </div>
        </section>
      );
    }

    if (detailSelection.type === "asset") {
      const asset = detailSelection.item;
      const content = getTextContent(asset);

      return (
        <section className="selection-panel detail-panel">
          <div className="panel-title">
            <h3>{asset.title}</h3>
            <button onClick={() => setDetailSelection(null)} type="button">
              Close
            </button>
          </div>
          <div className="detail-meta">
            <span>{asset.assetType}</span>
            <span>{asset.status}</span>
            <span>{asset.provider}</span>
            {asset.model ? <span>{asset.model}</span> : null}
            {campaignName(asset.campaignId) ? <span>{campaignName(asset.campaignId)}</span> : null}
          </div>
          {asset.imageUrl ? <img alt="" className="detail-image" src={asset.imageUrl} /> : null}
          {getVideoUrl(asset) ? <video className="detail-image" controls preload="metadata" src={getVideoUrl(asset)} /> : null}
          <div className="detail-body">
            {content.body ? <p>{content.body}</p> : null}
            {content.cta ? <strong>{content.cta}</strong> : null}
            {content.caption ? <small>{content.caption}</small> : null}
            {content.visualDirection ? <pre>{content.visualDirection}</pre> : null}
          </div>
          <div className="asset-card-actions">
            <button onClick={() => downloadText(`${sanitizeFilename(asset.title)}.md`, assetMarkdown(asset))} type="button">
              Export
            </button>
            {asset.imageUrl ? (
              <a href={asset.imageUrl} download rel="noreferrer" target="_blank">
                Image
              </a>
            ) : null}
            {getVideoUrl(asset) ? (
              <a href={getVideoUrl(asset)} download rel="noreferrer" target="_blank">
                Video
              </a>
            ) : null}
            <button disabled={busyAction === `asset-${asset.id}`} onClick={() => updateAssetStatus(asset, "approved")} type="button">
              Approve
            </button>
            <button disabled={busyAction === `asset-${asset.id}`} onClick={() => updateAssetStatus(asset, "published")} type="button">
              Mark published
            </button>
            <button disabled={busyAction === `asset-${asset.id}`} onClick={() => renameAsset(asset)} type="button">
              Rename
            </button>
            <button disabled={busyAction === `asset-${asset.id}`} onClick={() => deleteAsset(asset)} type="button">
              Delete
            </button>
          </div>
        </section>
      );
    }

    const campaign = detailSelection.item;
    const calendar = campaignCalendar(campaign);

    return (
      <section className="selection-panel detail-panel">
        <div className="panel-title">
          <h3>{campaign.name}</h3>
          <button onClick={() => setDetailSelection(null)} type="button">
            Close
          </button>
        </div>
        <div className="detail-meta">
          <span>{campaign.durationDays} days</span>
          <span>{campaign.channels.join(", ")}</span>
        </div>
        <div className="campaign-detail-list">
          {calendar.map((item) => (
            <article key={`${campaign.id}-detail-${item.day}`}>
              <span>Day {item.day} · {item.channel}</span>
              <strong>{item.topic}</strong>
              <p>{item.hook}</p>
              <small>{item.assetType} · {item.cta}</small>
            </article>
          ))}
        </div>
        <div className="asset-card-actions">
          <button onClick={() => downloadText(`${sanitizeFilename(campaign.name)}.md`, campaignMarkdown(campaign))} type="button">
            Export
          </button>
          <button
            disabled={busyAction === `campaign-assets-${campaign.id}`}
            onClick={() => generateCampaignAssets(campaign)}
            type="button"
          >
            {busyAction === `campaign-assets-${campaign.id}` ? <LoadingIndicator compact label="Generating" /> : "Generate assets"}
          </button>
          <button disabled={busyAction === `campaign-${campaign.id}`} onClick={() => deleteCampaignPlan(campaign)} type="button">
            Delete
          </button>
        </div>
      </section>
    );
  }

  function renderCurrentStep() {
    if (editingAudienceId) {
      return renderAudienceEditor();
    }

    if (currentStep === "audience") {
      return renderAudienceStep();
    }

    if (currentStep === "content") {
      return renderContentStep();
    }

    if (currentStep === "hook") {
      return renderHookStep();
    }

    if (currentStep === "script") {
      return renderScriptStep();
    }

    if (currentStep === "campaign") {
      return renderCampaignPanel();
    }

    return renderAssetStep();
  }

  return (
    <section className="asset-workspace-layout">
      <aside className="asset-context-sidebar">
        <p className="eyebrow">Content workspace</p>
        <h1>{projectTitle}</h1>
        <p>{projectDescription}</p>
        <div className="asset-context-meta">
          <span>{projectDomain}</span>
          {projectLanguage ? <span>{projectLanguage}</span> : null}
          <span>{currentDraftCount} drafts</span>
        </div>
        <div className="workflow-summary">
          <div className="summary-item">
            <span>Audience</span>
            <strong>{selectedAudience?.name ?? "Not selected"}</strong>
            {selectedAudience && currentStep !== "audience" ? (
              <button
                onClick={() => {
                  setCurrentStep("audience");
                  resetGeneratedContent();
                }}
                type="button"
              >
                Change
              </button>
            ) : null}
          </div>
          {currentStep !== "audience" && currentStep !== "content" ? (
            <div className="summary-item">
              <span>Content</span>
              <strong>{selectedContentType}</strong>
              <small>{goalText}</small>
              <button onClick={() => setCurrentStep("content")} type="button">
                Edit
              </button>
            </div>
          ) : null}
          {selectedHook ? (
            <div className="summary-item">
              <span>Hook</span>
              <small>{selectedHook}</small>
            </div>
          ) : null}
          {sourceDraft ? (
            <div className="summary-item">
              <span>Post</span>
              <strong>{sourceDraft.headline}</strong>
              <small>{sourceDraft.channel}</small>
            </div>
          ) : null}
          <div className="summary-item saved-folder-summary">
            <span>Saved folder</span>
            <strong>{projectId}</strong>
            <small>{savedDrafts.length} posts · {savedFolderAssets.length} assets · {campaigns.length} campaigns</small>
          </div>
        </div>
      </aside>

      <section className="asset-selection">
        <div className="selection-header">
          <div>
            <p className="eyebrow">Generate assets</p>
            <h2>Build assets step by step.</h2>
          </div>
          <button className="saved-library-toggle" onClick={() => setShowSavedLibrary((current) => !current)} type="button">
            {showSavedLibrary ? "Hide saved items" : `Saved items (${savedLibraryCount})`}
          </button>
        </div>

        {message ? <div className="error-box">{message}</div> : null}
        {renderCurrentStep()}
        {renderDetailPanel()}
        {showSavedLibrary ? (
          <section className="selection-panel saved-folder-panel">
          <div className="panel-title">
            <h3>Saved in this project</h3>
            <div className="panel-title-actions">
              <button
                onClick={() =>
                  downloadText(
                    `${sanitizeFilename(projectTitle)}-publishing-package.md`,
                    publishingPackageMarkdown({
                      drafts: filteredDrafts,
                      assets: filteredAssets,
                      campaigns: filteredCampaigns
                    })
                  )
                }
                type="button"
              >
                Export package
              </button>
              <button
                onClick={() =>
                  downloadText(
                    `${sanitizeFilename(projectTitle)}-publishing-package.csv`,
                    publishingPackageCsv({
                      drafts: filteredDrafts,
                      assets: filteredAssets,
                      campaigns: filteredCampaigns
                    })
                  )
                }
                type="button"
              >
                Export CSV
              </button>
              <button onClick={() => setShowSavedLibrary(false)} type="button">
                Close
              </button>
            </div>
          </div>
          <div className="library-filters">
            {LIBRARY_FILTERS.map((filter) => (
              <button
                className={libraryFilter === filter ? "selected" : ""}
                key={filter}
                onClick={() => setLibraryFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>
          {filteredDrafts.length || filteredAssets.length || filteredCampaigns.length ? (
            <div className="saved-folder-grid">
              {filteredDrafts.slice(0, 8).map((draft) => (
                <article className="saved-folder-card" key={draft.id}>
                  <span>Post</span>
                  <strong>{draft.headline}</strong>
                  <small>
                    {draft.channel} · {draft.intent} · {draft.status} · {draft.provider}
                    {campaignName(draft.campaignId) ? ` · ${campaignName(draft.campaignId)}` : ""}
                  </small>
                  <div className="asset-card-actions">
                    <button onClick={() => setDetailSelection({ type: "draft", item: draft })} type="button">
                      Open
                    </button>
                    <button onClick={() => downloadText(`${sanitizeFilename(draft.headline)}.md`, draftMarkdown(draft))} type="button">
                      Export
                    </button>
                    <button
                      disabled={busyAction === `draft-${draft.id}` || isPublishableStatus(draft.status)}
                      onClick={() => updateDraftStatus(draft, "approved")}
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSourceDraft(draft);
                        setGeneratedTextAsset(null);
                        setCurrentStep("assets");
                      }}
                      type="button"
                    >
                      Use
                    </button>
                  </div>
                </article>
              ))}
              {filteredAssets.slice(0, 8).map((asset) => (
                <article className="saved-folder-card" key={asset.id}>
                  {asset.imageUrl ? <img alt="" src={asset.imageUrl} /> : null}
                  {getVideoUrl(asset) ? <video controls preload="metadata" src={getVideoUrl(asset)} /> : null}
                  <span>{asset.imageUrl ? "Image" : getVideoUrl(asset) ? "Video" : "Asset"}</span>
                  <strong>{asset.title}</strong>
                  <small>
                    {asset.assetType} · {asset.status} · {asset.provider}
                    {campaignName(asset.campaignId) ? ` · ${campaignName(asset.campaignId)}` : ""}
                  </small>
                  <div className="asset-card-actions">
                    <button onClick={() => setDetailSelection({ type: "asset", item: asset })} type="button">
                      Open
                    </button>
                    <button onClick={() => downloadText(`${sanitizeFilename(asset.title)}.md`, assetMarkdown(asset))} type="button">
                      Export
                    </button>
                    {asset.imageUrl ? (
                      <a href={asset.imageUrl} download rel="noreferrer" target="_blank">
                        Image
                      </a>
                    ) : null}
                    {getVideoUrl(asset) ? (
                      <a href={getVideoUrl(asset)} download rel="noreferrer" target="_blank">
                        Video
                      </a>
                    ) : null}
                    <button
                      disabled={busyAction === `asset-${asset.id}` || isPublishableStatus(asset.status)}
                      onClick={() => updateAssetStatus(asset, "approved")}
                      type="button"
                    >
                      Approve
                    </button>
                    <button disabled={busyAction === `asset-${asset.id}`} onClick={() => renameAsset(asset)} type="button">
                      Rename
                    </button>
                    <button disabled={busyAction === `asset-${asset.id}`} onClick={() => deleteAsset(asset)} type="button">
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {filteredCampaigns.slice(0, 8).map((campaign) => (
                <article className="saved-folder-card" key={campaign.id}>
                  <span>Campaign</span>
                  <strong>{campaign.name}</strong>
                  <small>{campaign.durationDays} days · {campaign.channels.join(", ")}</small>
                  <div className="asset-card-actions">
                    <button onClick={() => setDetailSelection({ type: "campaign", item: campaign })} type="button">
                      Open
                    </button>
                    <button onClick={() => downloadText(`${sanitizeFilename(campaign.name)}.md`, campaignMarkdown(campaign))} type="button">
                      Export
                    </button>
                    <button
                      disabled={busyAction === `campaign-assets-${campaign.id}`}
                      onClick={() => generateCampaignAssets(campaign)}
                      type="button"
                    >
                      Generate assets
                    </button>
                    <button disabled={busyAction === `campaign-${campaign.id}`} onClick={() => deleteCampaignPlan(campaign)} type="button">
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-copy">Generated posts, assets, and campaign calendars for this project will appear here.</div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  );
}
