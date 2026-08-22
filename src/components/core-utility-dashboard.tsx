"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type UtilityRecord = { id: string; module: string; record_type: string; external_id: string; name: string; status: string; source_repo: string; payload: Record<string, unknown> };

export function CoreUtilityDashboard({ projectId, module }: { projectId: string; module: "aclienti" | "accman" }) {
  const [records, setRecords] = useState<UtilityRecord[]>([]);
  const [status, setStatus] = useState("Loading project records...");
  const [recordType, setRecordType] = useState(module === "aclienti" ? "signal" : "account");
  const [score, setScore] = useState(0);

  async function load() {
    const response = await fetch(`/api/projects/${projectId}/modules`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Could not load module records.");
    setRecords((payload.records ?? []).filter((record: UtilityRecord) => record.module === module));
    setStatus("");
  }

  // Load project-owned records when this utility opens.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load().catch((error) => setStatus(error.message)); }, [projectId, module]);

  const counts = useMemo(() => records.reduce<Record<string, number>>((result, record) => ({ ...result, [record.record_type]: (result[record.record_type] ?? 0) + 1 }), {}), [records]);

  function calculateScore(form: HTMLFormElement | null) {
    if (!form) return;
    const values = ["pain", "fit", "timing", "reach", "evidence"].map((name) => Number(new FormData(form).get(name) ?? 0));
    setScore(Math.round((values[0] / 5) * 25 + (values[1] / 5) * 25 + (values[2] / 5) * 20 + (values[3] / 5) * 15 + (values[4] / 5) * 15));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const name = String(values.name || "New module record");
    const payload = module === "aclienti" ? { pain: values.painText, sourceTitle: values.sourceTitle, sourceUrl: values.sourceUrl, scores: { pain: Number(values.pain), fit: Number(values.fit), timing: Number(values.timing), reach: Number(values.reach), evidence: Number(values.evidence) }, qualificationScore: score } : { platform: values.platform, notes: values.notes, status: values.status };
    setStatus("Saving to the authenticated project...");
    const response = await fetch(`/api/projects/${projectId}/modules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upsert_record", module, recordType, externalId: `${recordType}-${Date.now()}`, name, status: module === "aclienti" ? (score >= 65 ? "qualified" : "new") : String(values.status || "idea"), sourceRepo: module === "aclienti" ? "DistroNow AClienti utility" : "DistroNow accman utility", payload }) });
    const result = await response.json();
    if (!response.ok) { setStatus(result.error ?? "Could not save record."); return; }
    form.reset();
    await load();
    setStatus("Saved to the shared project.");
  }

  return (
    <section className="core-utility-dashboard">
      <div className="core-utility-header"><div><p className="eyebrow">Project-owned utility</p><h2>{module === "aclienti" ? "Find better customer-backed content opportunities." : "Run the account and content planning loop."}</h2><p>{module === "aclienti" ? "Capture public evidence, score it, and turn qualified signals into briefs." : "Keep accounts, niches, formats, trends, prompts, and plans in one authenticated workspace."}</p></div><span>{status}</span></div>
      <div className="core-utility-stats">{Object.entries(counts).map(([type, count]) => <span key={type}><strong>{count}</strong>{type.replaceAll("_", " ")}</span>)}<span><strong>{records.length}</strong> total records</span></div>
      <form className="core-utility-form" onSubmit={submit}>
        <div className="operation-panel-head"><span>{module === "aclienti" ? "AClienti" : "accman"}</span><small>Shared project record</small></div>
        <div className="core-utility-form-row"><select value={recordType} onChange={(event) => setRecordType(event.target.value)}>{module === "aclienti" ? <><option value="signal">Public signal</option><option value="brief">Content brief</option><option value="research_lens">Research lens</option></> : <><option value="account">Social account</option><option value="niche">Niche</option><option value="format">Content format</option><option value="trend">Trend inbox</option><option value="plan">Content plan</option><option value="prompt">Prompt</option></>}</select><input name="name" placeholder={module === "aclienti" ? "Signal or brief name" : "Account, niche, format, trend, plan, or prompt"} required /></div>
        {module === "aclienti" ? <><textarea name="painText" placeholder="What did the customer actually say or do?" required /><div className="core-utility-form-row"><input name="sourceTitle" placeholder="Source title" /><input name="sourceUrl" placeholder="https://source.example" type="url" /></div><div className="score-inputs">{["pain", "fit", "timing", "reach", "evidence"].map((name) => <label key={name}>{name}<input defaultValue="4" max="5" min="0" name={name} onChange={(event) => calculateScore(event.currentTarget.form)} type="number" /></label>)}</div><strong className="score-result">Qualification score: {score}/100</strong></> : <><div className="core-utility-form-row"><input name="platform" placeholder="Platform or category" /><select name="status" defaultValue="idea"><option value="idea">Idea</option><option value="active">Active</option><option value="watching">Watching</option><option value="planned">Planned</option><option value="ready">Ready</option><option value="posted">Posted</option></select></div><textarea name="notes" placeholder="Notes, format structure, trend observation, prompt, or plan details" /></>}
        <button className="primary-action" type="submit">Save {module === "aclienti" ? "customer intelligence" : "account-manager record"} →</button>
      </form>
      <div className="core-utility-record-list">{records.slice(0, 12).map((record) => <article key={record.id}><span>{record.record_type.replaceAll("_", " ")} · {record.status}</span><strong>{record.name}</strong><small>{record.source_repo}</small></article>)}</div>
    </section>
  );
}
