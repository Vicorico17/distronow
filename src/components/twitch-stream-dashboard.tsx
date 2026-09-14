"use client";

import { useEffect, useMemo, useState } from "react";

type ModuleRecord = { id: string; module: string; record_type: string; name: string; status: string };
const scenes = ["Main stream", "Just chatting", "Highlight replay", "Be right back"];
const starters = [
  { name: "Nova", role: "Co-host", status: "watching", note: "Keeps chat warm and reacts to moments." },
  { name: "Scout", role: "Clip hunter", status: "standby", note: "Finds and timestamps highlights." },
];

export function TwitchStreamDashboard({ projectId }: { projectId: string }) {
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [scene, setScene] = useState(scenes[0]);
  const [panel, setPanel] = useState<"agents" | "automations">("agents");
  const [live, setLive] = useState(false);
  const [effect, setEffect] = useState(true);
  const [destinations, setDestinations] = useState(["Twitch"]);
  const [message, setMessage] = useState("Loading project agents…");

  async function load() {
    const response = await fetch(`/api/projects/${projectId}/modules`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Could not load stream records.");
    setRecords((data.records ?? []).filter((record: ModuleRecord) => record.module === "streamwin"));
    setMessage("");
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load().catch((error) => setMessage(error.message)); }, [projectId]);
  const agents = useMemo(() => {
    const saved = records.filter((record) => record.record_type === "vision_agent");
    return saved.length ? saved.map((record) => ({ name: record.name, role: "Vision agent", status: record.status, note: "Saved to this DistroNow project." })) : starters;
  }, [records]);
  function toggleDestination(name: string) { setDestinations((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]); }
  async function saveAgent() {
    setMessage("Saving agent…");
    const response = await fetch(`/api/projects/${projectId}/modules`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upsert_record", module: "streamwin", recordType: "vision_agent", externalId: `agent-${Date.now()}`, name: `Agent ${agents.length + 1}`, status: "standby", sourceRepo: "TTVfans + Streamwin unified app", payload: { role: "Twitch stream assistant", scene, destinations } }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "Could not save agent."); return; }
    await load(); setMessage("Agent added to this project.");
  }

  return <section className="twitch-studio" id="module-tool">
    <header className="twitch-studio-head"><div><p className="eyebrow">Twitch stream users</p><h2>Your live control room</h2><p>Run the show and give your stream a second set of eyes from one DistroNow app.</p></div><button className={live ? "stream-live-button active" : "stream-live-button"} onClick={() => setLive(!live)}><i />{live ? "End stream" : "Go live"}</button></header>
    <div className="twitch-studio-grid"><div>
      <div className={effect ? "stream-preview effect-on" : "stream-preview"}><div className="stream-preview-top"><span><i />{live ? "LIVE" : "PREVIEW"}</span><small>1080p · 60fps</small></div><div className="stream-avatar">D</div><div className="stream-caption"><b>{scene}</b><span>Vision agents are {live ? "watching now" : "ready"}</span></div><div className="stream-thought">✦ Clutch moment detected · clip marked</div></div>
      <div className="stream-controls"><button onClick={() => setEffect(!effect)} className={effect ? "selected" : ""}>✦ AI effect</button>{["Twitch", "YouTube", "TikTok LIVE"].map((name) => <button key={name} className={destinations.includes(name) ? "selected" : ""} onClick={() => toggleDestination(name)}>{name}</button>)}</div>
      <div className="studio-scenes">{scenes.map((name, index) => <button className={scene === name ? "selected" : ""} key={name} onClick={() => setScene(name)}><span>0{index + 1}</span><b>{name}</b><small>{index === 2 ? "Agent-created moments" : "Camera + overlays"}</small></button>)}</div>
    </div><aside className="stream-agent-panel">
      <div className="stream-panel-tabs"><button className={panel === "agents" ? "active" : ""} onClick={() => setPanel("agents")}>Agents</button><button className={panel === "automations" ? "active" : ""} onClick={() => setPanel("automations")}>Automations</button></div>
      {panel === "agents" ? <><div className="agent-list">{agents.map((agent) => <article key={agent.name}><span className="agent-glyph">✦</span><div><b>{agent.name}</b><small>{agent.role} · {agent.status}</small><p>{agent.note}</p></div><i className={agent.status === "watching" ? "online" : ""} /></article>)}</div><button className="agent-add-button" onClick={saveAgent}>+ Build an agent</button></> : <div className="automation-list-unified">{["React to a clutch play", "Mark potential highlights", "Welcome returning viewers", "Create clip on win screen"].map((item, index) => <label key={item}><input type="checkbox" defaultChecked={index < 3} /><span><b>{item}</b><small>{index === 1 ? "Scout · confidence threshold 85%" : "Nova · safe chat action"}</small></span></label>)}</div>}
      <div className="stream-activity"><span>Live activity</span><p><i /> Nova is ready to join the conversation.</p><p><i /> Scout is watching for shareable moments.</p></div><small className="stream-status-message">{message}</small>
    </aside></div>
  </section>;
}
