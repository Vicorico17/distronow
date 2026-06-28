"use client";

import Link from "next/link";
import { useState } from "react";
import { ColorEditor, FontEditor, IdentityEditor } from "@/components/brand-review-editor";
import { LoadingIndicator } from "@/components/loading-indicator";
import { BrandExtraction, getColorEntries } from "@/lib/brand";
import type { BrandProjectWorkspace, StoredBrandExtraction } from "@/lib/brand-store";
import type { Json } from "@/lib/supabase/types";

function JsonPreview({ extraction }: { extraction: BrandExtraction }) {
  const value = JSON.stringify(extraction, null, 2);

  return <pre className="json-preview">{value}</pre>;
}

function ColorGrid({ extraction }: { extraction: BrandExtraction }) {
  const colors = getColorEntries(extraction.branding.colors);

  if (colors.length === 0) {
    return <p className="empty-copy">No color tokens were returned.</p>;
  }

  return (
    <div className="color-grid">
      {colors.map(([name, value]) => (
        <div className="color-token" key={name}>
          <span className="swatch" style={{ background: value }} />
          <span>
            <strong>{name}</strong>
            <code>{value}</code>
          </span>
        </div>
      ))}
    </div>
  );
}

function isJsonObject(value: Json | undefined): value is Record<string, Json> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

function readAsset(value: Json | undefined) {
  if (!isJsonObject(value)) {
    return null;
  }

  return {
    sourceUrl: readString(value.sourceUrl),
    publicUrl: readString(value.publicUrl),
    storagePath: readString(value.storagePath),
    status: readString(value.status)
  };
}

function ConfidencePanel({ value }: { value: Json | undefined }) {
  const confidence = isJsonObject(value) ? value : {};
  const overall = isJsonObject(confidence.overall) ? confidence.overall : {};
  const fields = isJsonObject(confidence.fields) ? confidence.fields : {};
  const score = typeof overall.score === "number" ? overall.score : 0;
  const level = readString(overall.level) || "unknown";
  const entries = Object.entries(fields).filter(([, field]) => isJsonObject(field));

  if (!entries.length) {
    return <p className="empty-copy">Confidence will appear after the next brand extraction.</p>;
  }

  return (
    <div className="confidence-stack">
      <div className="confidence-overall">
        <span>Overall</span>
        <strong>{Math.round(score * 100)}%</strong>
        <small>{level}</small>
      </div>
      {entries.map(([name, field]) => {
        const fieldValue = field as Record<string, Json>;
        const fieldScore = typeof fieldValue.score === "number" ? fieldValue.score : 0;

        return (
          <div className="confidence-row" key={name}>
            <span>{name}</span>
            <div>
              <i style={{ width: `${Math.round(fieldScore * 100)}%` }} />
            </div>
            <strong>{Math.round(fieldScore * 100)}%</strong>
          </div>
        );
      })}
    </div>
  );
}

function BrandAssetsPanel({ value }: { value: Json | undefined }) {
  const assets = isJsonObject(value) ? value : {};
  const rows = (["logo", "favicon", "ogImage"] as const)
    .map((kind) => ({ kind, asset: readAsset(assets[kind]) }))
    .filter((row): row is { kind: "logo" | "favicon" | "ogImage"; asset: NonNullable<ReturnType<typeof readAsset>> } =>
      Boolean(row.asset?.sourceUrl)
    );
  const platformSizes = Array.isArray(assets.platformSizes) ? assets.platformSizes : [];

  if (!rows.length) {
    return <p className="empty-copy">No logo or OG image references were saved yet.</p>;
  }

  return (
    <div className="brand-assets-stack">
      {rows.map(({ kind, asset }) => (
        <article className="brand-asset-row" key={kind}>
          <span>{kind}</span>
          <strong>{asset.status === "copied" ? "Copied to Supabase" : "Reference saved"}</strong>
          <a href={asset.publicUrl || asset.sourceUrl} rel="noreferrer" target="_blank">
            Open asset
          </a>
        </article>
      ))}
      {platformSizes.length ? (
        <div className="platform-size-list">
          {platformSizes.slice(0, 5).map((item, index) =>
            isJsonObject(item) ? (
              <span key={`${readString(item.platform)}-${index}`}>
                {readString(item.platform)} {readString(item.size)}
              </span>
            ) : null
          )}
        </div>
      ) : null}
    </div>
  );
}

