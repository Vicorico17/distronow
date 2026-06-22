import { BrandExtraction, getColorEntries } from "@/lib/brand";
import type { StoredBrandExtraction } from "@/lib/brand-store";

const samplePrompts = ["Launch announcement", "Founder update", "Product benefit", "Customer proof"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

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
  projectLabel
}: {
  extraction: BrandExtraction;
  stored?: StoredBrandExtraction | null;
  projectLabel?: string;
}) {
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

        <div className="meta-row">
          <span>{new URL(extraction.sourceUrl).hostname}</span>
          <span>Captured {formatDate(extraction.capturedAt)}</span>
          {stored ? <span>Saved project {stored.projectId.slice(0, 8)}</span> : null}
        </div>
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

        <section className="panel">
          <div className="panel-title">
            <h3>Post Starters</h3>
            <span>Next step</span>
          </div>
          <div className="prompt-grid">
            {samplePrompts.map((prompt) => (
              <button type="button" key={prompt}>
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="panel panel-wide">
          <div className="panel-title">
            <h3>Pipeline Payload</h3>
            <span>Ready for generation</span>
          </div>
          <JsonPreview extraction={extraction} />
        </section>
      </div>
    </section>
  );
}
