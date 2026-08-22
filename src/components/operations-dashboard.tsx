"use client";

import { FormEvent, useEffect, useState } from "react";

type OperationsDashboardProps = { projectId: string };
type Signal = { id: string; title: string; evidence: string; source_name?: string | null; fit_score: number; status: string };
type Prospect = { id: string; company_name: string; contact_name?: string | null; contact_role?: string | null; fit_score: number; status: string };
type Operations = { strategies: unknown[]; signals: Signal[]; profiles: unknown[]; accounts: unknown[]; posts: unknown[]; campaigns: unknown[]; prospects: Prospect[]; messages: unknown[]; tasks: unknown[] };

const emptyOperations: Operations = { strategies: [], signals: [], profiles: [], accounts: [], posts: [], campaigns: [], prospects: [], messages: [], tasks: [] };

export function OperationsDashboard({ projectId }: OperationsDashboardProps) {
  const [data, setData] = useState<Operations>(emptyOperations);
  const [status, setStatus] = useState("Loading shared operations...");
  const [strategyType, setStrategyType] = useState("product_information");

  async function load() {
    const response = await fetch(`/api/projects/${projectId}/operations`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Could not load operations.");
    setData(payload);
    setStatus("");
  }

  // The request is intentionally started when the project module opens.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load().catch((error) => setStatus(error.message)); }, [projectId]);

  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = Object.fromEntries(form.entries());
    const payload = action === "save_strategy"
      ? { action, documentType: strategyType, title: value.title, content: value.content, status: value.status }
      : action === "add_signal"
        ? { action, title: value.title, evidence: value.evidence, sourceUrl: value.sourceUrl, sourceName: value.sourceName, fitScore: Number(value.fitScore), painScore: Number(value.painScore), timingScore: Number(value.timingScore), reachabilityScore: Number(value.reachabilityScore), evidenceScore: Number(value.evidenceScore) }
      : action === "add_prospect"
          ? { action, companyName: value.companyName, domain: value.domain, contactName: value.contactName, contactRole: value.contactRole, email: value.email, fitScore: Number(value.fitScore), sourceUrl: value.sourceUrl }
          : action === "add_account"
            ? { action, platform: value.platform, handle: value.handle, displayName: value.displayName, followerCount: Number(value.followerCount || 0) }
            : action === "schedule_post"
              ? { action, title: value.title, platform: value.platform, scheduledFor: value.scheduledFor, notes: value.notes }
              : action === "add_metric"
                ? { action, platform: value.platform, impressions: Number(value.impressions), engagements: Number(value.engagements), clicks: Number(value.clicks), conversions: Number(value.conversions) }
          : { action, category: value.category, title: value.title, description: value.description, priority: value.priority };
    setStatus("Saving...");
    const response = await fetch(`/api/projects/${projectId}/operations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setStatus(result.error ?? "Could not save."); return; }
    event.currentTarget.reset();
    await load();
    setStatus("Saved.");
  }

  return (
    <section className="operations-dashboard">
      <div className="operations-header"><div><p className="eyebrow">Shared operating records</p><h2>Make the next decision with evidence.</h2><p>These records connect customer research, strategy, acquisition, and account operations.</p></div><span className="operations-status">{status}</span></div>
      <div className="operations-stats"><div><strong>{data.strategies.length}</strong><span>Strategy documents</span></div><div><strong>{data.signals.length}</strong><span>Customer signals</span></div><div><strong>{data.prospects.length}</strong><span>Prospects</span></div><div><strong>{data.tasks.length}</strong><span>Open tasks</span></div></div>
      <div className="operations-grid">
        <form className="operation-panel" onSubmit={(event) => submit(event, "save_strategy")}><div className="operation-panel-head"><span>DistroNow</span><small>Strategy Library</small></div><h3>Confirm the strategy before creating.</h3><select value={strategyType} onChange={(event) => setStrategyType(event.target.value)}><option value="product_information">Product information</option><option value="marketing_strategy">Marketing strategy</option><option value="competitor_analysis">Competitor analysis</option><option value="brand_voice">Brand voice</option><option value="content_strategy">Content strategy</option></select><input name="title" placeholder="Document title" required /><textarea name="content" placeholder="Write or paste the decision this document should preserve..." required /><select name="status" defaultValue="review"><option value="draft">Draft</option><option value="review">Ready for review</option><option value="confirmed">Confirmed</option></select><button className="primary-action" type="submit">Save strategy decision</button></form>
        <form className="operation-panel" onSubmit={(event) => submit(event, "add_signal")}><div className="operation-panel-head"><span>AClienti</span><small>Customer Intelligence</small></div><h3>Capture a customer signal.</h3><input name="title" placeholder="Signal title" required /><textarea name="evidence" placeholder="What did the customer actually say or do?" required /><div className="operation-form-row"><input name="sourceName" placeholder="Source / community" /><input name="sourceUrl" placeholder="https://source.example" type="url" /></div><div className="operation-form-row"><label>Fit <input name="fitScore" type="number" min="0" max="5" defaultValue="4" /></label><label>Pain <input name="painScore" type="number" min="0" max="5" defaultValue="4" /></label><label>Evidence <input name="evidenceScore" type="number" min="0" max="5" defaultValue="4" /></label></div><button className="primary-action" type="submit">Save customer signal</button></form>
        <form className="operation-panel" onSubmit={(event) => submit(event, "add_prospect")}><div className="operation-panel-head"><span>AutoGTM</span><small>Customer Acquisition</small></div><h3>Review a prospect before outreach.</h3><input name="companyName" placeholder="Company name" required /><div className="operation-form-row"><input name="contactName" placeholder="Contact name" /><input name="contactRole" placeholder="Role" /></div><div className="operation-form-row"><input name="email" placeholder="Email" type="email" /><input name="domain" placeholder="company.com" /></div><div className="operation-form-row"><label>Fit score <input name="fitScore" type="number" min="0" max="100" defaultValue="70" /></label><input name="sourceUrl" placeholder="Evidence URL" type="url" /></div><button className="primary-action" type="submit">Add prospect for review</button></form>
        <form className="operation-panel" onSubmit={(event) => submit(event, "create_task")}><div className="operation-panel-head"><span>Agent Feed</span><small>Next actions</small></div><h3>Turn a decision into a trackable task.</h3><select name="category" defaultValue="DistroNow"><option>DistroNow</option><option>AClienti</option><option>accman</option><option>AutoGTM</option><option>ClipRO</option><option>AutoArt</option><option>Streamwin</option></select><input name="title" placeholder="Next action" required /><textarea name="description" placeholder="What needs to happen and why?" /><select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select><button className="primary-action" type="submit">Add next action</button></form>
        <form className="operation-panel" onSubmit={(event) => submit(event, "add_account")}><div className="operation-panel-head"><span>accman</span><small>Account Manager</small></div><h3>Add a channel to the plan.</h3><div className="operation-form-row"><select name="platform" defaultValue="Instagram"><option>Instagram</option><option>TikTok</option><option>YouTube</option><option>LinkedIn</option><option>X</option><option>Facebook</option></select><input name="handle" placeholder="@brand" required /></div><div className="operation-form-row"><input name="displayName" placeholder="Display name" /><input name="followerCount" type="number" min="0" placeholder="Followers" /></div><button className="primary-action" type="submit">Add account plan</button></form>
        <form className="operation-panel" onSubmit={(event) => submit(event, "schedule_post")}><div className="operation-panel-head"><span>accman</span><small>Publishing queue</small></div><h3>Move approved work into distribution.</h3><input name="title" placeholder="Post or campaign title" required /><div className="operation-form-row"><select name="platform" defaultValue="Instagram"><option>Instagram</option><option>TikTok</option><option>YouTube</option><option>LinkedIn</option><option>X</option></select><input name="scheduledFor" type="datetime-local" /></div><textarea name="notes" placeholder="Account, CTA, or publishing notes" /><button className="primary-action" type="submit">Add to queue</button></form>
        <form className="operation-panel" onSubmit={(event) => submit(event, "add_metric")}><div className="operation-panel-head"><span>Analytics</span><small>Performance loop</small></div><h3>Record what happened.</h3><select name="platform" defaultValue="Instagram"><option>Instagram</option><option>TikTok</option><option>YouTube</option><option>LinkedIn</option><option>X</option></select><div className="operation-form-row"><input name="impressions" type="number" min="0" placeholder="Impressions" /><input name="engagements" type="number" min="0" placeholder="Engagements" /></div><div className="operation-form-row"><input name="clicks" type="number" min="0" placeholder="Clicks" /><input name="conversions" type="number" min="0" placeholder="Conversions" /></div><button className="primary-action" type="submit">Save performance data</button></form>
      </div>
      <div className="operations-lists"><section><div className="operation-list-head"><h3>Customer signals</h3><span>{data.signals.length}</span></div>{data.signals.slice(0, 5).map((signal) => <article className="operation-list-item" key={signal.id}><strong>{signal.title}</strong><p>{signal.evidence}</p><small>{signal.source_name ?? "Manual"} · Fit {signal.fit_score}/5 · {signal.status}</small></article>)}</section><section><div className="operation-list-head"><h3>Prospects</h3><span>{data.prospects.length}</span></div>{data.prospects.slice(0, 5).map((prospect) => <article className="operation-list-item" key={prospect.id}><strong>{prospect.company_name}</strong><p>{prospect.contact_name ?? "Contact not yet assigned"} {prospect.contact_role ? `· ${prospect.contact_role}` : ""}</p><small>Fit {prospect.fit_score}/100 · {prospect.status}</small></article>)}</section></div>
    </section>
  );
}