export function BrandProfile({
  extraction,
  stored,
  projectLabel,
  action,
  workspace,
  showRawData = true
}: {
  extraction: BrandExtraction;
  stored?: StoredBrandExtraction | null;
  projectLabel?: string;
  action?: {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    label: string;
  };
  workspace?: BrandProjectWorkspace;
  showRawData?: boolean;
}) {
  const [editingSection, setEditingSection] = useState<"identity" | "colors" | "fonts" | null>(null);
  const [loadingActionHref, setLoadingActionHref] = useState<string | null>(null);
  const branding = extraction.branding;
  const logo = branding.logo ?? branding.images?.logo ?? branding.images?.favicon;
  const fonts = [
    branding.typography?.fontFamilies?.heading,
    branding.typography?.fontFamilies?.primary,
    ...(branding.fonts ?? []).map((font) => font.family)
  ].filter(Boolean);

  return (
    <section className="workspace" aria-label="Extracted brand profile">
      <div className="brand-summary">
        <div className="brand-summary-top">
          <div className="brand-heading">
            <div className="logo-box">
              {logo ? <img src={logo} alt="" /> : <span>{extraction.title?.slice(0, 1) ?? "D"}</span>}
            </div>
            <div>
              <p className="eyebrow">{projectLabel ?? "Brand profile"}</p>
              <h2>{extraction.title ?? extraction.sourceUrl}</h2>
              <p>{extraction.description ?? "A reusable identity kit is ready for the next distribution workflow."}</p>
            </div>
          </div>

          {workspace ? (
            <button
              aria-label="Edit brand identity"
              className="icon-action"
              onClick={() => setEditingSection((current) => (current === "identity" ? null : "identity"))}
              type="button"
            >
              ✎
            </button>
          ) : null}
        </div>

        <div className="meta-row">
          <span>{new URL(extraction.sourceUrl).hostname}</span>
          {extraction.language ? <span>Language {extraction.language}</span> : null}
          {stored && !workspace ? <span>Saved</span> : null}
        </div>

        {editingSection === "identity" && workspace ? (
          <IdentityEditor workspace={workspace} onCancel={() => setEditingSection(null)} />
        ) : null}
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-title">
            <h3>Colors</h3>
            <div className="panel-title-actions">
              <span>{getColorEntries(branding.colors).length} tokens</span>
              {workspace ? (
                <button
                  aria-label="Edit colors"
                  className="icon-action icon-action-small"
                  onClick={() => setEditingSection((current) => (current === "colors" ? null : "colors"))}
                  type="button"
                >
                  ✎
                </button>
              ) : null}
            </div>
          </div>
          <ColorGrid extraction={extraction} />
          {editingSection === "colors" && workspace ? (
            <ColorEditor workspace={workspace} onCancel={() => setEditingSection(null)} />
          ) : null}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>Type</h3>
            <div className="panel-title-actions">
              <span>{fonts.length || 0} families</span>
              {workspace ? (
                <button
                  aria-label="Edit fonts"
                  className="icon-action icon-action-small"
                  onClick={() => setEditingSection((current) => (current === "fonts" ? null : "fonts"))}
                  type="button"
                >
                  ✎
                </button>
              ) : null}
            </div>
          </div>
          <div className="type-stack">
            {fonts.length ? (
              [...new Set(fonts)].map((font) => (
                <div key={font} className="type-row">
                  <span>{font}</span>
                  <strong style={{ fontFamily: font }}>{font}</strong>
                </div>
              ))
            ) : (
              <p className="empty-copy">No font data was returned.</p>
            )}
          </div>
          {editingSection === "fonts" && workspace ? (
            <FontEditor workspace={workspace} onCancel={() => setEditingSection(null)} />
          ) : null}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>Confidence</h3>
            <span>Extracted fields</span>
          </div>
          <ConfidencePanel value={workspace?.project.brandConfidence} />
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>Brand Assets</h3>
            <span>Saved references</span>
          </div>
          <BrandAssetsPanel value={workspace?.project.brandAssets} />
        </section>

        {action ? (
          <section className="panel panel-action">
            <p className="eyebrow">{action.eyebrow}</p>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
            <Link
              aria-busy={loadingActionHref === action.href}
              className="primary-action"
              href={action.href}
              onClick={() => setLoadingActionHref(action.href)}
            >
              {loadingActionHref === action.href ? <LoadingIndicator compact label="Loading" /> : action.label}
            </Link>
          </section>
        ) : null}

        {showRawData ? (
          <section className="panel panel-wide">
            <div className="panel-title">
              <h3>Brand Data</h3>
              <span>Reference</span>
            </div>
            <details className="json-details">
              <summary>Show extracted payload</summary>
              <JsonPreview extraction={extraction} />
            </details>
          </section>
        ) : null}
      </div>
    </section>
  );
}
