"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandExtraction } from "@/lib/brand";
import { BrandProfile } from "@/components/brand-profile";
import { LoadingIndicator } from "@/components/loading-indicator";
import type { StoredBrandExtraction } from "@/lib/brand-store";

const AGENTS = [
  { name: "Brand kit", detail: "Identity, colors, logo, voice" },
  { name: "Audience", detail: "Best customers and objections" },
  { name: "Social", detail: "Hooks, posts, captions" },
  { name: "Images", detail: "Prompts and branded graphics" },
  { name: "Campaigns", detail: "7 or 30 day calendars" },
  { name: "UGC", detail: "Creator briefs and shot lists" }
];

const WORKSPACE_STEPS = ["Website", "Brand profile", "Audiences", "Drafts", "Assets", "Campaign"];

type ScrapeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; extraction: BrandExtraction; stored: StoredBrandExtraction | null }
  | { status: "error"; message: string };

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
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
      stored?: StoredBrandExtraction | null;
      error?: string;
    };

    if (!response.ok || !payload.extraction) {
      setState({ status: "error", message: payload.error ?? "Brand extraction failed." });
      return;
    }

    if (payload.stored?.projectId) {
      router.push(`/projects/${payload.stored.projectId}`);
      return;
    }

    setState({ status: "success", extraction: payload.extraction, stored: null });
  }

  return (
    <main>
      <section className="intro">
        <nav>
          <strong className="brand-mark">DistroNow</strong>
          <span className="nav-link-row">
            <Link className="nav-action" href="/projects">
              Projects
            </Link>
            <Link className="nav-action" href="/account">
              Account
            </Link>
            <Link className="nav-action" href="/login">
              Log in
            </Link>
          </span>
        </nav>

        <div className="intro-shell">
          <div className="hero-copy">
            <p className="launch-pill">AI distribution workspace from one URL</p>
            <h1>Turn any website into a content engine.</h1>
            <p>
              Paste a website. DistroNow extracts the brand, finds the best customers, then builds posts, image briefs,
              creator workflows, and campaign calendars you can review before publishing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="scrape-form hero-scrape-form">
            <label htmlFor="website">Website</label>
            <div className="input-row hero-input-row">
              <input
                id="website"
                name="website"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://yourbrand.com"
                type="text"
                value={url}
              />
              <button disabled={state.status === "loading"} type="submit">
                {state.status === "loading" ? <LoadingIndicator compact label="Building" /> : "Build workspace"}
              </button>
            </div>
            <div className="form-note-row">
              <span>No account needed to start</span>
              <span>Review everything before publishing</span>
            </div>
            {state.status === "loading" ? (
              <div className="loading-panel">
                <LoadingIndicator label="Extracting the brand, audience, content angles, and visual system" />
              </div>
            ) : null}
            {state.status === "error" ? <div className="error-box">{state.message}</div> : null}
          </form>

          <div className="agent-strip" aria-label="Generated workspace modules">
            {AGENTS.map((agent) => (
              <article className="agent-card" key={agent.name}>
                <span>{agent.name.slice(0, 2)}</span>
                <strong>{agent.name}</strong>
                <small>{agent.detail}</small>
              </article>
            ))}
          </div>

          <section className="hero-workspace-preview" aria-label="Workspace preview">
            <div className="preview-header">
              <span>Live workspace preview</span>
              <strong>1 URL in, campaign assets out</strong>
            </div>
            <div className="preview-flow">
              {WORKSPACE_STEPS.map((step, index) => (
                <div key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
            <div className="preview-grid">
              <article>
                <span>Audience</span>
                <strong>High-intent buyers</strong>
                <small>Pain points, goals, objections, channels</small>
              </article>
              <article>
                <span>Assets</span>
                <strong>18 ready to review</strong>
                <small>Posts, image prompts, UGC briefs, exports</small>
              </article>
              <article>
                <span>Campaign</span>
                <strong>7 day launch plan</strong>
                <small>Grouped content calendar and publishing package</small>
              </article>
            </div>
          </section>
        </div>
      </section>

      {state.status === "success" ? <BrandProfile extraction={state.extraction} stored={state.stored} /> : null}
    </main>
  );
}
