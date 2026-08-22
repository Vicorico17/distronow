"use client";

import { useEffect, useMemo, useState } from "react";
import { CORE_MARKETING_MODULES } from "@/lib/module-catalog";

type ModuleRecord = { id: string; module: string; record_type: string; name: string; status: string; source_repo: string };

export function ModuleMigrationDashboard({ projectId }: { projectId: string }) {
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [status, setStatus] = useState("Loading unified records...");
  const counts = useMemo(() => new Map(CORE_MARKETING_MODULES.map((module) => [module.slug, records.filter((record) => record.module === module.slug).length])), [records]);

  async function load() {
    const response = await fetch(`/api/projects/${projectId}/modules`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Could not load module records.");
    setRecords(payload.records ?? []);
    setStatus("");
  }

  // The module page loads project-owned records when it opens.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load().catch((error) => setStatus(error.message)); }, [projectId]);

  async function importAll() {
    setStatus("Importing source records into this project...");
    const response = await fetch(`/api/projects/${projectId}/modules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import_all" }) });
    const payload = await response.json();
    if (!response.ok) { setStatus(payload.error ?? "Could not import module records."); return; }
    await load();
    setStatus(`Imported ${payload.imported} source records into the shared project.`);
  }

  return (
    <section className="module-migration-dashboard">
      <div className="module-migration-header">
        <div><p className="eyebrow">One login / one project / shared records</p><h2>Bring every module under DistroNow ownership.</h2><p>All source prototypes used browser-local state. DistroNow is now the shared authenticated workspace; this import turns their core records into project-owned data.</p></div>
        <button className="primary-action" onClick={importAll} type="button">Import all source records →</button>
      </div>
      <span className="operations-status">{status}</span>
      <div className="module-migration-grid">
        {CORE_MARKETING_MODULES.map((module) => <article className="module-migration-card" key={module.slug}><div><strong>{module.name}</strong><small>{module.source}</small></div><b>{counts.get(module.slug) ?? 0}</b><span>records imported</span></article>)}
      </div>
      <div className="module-migration-records">{records.slice(0, 18).map((record) => <article key={record.id}><span>{record.module}</span><strong>{record.name}</strong><small>{record.record_type} · {record.status} · {record.source_repo}</small></article>)}</div>
    </section>
  );
}
