"use client";

import { useMemo, useState } from "react";
import { IMAGE_ASSET_TYPES, ImageAssetType } from "@/lib/asset-types";
import type { SavedBrandAudience, SavedMarketingAsset } from "@/lib/brand-store";

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
};

const workflowCards = [
  {
    title: "Social content",
    status: "Ready",
    body: "Generate Instagram, TikTok, LinkedIn, Facebook, and X content drafts from the selected audience."
  },
  {
    title: "Slideshows and carousels",
    status: "Ready",
    body: "Plan vertical slideshow posts for Instagram/TikTok and infographic-style LinkedIn carousel ideas."
  },
  {
    title: "Image assets",
    status: "Ready",
    body: "Generate social graphics, carousel slides, ad creatives, product-style visuals, and branded templates."
  },
  {
    title: "UGC workflows",
    status: "Planned",
    body: "Creator briefs, hooks, shot lists, and model-specific workflows will be added after we settle the UGC stack."
  },
  {
    title: "Seedance video",
    status: "Planned",
    body: "Text/image-to-video generation will plug in once the Seedance API details are available."
  }
];

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

export function AssetSelectionPanel({ projectId, initialAudiences, initialAssets }: AssetSelectionPanelProps) {
  const [audiences, setAudiences] = useState(initialAudiences);
  const [assets, setAssets] = useState(initialAssets);
  const [selectedAudienceId, setSelectedAudienceId] = useState(initialAudiences[0]?.id ?? "");
  const [editingAudienceId, setEditingAudienceId] = useState<string | "new" | null>(null);
  const [audienceDraft, setAudienceDraft] = useState<AudienceDraft>(draftFromAudience());
  const [selectedImageType, setSelectedImageType] = useState<ImageAssetType>("Social post graphic");
  const [imageNotes, setImageNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const selectedAudience = useMemo(
    () => audiences.find((audience) => audience.id === selectedAudienceId) ?? audiences[0] ?? null,
    [audiences, selectedAudienceId]
  );

  async function recommendAudiences() {
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
    setEditingAudienceId(null);
  }

  async function generateImageAsset() {
    setBusyAction("image");
    setMessage(null);

    const response = await fetch(`/api/projects/${projectId}/image-assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetType: selectedImageType,
        audienceId: selectedAudience?.id ?? null,
        notes: imageNotes
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
          <p className="eyebrow">Selection screen</p>
          <h2>Choose the audience and asset workflow.</h2>
        </div>
        <a className="secondary-action" href="#content-drafts">
          Generate content drafts
        </a>
      </div>

      {message ? <div className="error-box">{message}</div> : null}

      <div className="selection-grid">
        <section className="selection-panel audience-panel">
          <div className="panel-title">
            <h3>Recommended audiences</h3>
            <button disabled={busyAction === "audiences"} onClick={recommendAudiences} type="button">
              {busyAction === "audiences" ? "Analyzing" : audiences.length ? "Add recommendations" : "Recommend audiences"}
            </button>
          </div>

          <div className="audience-list">
            {audiences.length ? (
              audiences.map((audience) => (
                <button
                  className={audience.id === selectedAudience?.id ? "audience-card selected" : "audience-card"}
                  key={audience.id}
                  onClick={() => setSelectedAudienceId(audience.id)}
                  type="button"
                >
                  <span>{audience.isPrimary ? "Best customer" : "Audience"}</span>
                  <strong>{audience.name}</strong>
                  <small>{audience.summary}</small>
                </button>
              ))
            ) : (
              <div className="empty-copy">
                No personas yet. Generate recommended audiences from the brand, or add one manually.
              </div>
            )}
          </div>

          <div className="audience-actions">
            <button disabled={!selectedAudience} onClick={() => selectedAudience && startEditing(selectedAudience)} type="button">
              Edit selected
            </button>
            <button onClick={() => startEditing()} type="button">
              Add audience
            </button>
          </div>
        </section>

        <section className="selection-panel">
          <div className="panel-title">
            <h3>Asset workflows</h3>
            <span>Templates first</span>
          </div>
          <div className="workflow-grid">
            {workflowCards.map((card) => (
              <article className={card.status === "Planned" ? "workflow-card muted" : "workflow-card"} key={card.title}>
                <span>{card.status}</span>
                <h4>{card.title}</h4>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {editingAudienceId ? (
        <section className="selection-panel audience-editor">
          <div className="panel-title">
            <h3>{editingAudienceId === "new" ? "Add audience" : "Edit audience"}</h3>
            <button disabled={busyAction === "audience-save"} onClick={saveAudience} type="button">
              {busyAction === "audience-save" ? "Saving" : "Save audience"}
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

      <section className="selection-panel image-generator-panel">
        <div className="panel-title">
          <h3>Image generation</h3>
          <span>GPT Image 2</span>
        </div>
        <div className="image-generator-grid">
          <label>
            <span>Image type</span>
            <select
              onChange={(event) => setSelectedImageType(event.target.value as ImageAssetType)}
              value={selectedImageType}
            >
              {IMAGE_ASSET_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Audience</span>
            <select onChange={(event) => setSelectedAudienceId(event.target.value)} value={selectedAudience?.id ?? ""}>
              {audiences.map((audience) => (
                <option key={audience.id} value={audience.id}>
                  {audience.name}
                </option>
              ))}
            </select>
          </label>
          <label className="image-notes">
            <span>Direction</span>
            <textarea
              onChange={(event) => setImageNotes(event.target.value)}
              placeholder="Optional: offer, product angle, visual style, platform, or scene."
              value={imageNotes}
            />
          </label>
          <button disabled={busyAction === "image"} onClick={generateImageAsset} type="button">
            {busyAction === "image" ? "Generating image" : "Generate image asset"}
          </button>
        </div>

        {assets.length ? (
          <div className="asset-output-grid">
            {assets.map((asset) => (
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
    </section>
  );
}
