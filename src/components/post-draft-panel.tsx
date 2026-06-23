"use client";

import { useState } from "react";
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
import type { SavedPostDraft } from "@/lib/brand-store";

type DraftState =
  | { status: "idle"; drafts: SavedPostDraft[] }
  | { status: "loading"; drafts: SavedPostDraft[] }
  | { status: "success"; drafts: SavedPostDraft[] }
  | { status: "error"; drafts: SavedPostDraft[]; message: string };

type CopiedSection = {
  draftId: string;
  section: "headline" | "body" | "cta" | "hashtags";
} | null;

const DRAFT_STATUSES = ["generated", "edited", "approved", "published"] as const;

type EditableDraft = {
  headline: string;
  body: string;
  cta: string;
  hashtags: string;
  status: SavedPostDraft["status"];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function normalizeInitialLanguage(value: string): ContentLanguage {
  return LANGUAGES.includes(value as ContentLanguage) ? (value as ContentLanguage) : "Auto";
}

export function PostDraftPanel({
  projectId,
  initialDrafts,
  initialLanguage = "Auto"
}: {
  projectId: string;
  initialDrafts: SavedPostDraft[];
  initialLanguage?: string;
}) {
  const [channel, setChannel] = useState<ContentChannel>("LinkedIn");
  const [intent, setIntent] = useState<ContentIntent>("Launch announcement");
  const [language, setLanguage] = useState<ContentLanguage>(normalizeInitialLanguage(initialLanguage));
  const [tone, setTone] = useState<ContentTone>("Auto");
  const [length, setLength] = useState<ContentLength>("Medium");
  const [state, setState] = useState<DraftState>({ status: "idle", drafts: initialDrafts });
  const [copiedSection, setCopiedSection] = useState<CopiedSection>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditableDraft | null>(null);
  const [actionDraftId, setActionDraftId] = useState<string | null>(null);

  async function generateDrafts() {
    setState((current) => ({ status: "loading", drafts: current.drafts }));

    const response = await fetch(`/api/projects/${projectId}/post-drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, intent, language, tone, length })
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

  async function regenerateDraft(draft: SavedPostDraft) {
    setActionDraftId(draft.id);

    const settings = draft.settings ?? {
      channel: draft.channel,
      intent: draft.intent,
      language: "Auto" as ContentLanguage,
      tone: "Auto" as ContentTone,
      length: draft.length ?? ("Medium" as ContentLength)
    };

    const response = await fetch(`/api/projects/${projectId}/post-drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    const payload = (await response.json()) as {
      drafts?: SavedPostDraft[];
      error?: string;
    };

    setActionDraftId(null);

    if (!response.ok || !payload.drafts) {
      setState((current) => ({
        status: "error",
        drafts: current.drafts,
        message: payload.error ?? "Could not regenerate draft."
      }));
      return;
    }

    const regeneratedDrafts = payload.drafts;

    setState((current) => ({
      status: "success",
      drafts: [...regeneratedDrafts, ...current.drafts]
    }));
  }

  function startEditing(draft: SavedPostDraft) {
    setEditingDraftId(draft.id);
    setEditDraft({
      headline: draft.headline,
      body: draft.body,
      cta: draft.cta,
      hashtags: draft.hashtags.join(" "),
      status: draft.status
    });
  }

  async function saveDraft(draftId: string) {
    if (!editDraft) {
      return;
    }

    setActionDraftId(draftId);

    const response = await fetch(`/api/projects/${projectId}/post-drafts/${draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: editDraft.headline,
        body: editDraft.body,
        cta: editDraft.cta,
        hashtags: editDraft.hashtags
          .split(/\s+/)
          .map((tag) => tag.trim())
          .filter(Boolean),
        status: editDraft.status === "generated" ? "edited" : editDraft.status
      })
    });
    const payload = (await response.json()) as {
      draft?: SavedPostDraft;
      error?: string;
    };

    setActionDraftId(null);

    if (!response.ok || !payload.draft) {
      setState((current) => ({
        status: "error",
        drafts: current.drafts,
        message: payload.error ?? "Could not save draft."
      }));
      return;
    }

    setEditingDraftId(null);
    setEditDraft(null);
    setState((current) => ({
      status: "success",
      drafts: current.drafts.map((draft) => (draft.id === draftId ? payload.draft! : draft))
    }));
  }

  async function duplicateDraft(draftId: string) {
    setActionDraftId(draftId);

    const response = await fetch(`/api/projects/${projectId}/post-drafts/${draftId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate" })
    });
    const payload = (await response.json()) as {
      draft?: SavedPostDraft;
      error?: string;
    };

    setActionDraftId(null);

    if (!response.ok || !payload.draft) {
      setState((current) => ({
        status: "error",
        drafts: current.drafts,
        message: payload.error ?? "Could not duplicate draft."
      }));
      return;
    }

    setState((current) => ({
      status: "success",
      drafts: [payload.draft!, ...current.drafts]
    }));
  }

  async function deleteDraft(draftId: string) {
    setActionDraftId(draftId);

    const response = await fetch(`/api/projects/${projectId}/post-drafts/${draftId}`, {
      method: "DELETE"
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setActionDraftId(null);

    if (!response.ok) {
      setState((current) => ({
        status: "error",
        drafts: current.drafts,
        message: payload.error ?? "Could not delete draft."
      }));
      return;
    }

    setState((current) => ({
      status: "success",
      drafts: current.drafts.filter((draft) => draft.id !== draftId)
    }));
  }

  async function copySection(
    draftId: string,
    section: NonNullable<CopiedSection>["section"],
    value: string | string[]
  ) {
    const text = Array.isArray(value) ? value.join(" ") : value;

    if (!text.trim()) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopiedSection({ draftId, section });
    window.setTimeout(() => setCopiedSection(null), 1600);
  }

  return (
    <section className="content-workspace">
      <div className="content-header">
        <div>
          <p className="eyebrow">Next step</p>
          <h2>Create the first content drafts.</h2>
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
      </div>

      {state.status === "error" ? <div className="error-box">{state.message}</div> : null}

      <div className="draft-grid">
        {state.drafts.length ? (
          state.drafts.map((draft) => {
            const isEditing = editingDraftId === draft.id && editDraft;
            const isBusy = actionDraftId === draft.id;

            return (
            <article className="draft-card" key={draft.id}>
              <div className="draft-meta">
                <span>{draft.channel}</span>
                <span>{draft.intent}</span>
                {draft.language ? <span>{draft.language}</span> : null}
                {draft.tone ? <span>{draft.tone}</span> : null}
                {draft.length ? <span>{draft.length}</span> : null}
                <span>{draft.status}</span>
                <span>{draft.provider}</span>
                <span>{formatDate(draft.createdAt)}</span>
              </div>

              <div className="draft-actions">
                {isEditing ? (
                  <>
                    <button disabled={isBusy} onClick={() => saveDraft(draft.id)} type="button">
                      {isBusy ? "Saving" : "Save"}
                    </button>
                    <button
                      disabled={isBusy}
                      onClick={() => {
                        setEditingDraftId(null);
                        setEditDraft(null);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button disabled={isBusy} onClick={() => startEditing(draft)} type="button">
                      Edit
                    </button>
                    <button disabled={isBusy} onClick={() => duplicateDraft(draft.id)} type="button">
                      Duplicate
                    </button>
                    <button disabled={isBusy} onClick={() => regenerateDraft(draft)} type="button">
                      Regenerate
                    </button>
                    <button disabled={isBusy} onClick={() => deleteDraft(draft.id)} type="button">
                      Delete
                    </button>
                  </>
                )}
              </div>

              <div className="draft-section">
                <div className="draft-section-header">
                  <span>Headline</span>
                  <button onClick={() => copySection(draft.id, "headline", draft.headline)} type="button">
                    {copiedSection?.draftId === draft.id && copiedSection.section === "headline" ? "Copied" : "Copy"}
                  </button>
                </div>
                {isEditing ? (
                  <input
                    onChange={(event) => setEditDraft({ ...editDraft, headline: event.target.value })}
                    value={editDraft.headline}
                  />
                ) : (
                  <h3>{draft.headline}</h3>
                )}
              </div>

              <div className="draft-section">
                <div className="draft-section-header">
                  <span>Body</span>
                  <button onClick={() => copySection(draft.id, "body", draft.body)} type="button">
                    {copiedSection?.draftId === draft.id && copiedSection.section === "body" ? "Copied" : "Copy"}
                  </button>
                </div>
                {isEditing ? (
                  <textarea
                    onChange={(event) => setEditDraft({ ...editDraft, body: event.target.value })}
                    rows={6}
                    value={editDraft.body}
                  />
                ) : (
                  <p>{draft.body}</p>
                )}
              </div>

              <div className="draft-section">
                <div className="draft-section-header">
                  <span>CTA</span>
                  <button onClick={() => copySection(draft.id, "cta", draft.cta)} type="button">
                    {copiedSection?.draftId === draft.id && copiedSection.section === "cta" ? "Copied" : "Copy"}
                  </button>
                </div>
                {isEditing ? (
                  <input onChange={(event) => setEditDraft({ ...editDraft, cta: event.target.value })} value={editDraft.cta} />
                ) : (
                  <strong>{draft.cta}</strong>
                )}
              </div>

              <div className="draft-section">
                <div className="draft-section-header">
                  <span>Hashtags</span>
                  <button onClick={() => copySection(draft.id, "hashtags", draft.hashtags)} type="button">
                    {copiedSection?.draftId === draft.id && copiedSection.section === "hashtags" ? "Copied" : "Copy"}
                  </button>
                </div>
                {isEditing ? (
                  <input
                    onChange={(event) => setEditDraft({ ...editDraft, hashtags: event.target.value })}
                    value={editDraft.hashtags}
                  />
                ) : (
                  <div className="hashtag-row">
                    {draft.hashtags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="draft-section draft-status-section">
                <div className="draft-section-header">
                  <span>Status</span>
                </div>
                {isEditing ? (
                  <select
                    onChange={(event) =>
                      setEditDraft({ ...editDraft, status: event.target.value as SavedPostDraft["status"] })
                    }
                    value={editDraft.status}
                  >
                    {DRAFT_STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                ) : (
                  <strong>{draft.status}</strong>
                )}
              </div>
            </article>
          );
          })
        ) : (
          <div className="draft-empty">
            <div>
              <h3>No drafts yet</h3>
              <p>Choose a channel and intent, then generate the first saved content ideas for this brand.</p>
            </div>
            <button disabled={state.status === "loading"} onClick={generateDrafts} type="button">
              {state.status === "loading" ? "Generating" : "Generate drafts"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
