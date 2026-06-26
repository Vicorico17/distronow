"use client";

import { useMemo, useState } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { PostDraftPanel } from "@/components/post-draft-panel";
import {
  CONTENT_ASSET_TYPES,
  ContentAssetType,
  IMAGE_ASSET_TYPES,
  ImageAssetType,
  PLANNED_CONTENT_ASSET_TYPES
} from "@/lib/asset-types";
import type { Json } from "@/lib/supabase/types";
import type { SavedBrandAudience, SavedMarketingAsset, SavedPostDraft } from "@/lib/brand-store";

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
  initialAudiences: SavedBrandAudience[];
  initialAssets: SavedMarketingAsset[];
  initialDrafts: SavedPostDraft[];
  initialLanguage?: string;
};

type AssetFlowStep = "audience" | "content" | "assets";

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

function isObjectJson(value: Json): value is Record<string, Json> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: Json | undefined) {
  return typeof value === "string" ? value : "";
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

export function AssetSelectionPanel({
  projectId,
  initialAudiences,
  initialAssets,
  initialDrafts,
  initialLanguage = "Auto"
}: AssetSelectionPanelProps) {
  const [audiences, setAudiences] = useState(initialAudiences);
  const [assets, setAssets] = useState(initialAssets);
  const [selectedAudienceId, setSelectedAudienceId] = useState(initialAudiences[0]?.id ?? "");
  const [editingAudienceId, setEditingAudienceId] = useState<string | "new" | null>(null);
  const [audienceDraft, setAudienceDraft] = useState<AudienceDraft>(draftFromAudience());
  const [currentStep, setCurrentStep] = useState<AssetFlowStep>("audience");
  const [selectedContentType, setSelectedContentType] = useState<ContentAssetType>("Social content");
  const [selectedGoal, setSelectedGoal] = useState<GoalOption>("Launch or announce");
  const [customGoal, setCustomGoal] = useState("");
  const [contentSetupComplete, setContentSetupComplete] = useState(false);
  const [generatedTextAsset, setGeneratedTextAsset] = useState<SavedMarketingAsset | null>(null);
  const [sourceDraft, setSourceDraft] = useState<SavedPostDraft | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<ImageAssetType>("Social post graphic");
  const [imageNotes, setImageNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const selectedAudience = useMemo(
    () => audiences.find((audience) => audience.id === selectedAudienceId) ?? audiences[0] ?? null,
    [audiences, selectedAudienceId]
  );
  const generatedText = getTextContent(generatedTextAsset);
  const generatedImageAssets = assets.filter((asset) => Boolean(asset.imageUrl));
  const plannedContent = PLANNED_CONTENT_ASSET_TYPES.includes(selectedContentType);
  const hasGeneratedContent = Boolean(generatedTextAsset || sourceDraft);
  const goalText = selectedGoal === "Custom" ? customGoal.trim() : selectedGoal;
  const recommendAudienceLabel = audiences.length ? "Recommend other audiences" : "Recommend audiences";

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

    setAudiences((current) => [...payload.audiences!, ...current]);
    setSelectedAudienceId(payload.audiences[0]?.id ?? "");
    setGeneratedTextAsset(null);
    setSourceDraft(null);
    setContentSetupComplete(false);
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
    setGeneratedTextAsset(null);
    setSourceDraft(null);
    setContentSetupComplete(false);
    setCurrentStep("audience");
    setEditingAudienceId(null);
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

  return (
    <section className="asset-selection">
      <div className="selection-header">
        <div>
          <p className="eyebrow">Generate assets</p>
          <h2>Build assets step by step.</h2>
        </div>
      </div>

      {message ? <div className="error-box">{message}</div> : null}

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

        {currentStep === "audience" ? (
          <>
            <div className="audience-list">
              {audiences.length ? (
                audiences.map((audience) => (
                  <button
                    className={audience.id === selectedAudience?.id ? "audience-card selected" : "audience-card"}
                    key={audience.id}
                    onClick={() => {
                  setSelectedAudienceId(audience.id);
                  setGeneratedTextAsset(null);
                  setSourceDraft(null);
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
              <button disabled={!selectedAudience} onClick={() => setCurrentStep("content")} type="button">
                Continue
              </button>
            </div>
          </>
        ) : selectedAudience ? (
          <div className="selected-audience-summary">
            <div>
              <span>{selectedAudience.isPrimary ? "Best customer" : "Selected audience"}</span>
              <strong>{selectedAudience.name}</strong>
              <small>{selectedAudience.summary}</small>
            </div>
            <button
              onClick={() => {
                setCurrentStep("audience");
                setGeneratedTextAsset(null);
                setSourceDraft(null);
              }}
              type="button"
            >
              Change
            </button>
          </div>
        ) : null}
      </section>

      {editingAudienceId ? (
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
      ) : null}

      {currentStep !== "audience" && selectedAudience ? (
        <section className="selection-panel asset-step-panel">
          <div className="panel-title">
            <h3>2. Content</h3>
            <span>{selectedAudience.name}</span>
          </div>
          <div className="asset-step-grid">
            <label>
              <span>Content type</span>
              <select
                onChange={(event) => {
                  setSelectedContentType(event.target.value as ContentAssetType);
                  setGeneratedTextAsset(null);
                  setSourceDraft(null);
                  setContentSetupComplete(false);
                  setCurrentStep("content");
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
                  setGeneratedTextAsset(null);
                  setSourceDraft(null);
                  setContentSetupComplete(false);
                  setCurrentStep("content");
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
                    setGeneratedTextAsset(null);
                    setSourceDraft(null);
                    setContentSetupComplete(false);
                    setCurrentStep("content");
                  }}
                  placeholder="What should this content achieve?"
                  value={customGoal}
                />
              </label>
            ) : null}
            {!contentSetupComplete ? (
              <button
                disabled={plannedContent || !goalText}
                onClick={() => setContentSetupComplete(true)}
                type="button"
              >
                Continue to generation
              </button>
            ) : selectedContentType !== "Social content" ? (
              <button disabled={busyAction === "text" || plannedContent} onClick={generateTextAsset} type="button">
                {busyAction === "text" ? <LoadingIndicator compact label="Generating" /> : "Generate content"}
              </button>
            ) : null}
          </div>
          {busyAction === "text" ? (
            <div className="loading-panel">
              <LoadingIndicator label="Generating content" />
            </div>
          ) : null}
          {selectedContentType === "Social content" && contentSetupComplete ? (
            <PostDraftPanel
              audienceId={selectedAudience.id}
              embedded
              generationGoal={goalText}
              initialDrafts={initialDrafts}
              initialLanguage={initialLanguage}
              onDraftSelected={(draft) => {
                setSourceDraft(draft);
                setGeneratedTextAsset(null);
                setCurrentStep("assets");
              }}
              projectId={projectId}
            />
          ) : null}
          {generatedTextAsset ? (
            <article className="text-output-card">
              <span>{generatedTextAsset.assetType}</span>
              <strong>{generatedTextAsset.title}</strong>
              {generatedText.body ? <p>{generatedText.body}</p> : null}
              {generatedText.cta ? <small>{generatedText.cta}</small> : null}
            </article>
          ) : null}
        </section>
      ) : null}

      {currentStep === "assets" && hasGeneratedContent ? (
        <section className="selection-panel image-generator-panel">
          <div className="panel-title">
            <h3>3. Assets</h3>
            <span>GPT Image 2</span>
          </div>
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
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
