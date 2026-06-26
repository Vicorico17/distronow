"use client";

import Link from "next/link";
import { useState } from "react";
import { InlineBrandReviewEditor } from "@/components/brand-review-editor";
import { BrandExtraction, getColorEntries } from "@/lib/brand";
import type { BrandProjectWorkspace, StoredBrandExtraction } from "@/lib/brand-store";

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
  const [isEditing, setIsEditing] = useState(false);
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
              aria-label="Edit brand profile"
              className="icon-action"
              onClick={() => setIsEditing((current) => !current)}
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

        {isEditing && workspace ? (
          <InlineBrandReviewEditor workspace={workspace} onCancel={() => setIsEditing(false)} />
        ) : null}
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-title">
            <h3>Colors</h3>
            <span>{getColorEntries(branding.colors).length} tokens</span>
          </div>
          <ColorGrid extraction={extraction} />
        </section>

        <section className="panel">
          <div className="panel-title">
            <h3>Type</h3>
            <span>{fonts.length || 0} families</span>
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
        </section>

        {action ? (
          <section className="panel panel-action">
            <p className="eyebrow">{action.eyebrow}</p>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
            <Link className="primary-action" href={action.href}>
              {action.label}
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
