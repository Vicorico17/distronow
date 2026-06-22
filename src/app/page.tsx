"use client";

import { FormEvent, useMemo, useState } from "react";
import { BrandExtraction, getColorEntries } from "@/lib/brand";

type ScrapeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; extraction: BrandExtraction }
  | { status: "error"; message: string };

const samplePrompts = [
  "Launch announcement",
  "Founder update",
  "Product benefit",
  "Customer proof"
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function JsonPreview({ extraction }: { extraction: BrandExtraction }) {
  const value = useMemo(() => JSON.stringify(extraction, null, 2), [extraction]);

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

function BrandResult({ extraction }: { extraction: BrandExtraction }) {
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
            <p className="eyebrow">Brand profile</p>
            <h2>{extraction.title ?? extraction.sourceUrl}</h2>
            <p>{extraction.description ?? "A reusable identity kit is ready for the next distribution workflow."}</p>
          </div>
        </div>

        <div className="meta-row">
          <span>{new URL(extraction.sourceUrl).hostname}</span>
          <span>Captured {formatDate(extraction.capturedAt)}</span>
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
            <span>Ready for storage</span>
          </div>
          <JsonPreview extraction={extraction} />
        </section>
      </div>
    </section>
  );
}

export default function Home() {
  const [url, setUrl] = useState("www.rektgang.com");
  const [state, setState] = useState<ScrapeState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    const response = await fetch("/api/brand/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const payload = (await response.json()) as {
      extraction?: BrandExtraction;
      error?: string;
    };

    if (!response.ok || !payload.extraction) {
      setState({ status: "error", message: payload.error ?? "Brand extraction failed." });
      return;
    }

    setState({ status: "success", extraction: payload.extraction });
  }

  return (
    <main>
      <section className="intro">
        <nav>
          <strong>DistroNow</strong>
          <span>Brand ingestion pipeline</span>
        </nav>

        <div className="intro-grid">
          <div>
            <p className="eyebrow">Start with any website</p>
            <h1>Turn a brand into distribution assets without rebuilding the basics.</h1>
            <p className="lede">
              Capture logo, colors, typography, and source metadata first. The content engine can build social posts,
              launch updates, and reusable templates from this profile next.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="scrape-form">
            <label htmlFor="website">Website</label>
            <div className="input-row">
              <input
                id="website"
                name="website"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="example.com"
                type="text"
                value={url}
              />
              <button disabled={state.status === "loading"} type="submit">
                {state.status === "loading" ? "Extracting" : "Extract"}
              </button>
            </div>
            <p>Server key: FIRECRAWL_API_KEY in .env.local.</p>
            {state.status === "error" ? <div className="error-box">{state.message}</div> : null}
          </form>
        </div>
      </section>

      {state.status === "success" ? (
        <BrandResult extraction={state.extraction} />
      ) : (
        <section className="empty-state">
          <div>
            <h2>Pipeline shape</h2>
            <p>URL input flows into Firecrawl branding extraction, then becomes the canonical brand profile.</p>
          </div>
          <ol>
            <li>Normalize website URL</li>
            <li>Request Firecrawl branding scrape</li>
            <li>Review extracted brand identity</li>
            <li>Use profile for content generation workflows</li>
          </ol>
        </section>
      )}
    </main>
  );
}
