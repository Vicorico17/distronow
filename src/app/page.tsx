"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandExtraction } from "@/lib/brand";
import { BrandProfile } from "@/components/brand-profile";
import type { StoredBrandExtraction } from "@/lib/brand-store";

type ScrapeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; extraction: BrandExtraction; stored: StoredBrandExtraction | null }
  | { status: "error"; message: string };

export default function Home() {
  const router = useRouter();
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
          <strong>DistroNow</strong>
          <span>Distribution workspace</span>
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
            {state.status === "error" ? <div className="error-box">{state.message}</div> : null}
          </form>
        </div>
      </section>

      {state.status === "success" ? (
        <BrandProfile extraction={state.extraction} stored={state.stored} />
      ) : (
        <section className="empty-state">
          <div>
            <h2>From website to workspace</h2>
            <p>Start by capturing the brand identity. The next workspace keeps the profile ready for social content.</p>
          </div>
          <ol>
            <li>Capture the visual system</li>
            <li>Save the brand profile</li>
            <li>Review colors, type, and assets</li>
            <li>Prepare reusable content prompts</li>
          </ol>
        </section>
      )}
    </main>
  );
}
