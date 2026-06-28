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
import type { SavedBrandAudience, SavedMarketingAsset, SavedPostDraft } from "@/lib/brand-store";
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
  draftCount: number;
  initialAudiences: SavedBrandAudience[];
  initialAssets: SavedMarketingAsset[];
  initialLanguage?: string;
};

type AssetFlowStep = "audience" | "content" | "hook" | "script" | "assets";

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
  projectTitle,
  projectDescription,
  projectDomain,
  projectLanguage,
  draftCount,
  initialAudiences,
  initialAssets,
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
  const currentDraftCount = draftCount + drafts.length;

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

    setAudiences((current) => [...payload.audiences!, ...current]);
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

  function continueFromContent() {
    if (plannedContent || !goalText) {
      return;
    }

    resetGeneratedContent();

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

  async function generateScript() {
    if (!selectedAudience || !selectedHook.trim()) {
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
        hook: selectedHook
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
          {audiences.length ? (
            audiences.map((audience) => (
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
      </section>
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
                Continue to image
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
          <button disabled={busyAction === "script" || !selectedHook} onClick={generateScript} type="button">
            {busyAction === "script" ? <LoadingIndicator compact label="Generating" /> : drafts.length ? "Regenerate script" : "Generate script"}
          </button>
          <button onClick={() => setCurrentStep("hook")} type="button">
            Change hook
          </button>
        </div>
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
                    Continue to image
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
          <h3>{selectedContentType === "Social content" ? "5. Image" : "4. Image"}</h3>
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
          {currentStep !== "audience" ? (
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
        </div>
      </aside>

      <section className="asset-selection">
        <div className="selection-header">
          <div>
            <p className="eyebrow">Generate assets</p>
            <h2>Build assets step by step.</h2>
          </div>
        </div>

        {message ? <div className="error-box">{message}</div> : null}
        {renderCurrentStep()}
      </section>
    </section>
  );
}
