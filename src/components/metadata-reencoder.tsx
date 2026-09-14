"use client";

import { useEffect, useState, type ChangeEvent } from "react";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

function outputExtension(format: OutputFormat) {
  return format === "image/jpeg" ? "jpg" : format.split("/")[1];
}

function outputName(name: string, format: OutputFormat) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-");
  return `${base || "asset"}-reencoded.${outputExtension(format)}`;
}

function bytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

export function MetadataReencoder() {
  const [file, setFile] = useState<File>();
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; url: string; width: number; height: number }>();

  useEffect(
    () => () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    },
    [result],
  );

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(undefined);
    setError("");
    setFile(next);
    if (next?.type === "image/png") setFormat("image/png");
    else if (next?.type === "image/webp") setFormat("image/webp");
    else setFormat("image/jpeg");
  }

  async function reencode() {
    if (!file || !confirmed) return;
    setBusy(true);
    setError("");
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(undefined);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser cannot create an image canvas.");
      if (format === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) => value ? resolve(value) : reject(new Error("The browser could not encode this image.")),
          format,
          format === "image/png" ? undefined : quality / 100,
        ),
      );
      setResult({ blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The image could not be re-encoded.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result || !file) return;
    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = outputName(file.name, format);
    anchor.click();
  }

  return (
    <div className="metadata-tool">
      <section className="metadata-methods" aria-label="Metadata removal methods">
        <article>
          <span>Method 1</span>
          <h2>Re-encode the image</h2>
          <p>Use the tool below to decode the visible pixels and write them into a new image container.</p>
        </article>
        <article>
          <span>Method 2</span>
          <h2>Screen-record the media</h2>
          <p>
            Play or display your authorized media full-screen, make a new screen
            recording, then trim the capture. The recording is a newly encoded
            file and does not inherit the source file’s embedded metadata.
          </p>
          <a href="https://x.com/guillemcraft/status/2090831543593734597" rel="noreferrer" target="_blank">View referenced method ↗</a>
        </article>
      </section>
      <section className="metadata-dropzone">
        <p className="eyebrow">LOCAL IMAGE UTILITY</p>
        <h2>Decode pixels. Write a clean file.</h2>
        <p>
          Your image stays in this browser. Re-encoding writes a new pixel file
          without carrying EXIF, IPTC, XMP, GPS, camera, or editor metadata from
          the source container.
        </p>
        <label className="metadata-file">
          <span>{file ? file.name : "Choose a JPEG, PNG, or WebP image"}</span>
          <input accept="image/jpeg,image/png,image/webp" onChange={chooseFile} type="file" />
        </label>
        {file && <small>Input: {bytes(file.size)} · {file.type || "unknown type"}</small>}
      </section>

      <section className="metadata-controls">
        <label>
          Output format
          <select value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)}>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </label>
        {format !== "image/png" && (
          <label>
            Quality · {quality}%
            <input min="50" max="100" type="range" value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
          </label>
        )}
        <label className="metadata-confirm">
          <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
          <span>I own this media or have permission to process it.</span>
        </label>
        <button className="primary-action" disabled={!file || !confirmed || busy} onClick={() => void reencode()} type="button">
          {busy ? "Re-encoding…" : "Re-encode image"}
        </button>
        {error && <p className="workspace-notice" role="alert">{error}</p>}
      </section>

      {result && file && (
        <section className="metadata-result" aria-live="polite">
          {/* Blob URL is generated locally and cannot use the Next image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Re-encoded preview" src={result.url} />
          <div>
            <p className="eyebrow">READY TO DOWNLOAD</p>
            <h2>{outputName(file.name, format)}</h2>
            <p>{result.width} × {result.height} · {bytes(result.blob.size)}</p>
            <button className="primary-action" onClick={download} type="button">Download clean copy</button>
          </div>
        </section>
      )}

      <aside className="metadata-safety">
        <strong>What this does—and does not do</strong>
        <p>
          It removes container metadata by rebuilding the image from decoded pixels.
          It does not remove visible watermarks, prove originality, guarantee anonymity,
          or bypass platform similarity and provenance systems. Keep the original when
          authorship, licensing, or evidence records matter. Screen recording can also
          reduce quality, change color, capture notifications, or include visible private data;
          use Do Not Disturb and inspect the result before publishing.
        </p>
      </aside>
    </div>
  );
}
