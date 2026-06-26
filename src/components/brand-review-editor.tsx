"use client";

import { FormEvent, useState } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";
import type { BrandColors, BrandFont } from "@/lib/brand";
import type { BrandProjectWorkspace } from "@/lib/brand-store";

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

async function saveBrandSection({
  projectId,
  payload,
  setState
}: {
  projectId: string;
  payload: Record<string, unknown>;
  setState: (state: EditorState) => void;
}) {
  setState({ status: "loading" });

  const response = await fetch(`/api/projects/${projectId}/brand`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    setState({ status: "error", message: result.error ?? "Could not save brand profile." });
    return;
  }

  setState({ status: "success", message: "Saved. Refresh to see the updated preview." });
}

function EditorActions({
  state,
  onCancel
}: {
  state: EditorState;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="inline-editor-actions">
        <button disabled={state.status === "loading"} type="submit">
          {state.status === "loading" ? <LoadingIndicator compact label="Saving" /> : "Save"}
        </button>
        <button disabled={state.status === "loading"} onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
      {state.status === "success" ? <div className="success-box">{state.message}</div> : null}
      {state.status === "error" ? <div className="error-box">{state.message}</div> : null}
    </>
  );
}

export function IdentityEditor({
  workspace,
  onCancel
}: {
  workspace: BrandProjectWorkspace;
  onCancel: () => void;
}) {
  const { project, latestExtraction } = workspace;
  const [brandName, setBrandName] = useState(project.brandName ?? latestExtraction.title ?? project.domain);
  const [brandDescription, setBrandDescription] = useState(
    project.brandDescription ?? latestExtraction.description ?? ""
  );
  const [language, setLanguage] = useState(project.language ?? latestExtraction.language ?? "");
  const [brandLogo, setBrandLogo] = useState(project.brandLogo ?? latestExtraction.branding.logo ?? "");
  const [state, setState] = useState<EditorState>({ status: "idle" });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveBrandSection({
      projectId: project.id,
      payload: {
        brandName,
        brandDescription,
        language,
        brandLogo,
        brandColors: project.brandColors,
        brandFonts: project.brandFonts,
        brandFieldsStatus: project.brandFieldsStatus
      },
      setState
    });
  }

  return (
    <form className="inline-brand-editor" onSubmit={handleSubmit}>
      <div className="brand-editor-grid">
        <label>
          <span>Name</span>
          <input onChange={(event) => setBrandName(event.target.value)} value={brandName} />
        </label>
        <label>
          <span>Language</span>
          <input onChange={(event) => setLanguage(event.target.value)} value={language} />
        </label>
        <label className="wide-field">
          <span>Description</span>
          <textarea onChange={(event) => setBrandDescription(event.target.value)} value={brandDescription} />
        </label>
        <label className="wide-field">
          <span>Logo URL</span>
          <input onChange={(event) => setBrandLogo(event.target.value)} value={brandLogo} />
        </label>
      </div>
      <EditorActions onCancel={onCancel} state={state} />
    </form>
  );
}

export function ColorEditor({
  workspace,
  onCancel
}: {
  workspace: BrandProjectWorkspace;
  onCancel: () => void;
}) {
  const { project } = workspace;
  const [colors, setColors] = useState(stringifyColors(project.brandColors));
  const [state, setState] = useState<EditorState>({ status: "idle" });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveBrandSection({
      projectId: project.id,
      payload: {
        brandName: project.brandName ?? project.name ?? project.domain,
        brandDescription: project.brandDescription ?? "",
        language: project.language ?? "",
        brandLogo: project.brandLogo ?? "",
        brandColors: parseColors(colors),
        brandFonts: project.brandFonts,
        brandFieldsStatus: project.brandFieldsStatus
      },
      setState
    });
  }

  return (
    <form className="inline-brand-editor" onSubmit={handleSubmit}>
      <label>
        <span>Colors</span>
        <textarea onChange={(event) => setColors(event.target.value)} value={colors} />
      </label>
      <EditorActions onCancel={onCancel} state={state} />
    </form>
  );
}

export function FontEditor({
  workspace,
  onCancel
}: {
  workspace: BrandProjectWorkspace;
  onCancel: () => void;
}) {
  const { project } = workspace;
  const [fonts, setFonts] = useState(stringifyFonts(project.brandFonts));
  const [state, setState] = useState<EditorState>({ status: "idle" });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveBrandSection({
      projectId: project.id,
      payload: {
        brandName: project.brandName ?? project.name ?? project.domain,
        brandDescription: project.brandDescription ?? "",
        language: project.language ?? "",
        brandLogo: project.brandLogo ?? "",
        brandColors: project.brandColors,
        brandFonts: parseFonts(fonts),
        brandFieldsStatus: project.brandFieldsStatus
      },
      setState
    });
  }

  return (
    <form className="inline-brand-editor" onSubmit={handleSubmit}>
      <label>
        <span>Fonts</span>
        <textarea onChange={(event) => setFonts(event.target.value)} value={fonts} />
      </label>
      <EditorActions onCancel={onCancel} state={state} />
    </form>
  );
}
