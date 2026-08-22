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

const CASE_STUDIES = [
  {
    archetype: "The Visionary",
    reference: "Elon Musk",
    promise: "A future worth joining",
    business: "Turns ambitious beliefs into products, movements, and category-defining stories.",
    playbook: ["Name the impossible future", "Make progress visible", "Invite the audience into the mission"],
    accent: "visionary"
  },
  {
    archetype: "The Jester",
    reference: "Jack Sparrow",
    promise: "Freedom from the expected",
    business: "Wins attention through wit, surprise, and a refusal to behave like the rest of the category.",
    playbook: ["Break a familiar rule", "Turn flaws into charm", "Make the audience part of the joke"],
    accent: "jester"
  },
  {
    archetype: "The Sage",
    reference: "David Attenborough",
    promise: "Clarity in a noisy world",
    business: "Builds trust by making complex ideas feel understandable, useful, and worth remembering.",
    playbook: ["Teach before selling", "Reveal the hidden pattern", "Let evidence carry the story"],
    accent: "sage"
  }
] as const;

type ScrapeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; extraction: BrandExtraction; stored: StoredBrandExtraction | null; warning?: string }
  | { status: "error"; message: string };

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ScrapeState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/brand/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const payload = (await response.json()) as {
        extraction?: BrandExtraction;
        stored?: StoredBrandExtraction | null;
        error?: string;
        warning?: string;
      };

      if (!response.ok || !payload.extraction) {
        setState({ status: "error", message: payload.error ?? "Brand extraction failed." });
        return;
      }

      if (payload.stored?.projectId) {
        router.push(`/projects/${payload.stored.projectId}`);
        return;
      }

      setState({ status: "success", extraction: payload.extraction, stored: null, warning: payload.warning });
    } catch {
      setState({
        status: "error",
        message: "We could not reach the brand builder. Check the URL and connection, then try again."
      });
    }
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
            <Link className="nav-action" href="/process">
              Process
            </Link>
            <a className="nav-action" href="#case-studies">
              Case studies
            </a>
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
            <h1>Start with the business you already have. Build the marketing system around it.</h1>
            <p>
              Add your website. DistroNow extracts the brand, helps you define the best customers, builds the strategy,
              creates the work, and moves approved content into accounts, acquisition, and analytics.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="scrape-form hero-scrape-form">
            <label htmlFor="website">Website</label>
            <div className="input-row hero-input-row">
              <input
                autoComplete="url"
                id="website"
                inputMode="url"
                name="website"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://yourbrand.com"
                required
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
        </div>
      </section>

      {state.status === "success" ? <BrandProfile extraction={state.extraction} stored={state.stored} /> : null}
      {state.status === "success" && state.warning ? (
        <div className="workspace-notice" role="status">
          {state.warning}
        </div>
      ) : null}

      <section className="case-studies" id="case-studies">
        <div className="case-studies-heading">
          <div>
            <p className="eyebrow">Brand archetypes in business</p>
            <h2>Every memorable brand plays a recognizable role.</h2>
          </div>
          <p>
            An archetype is not a costume or a celebrity impression. It is the repeatable promise, behavior, and
            story system that makes a business feel consistent wherever it shows up.
          </p>
        </div>

        <div className="case-study-grid">
          {CASE_STUDIES.map((study, index) => (
            <article className={`case-study-card case-study-${study.accent}`} key={study.archetype}>
              <div className="case-study-number">0{index + 1}</div>
              <div className="case-study-title">
                <p>{study.reference} energy</p>
                <h3>{study.archetype}</h3>
              </div>
              <p className="case-study-promise">“{study.promise}”</p>
              <p className="case-study-business">{study.business}</p>
              <div className="case-study-playbook">
                <span>Business playbook</span>
                <ul>
                  {study.playbook.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="case-study-takeaway">
          <span>What DistroNow extracts</span>
          <p>Role → promise → point of view → repeatable content formats → campaigns that still sound like you.</p>
        </div>
      </section>
    </main>
  );
}
