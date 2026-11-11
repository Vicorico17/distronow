"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./loro-dashboard.module.css";

type LoroRecord = {
  id: string;
  module: string;
  record_type: string;
  external_id: string;
  name: string;
  status: string;
  payload: Record<string, string>;
};

export function LoroDashboard({ projectId }: { projectId: string }) {
  const [records, setRecords] = useState<LoroRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const endpoint = `/api/projects/${encodeURIComponent(projectId)}/modules`;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load LORO.");
        setRecords((data.records ?? []).filter((record: LoroRecord) => record.module === "loro"));
        setError("");
        setLoaded(true);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load LORO.");
      }
    }
    void load();
    return () => controller.abort();
  }, [endpoint, retry]);

  const creators = records.filter((record) => record.record_type === "creator");
  const campaigns = records.filter((record) => record.record_type === "campaign");
  const selected = campaigns.filter((record) => record.status === "selected").length;

  async function save(record: Omit<LoroRecord, "id" | "module">, success: string) {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert_record", module: "loro", recordType: record.record_type, externalId: record.external_id, name: record.name, status: record.status, sourceRepo: "Vicorico17/LORO", payload: record.payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save changes.");
      const saved: LoroRecord | undefined = data.records?.[0];
      if (!saved) throw new Error("No saved record returned. Reload before trying again.");
      setRecords((current) => [...current.filter((item) => item.id !== saved.id), saved]);
      setMessage(success);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save changes.");
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>, type: "creator" | "campaign") {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form).entries());
    const name = String(fields.name ?? "").trim();
    if (!name) { setError("Enter a name."); return; }
    const payload = Object.fromEntries(Object.entries(fields).filter(([key]) => key !== "name").map(([key, value]) => [key, String(value).trim()]));
    if (type === "campaign" && !creators.some((creator) => creator.external_id === payload.creatorId)) {
      setError("Choose a saved creator."); return;
    }
    if (await save({ record_type: type, external_id: crypto.randomUUID(), name, status: type === "creator" ? "unverified" : "open", payload }, type === "creator" ? "Creator saved." : "Campaign saved.")) form.reset();
  }

  function exportCampaigns() {
    const blob = new Blob([JSON.stringify({ projectId, exportedAt: new Date().toISOString(), creators, campaigns, note: "Workspace records; selections and rights notes are not verified consent or executed licenses." }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `loro-${projectId}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className={styles.dashboard} id="module-tool" aria-label="LORO creator campaigns">
    <header className={styles.heading}><div><p className="eyebrow">LORO / Creator workspace</p><h2>Create with consent.</h2><p>{creators.length} creators · {campaigns.length} campaigns · {selected} selected</p></div><button disabled={!loaded || busy || !campaigns.length} onClick={exportCampaigns}>Export briefs</button></header>
    <p className={styles.notice}>Record campaign plans and usage-rights references here. Selections are workspace records, not verified creator consent. AI generation, licensing payments, and identity verification are not connected.</p>
    <p role="status" aria-live="polite">{loaded ? message : error ? "Workspace unavailable." : "Loading creator campaigns…"}</p>
    {error && <p role="alert">{error} {!loaded && <button onClick={() => setRetry((value) => value + 1)}>Retry loading</button>}</p>}
    <div className={styles.grid}>
      <form className={styles.card} onSubmit={(event) => void submit(event, "creator")}>
        <h3>Add creator</h3>
        <fieldset disabled={!loaded || busy}>
          <label>Name<input name="name" required maxLength={120} /></label>
          <label>Niche<input name="niche" required maxLength={200} placeholder="Wellness, travel, fitness…" /></label>
          <label>Usage-rights notes<textarea name="rights" required maxLength={4000} placeholder="Channels, territories, duration, exclusions…" /></label>
          <label>Consent reference<input name="consentReference" maxLength={1000} placeholder="Agreement reference or document URL" /></label>
          <button type="submit">Save creator</button>
        </fieldset>
      </form>
      <form className={styles.card} onSubmit={(event) => void submit(event, "campaign")}>
        <h3>New campaign</h3>
        <fieldset disabled={!loaded || busy || !creators.length}>
          <label>Campaign name<input name="name" required maxLength={120} /></label>
          <label>Creator<select name="creatorId" required defaultValue=""><option value="" disabled>Choose creator</option>{creators.map((creator) => <option key={creator.id} value={creator.external_id}>{creator.name}</option>)}</select></label>
          <label>Creative brief<textarea name="brief" required maxLength={4000} /></label>
          <label>Channels<input name="channels" required maxLength={200} placeholder="Instagram, TikTok…" /></label>
          <label>Proposed creator share (%)<input name="share" type="number" min="0" max="100" step="0.1" required /></label>
          <button type="submit">Save campaign</button>
        </fieldset>
        {loaded && !creators.length && <p>Add a creator to start a campaign.</p>}
      </form>
    </div>
    <h3>Creator roster</h3>
    {loaded && !creators.length && <p>No creators yet. Add your first profile above.</p>}
    <div className={styles.grid}>{creators.map((creator) => <article className={styles.card} key={creator.id}><h4>{creator.name}</h4><p>{creator.payload.niche}</p><p><strong>Usage scope:</strong> {creator.payload.rights}</p><p><strong>Consent reference:</strong> {creator.payload.consentReference || "Not recorded"}</p><small>Verification pending</small></article>)}</div>
    <h3>Campaign picks</h3>
    <p>Select work to prepare. You can remove a selection before marking the campaign started.</p>
    {loaded && !campaigns.length && <p>No campaigns yet. Save a brief to begin.</p>}
    <div className={styles.grid}>{campaigns.map((campaign) => <article className={styles.card} key={campaign.id}>
      <small>{campaign.status === "selected" ? "Selected" : campaign.status === "started" ? "Started" : "Open"}</small>
      <h4>{campaign.name}</h4><p>{campaign.payload.brief}</p>
      <p>{creators.find((creator) => creator.external_id === campaign.payload.creatorId)?.name || "Unknown creator"} · {campaign.payload.channels}</p>
      <p>{campaign.payload.share}% proposed creator share</p>
      <div className={styles.actions}>
        <button disabled={busy || campaign.status === "started"} aria-pressed={campaign.status === "selected"} onClick={() => void save({ ...campaign, status: campaign.status === "selected" ? "open" : "selected" }, campaign.status === "selected" ? "Selection removed." : "Campaign selected.")}>{campaign.status === "selected" ? "Remove selection" : campaign.status === "started" ? "Campaign started" : "Pick campaign"}</button>
        {campaign.status === "selected" && <button disabled={busy} onClick={() => void save({ ...campaign, status: "started" }, "Campaign marked started. No content was published.")}>Mark started</button>}
      </div>
    </article>)}</div>
  </section>;
}
