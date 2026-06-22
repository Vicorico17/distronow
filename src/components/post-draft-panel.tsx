"use client";

import { useState } from "react";
import { CHANNELS, ContentChannel, ContentIntent, INTENTS } from "@/lib/post-generator";
import type { SavedPostDraft } from "@/lib/brand-store";

type DraftState =
  | { status: "idle"; drafts: SavedPostDraft[] }
  | { status: "loading"; drafts: SavedPostDraft[] }
  | { status: "success"; drafts: SavedPostDraft[] }
  | { status: "error"; drafts: SavedPostDraft[]; message: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function PostDraftPanel({ projectId, initialDrafts }: { projectId: string; initialDrafts: SavedPostDraft[] }) {
  const [channel, setChannel] = useState<ContentChannel>("LinkedIn");
  const [intent, setIntent] = useState<ContentIntent>("Launch");
  const [state, setState] = useState<DraftState>({ status: "idle", drafts: initialDrafts });

  async function generateDrafts() {
    setState((current) => ({ status: "loading", drafts: current.drafts }));

    const response = await fetch(`/api/projects/${projectId}/post-drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, intent })
    });
    const payload = (await response.json()) as {
      drafts?: SavedPostDraft[];
      error?: string;
    };

    if (!response.ok || !payload.drafts) {
      setState((current) => ({
        status: "error",
        drafts: current.drafts,
        message: payload.error ?? "Could not generate drafts."
      }));
      return;
    }

    const generatedDrafts = payload.drafts;

    setState((current) => ({
      status: "success",
      drafts: [...generatedDrafts, ...current.drafts]
    }));
  }

  return (
    <section className="content-workspace">
      <div className="content-header">
        <div>
          <p className="eyebrow">Content drafts</p>
          <h2>Generate post ideas from this brand.</h2>
        </div>
        <button disabled={state.status === "loading"} onClick={generateDrafts} type="button">
          {state.status === "loading" ? "Generating" : "Generate drafts"}
        </button>
      </div>

      <div className="generator-controls">
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
            {INTENTS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      {state.status === "error" ? <div className="error-box">{state.message}</div> : null}

      <div className="draft-grid">
        {state.drafts.length ? (
          state.drafts.map((draft) => (
            <article className="draft-card" key={draft.id}>
              <div className="draft-meta">
                <span>{draft.channel}</span>
                <span>{draft.intent}</span>
                <span>{formatDate(draft.createdAt)}</span>
              </div>
              <h3>{draft.headline}</h3>
              <p>{draft.body}</p>
              <strong>{draft.cta}</strong>
              <div className="hashtag-row">
                {draft.hashtags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="draft-empty">
            <h3>No drafts yet</h3>
            <p>Choose a channel and intent to create the first saved content ideas for this brand.</p>
          </div>
        )}
      </div>
    </section>
  );
}
