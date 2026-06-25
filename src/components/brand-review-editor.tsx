"use client";

import { FormEvent, useState } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";
import type { BrandProjectWorkspace } from "@/lib/brand-store";
import type { BrandColors, BrandFont } from "@/lib/brand";

type FieldStatus = "pending" | "confirmed" | "ignored";

type EditorState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function stringifyColors(colors: unknown) {
  const value = colors && typeof colors === "object" ? (colors as BrandColors) : {};

  return Object.entries(value)
    .filter(([, color]) => typeof color === "string" && color.trim())
    .map(([name, color]) => `${name}: ${color}`)
    .join("\n");
}

function parseColors(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((colors, line) => {
      const [name, ...rest] = line.split(":");
      const color = rest.join(":").trim();

      if (name?.trim() && color) {
        colors[name.trim()] = color;
      }

      return colors;
    }, {});
}

function stringifyFonts(fonts: unknown) {
  return Array.isArray(fonts)
    ? fonts
        .map((font) => (font && typeof font === "object" ? (font as BrandFont).family : undefined))
        .filter(Boolean)
        .join("\n")
    : "";
}

function parseFonts(value: string) {
  return value
    .split("\n")
    .map((family) => family.trim())
    .filter(Boolean)
    .map((family) => ({ family }));
}

function readStatus(value: unknown, field: string): FieldStatus {
  if (!value || typeof value !== "object") {
    return "pending";
  }

  const status = (value as Record<string, unknown>)[field];

  return status === "confirmed" || status === "ignored" ? status : "pending";
}

export function BrandReviewEditor({ workspace }: { workspace: BrandProjectWorkspace }) {
  const { project, latestExtraction } = workspace;
  const [brandName, setBrandName] = useState(project.brandName ?? latestExtraction.title ?? project.domain);
  const [brandDescription, setBrandDescription] = useState(
    project.brandDescription ?? latestExtraction.description ?? ""
  );
  const [language, setLanguage] = useState(project.language ?? latestExtraction.language ?? "");
  const [tone, setTone] = useState(project.tone ?? "");
  const [audience, setAudience] = useState(project.audience ?? "");
  const [brandLogo, setBrandLogo] = useState(project.brandLogo ?? latestExtraction.branding.logo ?? "");
  const [colors, setColors] = useState(stringifyColors(project.brandColors));
  const [fonts, setFonts] = useState(stringifyFonts(project.brandFonts));
  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>({
    name: readStatus(project.brandFieldsStatus, "name"),
    description: readStatus(project.brandFieldsStatus, "description"),
    language: readStatus(project.brandFieldsStatus, "language"),
    colors: readStatus(project.brandFieldsStatus, "colors"),
    fonts: readStatus(project.brandFieldsStatus, "fonts"),
    tone: readStatus(project.brandFieldsStatus, "tone")
  });
  const [state, setState] = useState<EditorState>({ status: "idle" });

  function updateFieldStatus(field: string, status: FieldStatus) {
    setFieldStatus((current) => ({ ...current, [field]: status }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    const response = await fetch(`/api/projects/${project.id}/brand`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName,
        brandDescription,
        language,
        tone,
        audience,
        brandLogo,
        brandColors: parseColors(colors),
        brandFonts: parseFonts(fonts),
        brandFieldsStatus: fieldStatus
      })
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setState({ status: "error", message: payload.error ?? "Could not save brand profile." });
      return;
    }

    setState({ status: "success", message: "Brand profile saved. New generations will use these values." });
  }

  return (
    <section className="brand-review-editor">
      <div className="panel-title">
        <div>
          <p className="eyebrow">Review</p>
          <h3>Edit brand profile</h3>
        </div>
        <span>Source of truth</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="brand-editor-grid">
          <label>
            <span>Name</span>
            <input onChange={(event) => setBrandName(event.target.value)} value={brandName} />
          </label>
          <label>
            <span>Language</span>
            <input onChange={(event) => setLanguage(event.target.value)} value={language} />
          </label>
          <label>
            <span>Tone</span>
            <input onChange={(event) => setTone(event.target.value)} value={tone} />
          </label>
          <label>
            <span>Best audience note</span>
            <input onChange={(event) => setAudience(event.target.value)} value={audience} />
          </label>
          <label className="wide-field">
            <span>Description</span>
            <textarea onChange={(event) => setBrandDescription(event.target.value)} value={brandDescription} />
          </label>
          <label className="wide-field">
            <span>Logo URL</span>
            <input onChange={(event) => setBrandLogo(event.target.value)} value={brandLogo} />
          </label>
          <label>
            <span>Colors</span>
            <textarea onChange={(event) => setColors(event.target.value)} value={colors} />
          </label>
          <label>
            <span>Fonts</span>
            <textarea onChange={(event) => setFonts(event.target.value)} value={fonts} />
          </label>
        </div>

        <div className="field-status-grid">
          {Object.keys(fieldStatus).map((field) => (
            <label key={field}>
              <span>{field}</span>
              <select
                onChange={(event) => updateFieldStatus(field, event.target.value as FieldStatus)}
                value={fieldStatus[field]}
              >
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="ignored">ignored</option>
              </select>
            </label>
          ))}
        </div>

        <button disabled={state.status === "loading"} type="submit">
          {state.status === "loading" ? <LoadingIndicator compact label="Saving" /> : "Save brand profile"}
        </button>
      </form>

      {state.status === "success" ? <div className="success-box">{state.message}</div> : null}
      {state.status === "error" ? <div className="error-box">{state.message}</div> : null}
    </section>
  );
}
