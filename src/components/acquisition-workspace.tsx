"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  actionSchema,
  applyAction,
  demoAcquisition,
  emptyAcquisition,
  exportCsv,
  funnel,
  logEvent,
  stateSchema,
  type AcquisitionAction,
  type AcquisitionState,
  type BrandContext,
  type Prospect,
} from "@/lib/acquisition";

type Connections = {
  discovery: boolean;
  drafting: boolean;
  sending: boolean;
  sender: string;
  calendar: "manual";
};
const disconnected: Connections = {
  discovery: false,
  drafting: false,
  sending: false,
  sender: "",
  calendar: "manual",
};
const tabs = [
  "Overview",
  "Campaigns",
  "Buyers",
  "Outreach",
  "Results",
  "Connections",
] as const;
const demoKey = "distronow:acquisition-demo:v1";
const LEAD_SOURCES = [
  {
    slug: "treg",
    name: "Treg routed search",
    note: "live connector",
    detail:
      "Routes discovery, work-email finding, and verification across available people-data providers.",
  },
  {
    slug: "getleads",
    name: "GetLeads",
    note: "strong all rounder",
    detail: "Primary source candidate for broad company and contact discovery.",
  },
  {
    slug: "quickenrich",
    name: "QuickEnrich",
    note: "great for US, limited elsewhere",
    detail:
      "Best suited to US focused enrichment, supplemented in other markets.",
  },
  {
    slug: "blitz",
    name: "Blitz API",
    note: "adds about 10% extra",
    detail: "Nice to have for incremental coverage after the primary search.",
  },
  {
    slug: "moltsets",
    name: "MoltSets",
    note: "waterfall enrichment on crack",
    detail:
      "Candidate waterfall for cascading lookups when the first source has no answer.",
  },
] as const;
function leadSourceName(slug: string) {
  return (
    LEAD_SOURCES.find((source) => source.slug === slug)?.name ?? "Treg routed search"
  );
}
function download(name: string, text: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function nice(value: string) {
  return value.replaceAll("_", " ");
}
function date(value: string) {
  return value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
}

export function AcquisitionWorkspace({
  projectId,
  brand,
  approvedContent = 0,
  productName = "Leads Finder",
  productSubtitle = "Find buyers. Start conversations. Track what converts.",
}: {
  projectId?: string;
  brand: BrandContext;
  approvedContent?: number;
  productName?: string;
  productSubtitle?: string;
}) {
  const demo = !projectId;
  const [state, setState] = useState<AcquisitionState>(emptyAcquisition);
  const [version, setVersion] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connections>(disconnected);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [campaignId, setCampaignId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showCampaign, setShowCampaign] = useState(false);
  const [showBuyer, setShowBuyer] = useState(false);

  async function load() {
    setError("");
    if (demo) {
      const raw = localStorage.getItem(demoKey);
      let next: AcquisitionState;
      try {
        next = raw ? stateSchema.parse(JSON.parse(raw)) : demoAcquisition();
      } catch {
        next = demoAcquisition();
      }
      setState(next);
      setLoaded(true);
      return;
    }
    const response = await fetch(`/api/projects/${projectId}/acquisition`, {
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.error || "Could not load acquisition.");
    setState(stateSchema.parse(payload.state));
    setVersion(payload.version ?? null);
    setConnections(payload.connections);
    setLoaded(true);
    if (payload.status === "busy")
      setNotice(
        "A provider operation is running or was interrupted. Refresh shortly; uncertain sends require mailbox reconciliation.",
      );
  }
  useEffect(() => {
    // Load saved project data once when the project changes; never substitute demo records for a failed live request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load().catch((e) => setError(e.message));
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(unchecked: AcquisitionAction): Promise<boolean> {
    if (busy || !loaded) return false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const action = actionSchema.parse(unchecked);
      if (demo) {
        let next = structuredClone(state);
        const p =
          "prospectId" in action
            ? next.prospects.find((item) => item.id === action.prospectId)
            : undefined;
        if (action.action === "discover")
          throw new Error(
            "Connect a real project to discover buyers. Demo buyers are fictional.",
          );
        else if (action.action === "enrich" && p) {
          p.emailStatus = "valid";
          logEvent(
            next,
            p.campaignId,
            p.id,
            "email_verified",
            "Simulated verification",
            "demo",
          );
        } else if (action.action === "send" && p) {
          const { assertSendable } = await import("@/lib/acquisition");
          assertSendable(next, p);
          p.draftStatus = "sent";
          p.status = "contacted";
          logEvent(
            next,
            p.campaignId,
            p.id,
            "email_sent",
            "Simulated send. No email left this browser.",
            "demo",
          );
        } else next = applyAction(next, action, brand);
        localStorage.setItem(demoKey, JSON.stringify(next));
        setState(next);
        setNotice("Demo saved in this browser. No external action was taken.");
      } else {
        const response = await fetch(`/api/projects/${projectId}/acquisition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...action, version }),
        });
        const payload = await response.json();
        if (payload.state) {
          setState(stateSchema.parse(payload.state));
          setVersion(payload.version ?? null);
          setConnections(payload.connections);
        }
        if (!response.ok) throw new Error(payload.error || "Action failed.");
        setNotice(
          action.action === "send"
            ? "Mailbox accepted the message. Delivery and replies are tracked separately."
            : "Saved.",
        );
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const scoped = campaignId
    ? {
        ...state,
        campaigns: state.campaigns.filter((c) => c.id === campaignId),
        prospects: state.prospects.filter((p) => p.campaignId === campaignId),
        events: state.events.filter((e) => e.campaignId === campaignId),
      }
    : state;
  const metrics = funnel(state, campaignId || undefined);
  const buyers = scoped.prospects.filter(
    (p) =>
      `${p.name} ${p.company} ${p.role}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "all" || p.status === filter),
  );
  const selected = state.prospects.find((p) => p.id === selectedId);
  const pending = scoped.prospects.filter(
    (p) => p.status === "candidate" || p.draftStatus === "draft",
  );
  const failureEvents = scoped.events.filter(
    (e) => e.type === "operation_failed",
  );
  const replyRate = metrics.sent
    ? Math.round((metrics.positive / metrics.sent) * 100)
    : 0;
  const base = projectId ? `/projects/${projectId}` : "";

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const value = {
      name: String(values.get("name")),
      offer: String(values.get("offer")),
      audience: String(values.get("audience")),
      roles: String(values.get("roles")),
      countries: String(values.get("countries")).toUpperCase(),
      exclusions: String(values.get("exclusions")),
      bookingUrl: String(values.get("bookingUrl")),
      dailyLimit: Number(values.get("dailyLimit")),
      budget: Number(values.get("budget")),
      leadSource: String(values.get("leadSource")) as
        "treg" | "getleads" | "quickenrich" | "blitz" | "moltsets",
    };
    if (await run({ action: "create_campaign", value })) {
      form.reset();
      setShowCampaign(false);
      setTab("Campaigns");
    }
  }
  async function createBuyer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const value = {
      campaignId: String(values.get("campaignId")),
      company: String(values.get("company")),
      name: String(values.get("name")),
      role: String(values.get("role")),
      domain: String(values.get("domain")),
      email: String(values.get("email")),
      sourceUrl: String(values.get("sourceUrl")),
      evidence: String(values.get("evidence")),
      fit: Number(values.get("fit")),
    };
    if (await run({ action: "add_prospect", value })) {
      form.reset();
      setShowBuyer(false);
      setTab("Buyers");
    }
  }
  return (
    <main className="agency-app">
      <aside className="agency-sidebar">
        <Link
          className="agency-logo"
          href={projectId ? `${base}/workspace` : "/"}
        >
          <span>d.</span>DistroNow
        </Link>
        <div className="agency-brand">
          <small>SPECIALIST PRODUCT</small>
          <strong>{brand.name}</strong>
          <span>
            {productName} · {demo ? "Demo workspace" : "Project workspace"}
          </span>
        </div>
        <nav aria-label="Acquisition navigation">
          {tabs.map((item, i) => (
            <button
              type="button"
              key={item}
              aria-current={tab === item ? "page" : undefined}
              className={tab === item ? "is-current" : ""}
              onClick={() => {
                setTab(item);
                setSelectedId("");
              }}
            >
              <span>0{i + 1}</span>
              {item}
              {item === "Outreach" && pending.length > 0 ? (
                <b>{pending.length}</b>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="agency-sidebar-bottom">
          {projectId ? (
            <>
              <Link href={`${base}/assets`}>Content studio ↗</Link>
              <Link href={`${base}/operations`}>Publishing & strategy ↗</Link>
              <Link href="/projects">Switch brand ↗</Link>
            </>
          ) : (
            <Link href="/projects">Open your real projects ↗</Link>
          )}
          <p>
            Research. Create. Reach out.
            <br />
            Learn from what converts.
          </p>
        </div>
      </aside>
      <section className="agency-main">
        <header className="agency-topbar">
          <span>
            {productName} <i>/</i> {productSubtitle}
          </span>
          <span className="agency-mode">
            {demo ? "DEMO · NO LIVE SENDS" : "REVIEW BEFORE SENDING"}
          </span>
        </header>
        {demo && (
          <div className="agency-demo">
            You’re exploring fictional buyers. Changes stay in this browser; no
            email is sent.{" "}
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const next = demoAcquisition();
                localStorage.setItem(demoKey, JSON.stringify(next));
                setState(next);
                setSelectedId("");
                setCampaignId("");
                setError("");
                setNotice("Demo reset.");
              }}
            >
              Reset demo
            </button>
          </div>
        )}
        <div className="agency-page-heading">
          <div>
            <p className="eyebrow">
              {productName.toUpperCase()} · FROM YOUR BUSINESS TO YOUR NEXT
              CUSTOMER
            </p>
            <h1>
              {tab === "Overview"
                ? "Your pipeline, in motion."
                : tab === "Buyers"
                  ? "Find your next good fit."
                  : tab === "Outreach"
                    ? "Turn research into a conversation."
                    : tab === "Campaigns"
                      ? "Give every campaign a clear job."
                      : tab === "Results"
                        ? "Know what brings customers."
                        : "Connect your agency."}
            </h1>
            <p>
              {tab === "Overview"
                ? "A clear view of the work, decisions, and conversations that move your business forward."
                : "One brand, shared context, and a traceable path from first signal to customer."}
            </p>
          </div>
          <button
            className="agency-primary"
            disabled={busy || !loaded}
            onClick={() => {
              setShowCampaign(!showCampaign);
              setShowBuyer(false);
            }}
          >
            + New campaign
          </button>
        </div>
        <div className="agency-toolbar">
          <label>
            Campaign{" "}
            <select
              aria-label="Filter by campaign"
              value={campaignId}
              onChange={(e) => {
                setCampaignId(e.target.value);
                setSelectedId("");
              }}
            >
              <option value="">All campaigns</option>
              {state.campaigns.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={busy}
            onClick={() => void load().catch((e) => setError(e.message))}
          >
            Refresh
          </button>
          <button
            disabled={!loaded}
            onClick={() => download("distronow-buyers.csv", exportCsv(scoped))}
          >
            Export buyers
          </button>
          {busy && (
            <span role="status">
              Working… provider actions may take up to 90 seconds.
            </span>
          )}
        </div>
        {error && (
          <div className="agency-alert is-error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="agency-alert" role="status">
            {notice}
          </div>
        )}
        {!loaded && !error && <p role="status">Loading your agency…</p>}
        {showCampaign && (
          <form className="agency-panel agency-form" onSubmit={createCampaign}>
            <div className="agency-section-heading">
              <h2>Campaign brief</h2>
              <button type="button" onClick={() => setShowCampaign(false)}>
                Close
              </button>
            </div>
            <div className="agency-form-grid">
              <label>
                Campaign name
                <input
                  name="name"
                  required
                  maxLength={120}
                  placeholder="Autumn · boutique hotels"
                />
              </label>
              <label>
                Decision-maker roles
                <input
                  name="roles"
                  required
                  defaultValue="Founder, Owner"
                  placeholder="Owner, Marketing Director"
                />
              </label>
              <label className="span-two">
                What are you offering?
                <textarea
                  name="offer"
                  required
                  defaultValue={brand.description}
                />
              </label>
              <label className="span-two">
                Who is the right customer?
                <textarea
                  name="audience"
                  required
                  defaultValue={brand.audience}
                  placeholder="Independent boutique hotels that need a steady supply of short-form content"
                />
              </label>
              <label>
                Countries (ISO codes)
                <input name="countries" placeholder="RO, GB" />
              </label>
              <label>
                Exclude
                <input
                  name="exclusions"
                  placeholder="Large chains, competitors"
                />
              </label>
              <label>
                Booking link (optional)
                <input
                  name="bookingUrl"
                  type="url"
                  placeholder="https://calendly.com/your-team/intro"
                />
              </label>
              <label>
                Planning budget (EUR)
                <input
                  name="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                />
              </label>
              <label>
                Maximum sends per day
                <input
                  name="dailyLimit"
                  type="number"
                  min="1"
                  max="50"
                  defaultValue="10"
                />
              </label>
              <label>
                Preferred lead source
                <select name="leadSource" defaultValue="treg">
                  <option value="treg">Treg · routed people search</option>
                  <option value="getleads">
                    GetLeads · strong all rounder
                  </option>
                  <option value="quickenrich">QuickEnrich · US focused</option>
                  <option value="blitz">Blitz API · extra coverage</option>
                  <option value="moltsets">
                    MoltSets · waterfall enrichment
                  </option>
                </select>
              </label>
            </div>
            <p className="agency-muted">
              The budget is for planning. Provider credits are tracked
              separately. Creating a campaign does not send messages.
            </p>
            <button className="agency-primary" disabled={busy}>
              Create campaign
            </button>
          </form>
        )}
        {["Overview", "Results"].includes(tab) && (
          <div className="agency-funnel">
            {[
              ["Buyers found", metrics.buyers],
              ["Emails sent", metrics.sent],
              ["Positive replies", metrics.positive],
              ["Calls booked", metrics.booked],
              ["Customers won", metrics.won],
            ].map(([label, value], i) => (
              <article key={label}>
                <small>
                  0{i + 1} <span>↗</span>
                </small>
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        )}
        {tab === "Overview" && (
          <>
            <div className="agency-two-col">
              <section className="agency-panel">
                <div className="agency-section-heading">
                  <h2>Your next decisions</h2>
                  <span className="agency-pill">
                    {pending.length} to review
                  </span>
                </div>
                {!state.campaigns.length ? (
                  <div className="agency-empty">
                    <h3>Start with one customer segment.</h3>
                    <p>
                      Your business context is ready. Create a campaign, review
                      buyers, and approve the first message.
                    </p>
                    <button
                      className="agency-primary"
                      onClick={() => setShowCampaign(true)}
                    >
                      Create your first campaign
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="agency-decision"
                      onClick={() => setTab("Buyers")}
                    >
                      <strong>
                        {
                          scoped.prospects.filter(
                            (p) => p.status === "candidate",
                          ).length
                        }
                      </strong>
                      <span>
                        Buyers awaiting qualification
                        <small>
                          Review the source and fit before outreach.
                        </small>
                      </span>
                      <b>→</b>
                    </button>
                    <button
                      className="agency-decision"
                      onClick={() => setTab("Outreach")}
                    >
                      <strong>
                        {
                          scoped.prospects.filter(
                            (p) => p.draftStatus === "draft",
                          ).length
                        }
                      </strong>
                      <span>
                        Drafts ready for review
                        <small>Check the offer, evidence, and next step.</small>
                      </span>
                      <b>→</b>
                    </button>
                    <button
                      className="agency-decision"
                      onClick={() => setTab("Outreach")}
                    >
                      <strong>
                        {
                          scoped.prospects.filter(
                            (p) => p.replyKind === "interested" && !p.meetingAt,
                          ).length
                        }
                      </strong>
                      <span>
                        Interested buyers to follow up
                        <small>
                          Continue the conversation and record the meeting.
                        </small>
                      </span>
                      <b>→</b>
                    </button>
                    {projectId && (
                      <Link className="agency-decision" href={`${base}/assets`}>
                        <strong>{approvedContent}</strong>
                        <span>
                          Approved content assets
                          <small>
                            Prepare distribution from the content studio.
                          </small>
                        </span>
                        <b>→</b>
                      </Link>
                    )}
                  </>
                )}
              </section>
              <section className="agency-panel agency-accent">
                <p className="eyebrow">THE CAMPAIGN LOOP</p>
                <h2>
                  Better research.
                  <br />
                  More relevant conversations.
                </h2>
                <p>
                  Qualify the buyer, review your message, and track what happens
                  next. Use recurring objections to shape your content.
                </p>
                <div className="agency-checklist">
                  <span>01 · Brand & offer</span>
                  <span>02 · Buyer evidence</span>
                  <span>03 · Outreach & replies</span>
                  <span>04 · Meetings & learnings</span>
                </div>
                <button onClick={() => setTab("Results")}>
                  See what is working →
                </button>
              </section>
            </div>
            <Activity events={scoped.events} />
            {failureEvents.length > 0 && (
              <div className="agency-alert is-error">
                {failureEvents.length} failed operation(s) recorded. Review the
                activity log and Connections before retrying.
              </div>
            )}
          </>
        )}
        {tab === "Campaigns" && (
          <div className="agency-campaign-grid">
            {scoped.campaigns.length ? (
              scoped.campaigns.map((c) => {
                const m = funnel(state, c.id);
                return (
                  <article key={c.id} className="agency-panel">
                    <div className="agency-section-heading">
                      <span
                        className={`agency-pill ${c.status === "active" ? "is-green" : ""}`}
                      >
                        {c.status}
                      </span>
                      <small>{c.countries || "All countries"}</small>
                    </div>
                    <h2>{c.name}</h2>
                    <p>{c.offer}</p>
                    <dl className="agency-facts">
                      <dt>Ideal customer</dt>
                      <dd>{c.audience}</dd>
                      <dt>Decision maker</dt>
                      <dd>{c.roles}</dd>
                      <dt>Daily limit</dt>
                      <dd>{c.dailyLimit} emails</dd>
                      <dt>Planning budget</dt>
                      <dd>€{c.budget}</dd>
                      <dt>Lead source</dt>
                      <dd>{leadSourceName(c.leadSource)}</dd>
                    </dl>
                    <div className="agency-mini-stats">
                      <span>
                        <strong>{m.buyers}</strong>buyers
                      </span>
                      <span>
                        <strong>{m.booked}</strong>meetings
                      </span>
                      <span>
                        <strong>{m.won}</strong>customers
                      </span>
                    </div>
                    <div className="agency-actions">
                      <button
                        disabled={busy}
                        onClick={() => {
                          setCampaignId(c.id);
                          setTab("Buyers");
                        }}
                      >
                        Open buyers →
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run({
                            action: "campaign_status",
                            campaignId: c.id,
                            status: c.status === "active" ? "paused" : "active",
                          })
                        }
                      >
                        {c.status === "active" ? "Pause" : "Activate"}
                      </button>
                      <button
                        disabled={busy || c.status === "completed"}
                        onClick={() =>
                          void run({
                            action: "campaign_status",
                            campaignId: c.id,
                            status: "completed",
                          })
                        }
                      >
                        Complete
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <Empty
                title="No campaigns yet"
                detail="Create a campaign brief to connect buyers, messages, meetings, and results."
              />
            )}
          </div>
        )}
        {tab === "Buyers" && (
          <>
            <div className="agency-toolbar">
              <input
                aria-label="Search buyers"
                placeholder="Search buyers, companies, roles…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label="Filter by buyer status"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {[
                  "all",
                  "candidate",
                  "approved",
                  "contacted",
                  "replied",
                  "meeting",
                  "won",
                  "suppressed",
                ].map((s) => (
                  <option value={s} key={s}>
                    {nice(s)}
                  </option>
                ))}
              </select>
              <button
                disabled={!state.campaigns.length || busy}
                onClick={() => setShowBuyer(!showBuyer)}
              >
                + Add buyer
              </button>
              <button
                className="agency-primary"
                disabled={busy || !campaignId || !connections.discovery || demo}
                onClick={() => void run({ action: "discover", campaignId })}
              >
                Find 10 buyers
              </button>
            </div>
            <p className="agency-muted">
              {demo
                ? "Demo buyers are fictional. You can add your own fictional examples to explore the workflow."
                : !connections.discovery
                  ? "Connect Treg to discover buyers, or add a buyer with source evidence manually."
                  : !campaignId
                    ? "Select a campaign to search using its customer profile."
                    : "Search uses your campaign profile and connected Treg balance. Every result still requires review."}
            </p>
            {showBuyer && (
              <form className="agency-panel agency-form" onSubmit={createBuyer}>
                <h2>Add a buyer with evidence</h2>
                <div className="agency-form-grid">
                  <label>
                    Campaign
                    <select
                      name="campaignId"
                      defaultValue={campaignId || state.campaigns[0]?.id}
                    >
                      {state.campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Company
                    <input name="company" required />
                  </label>
                  <label>
                    Contact name
                    <input name="name" required />
                  </label>
                  <label>
                    Role
                    <input name="role" />
                  </label>
                  <label>
                    Company domain
                    <input name="domain" placeholder="company.com" />
                  </label>
                  <label>
                    Email (unverified)
                    <input name="email" type="email" />
                  </label>
                  <label>
                    Source URL
                    <input name="sourceUrl" type="url" required />
                  </label>
                  <label>
                    Your fit assessment (0–100)
                    <input
                      name="fit"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue="0"
                    />
                  </label>
                  <label className="span-two">
                    Why this buyer? What is your evidence?
                    <textarea name="evidence" required />
                  </label>
                </div>
                <button className="agency-primary" disabled={busy}>
                  Save buyer for review
                </button>
              </form>
            )}
            <BuyerTable buyers={buyers} onOpen={(p) => setSelectedId(p.id)} />
          </>
        )}
        {tab === "Outreach" && (
          <>
            <div className="agency-alert">
              Every send requires an approved buyer, a verified email, and an
              approved draft. Record incoming replies from your mailbox;
              automatic inbox sync is not connected.
            </div>
            <BuyerTable
              buyers={scoped.prospects.filter((p) => p.status !== "candidate")}
              onOpen={(p) => setSelectedId(p.id)}
            />
          </>
        )}
        {selected && ["Buyers", "Outreach"].includes(tab) && (
          <BuyerDetail
            key={`${selected.id}:${selected.subject}:${selected.body}`}
            buyer={selected}
            busy={busy}
            demo={demo}
            connections={connections}
            run={run}
            onClose={() => setSelectedId("")}
            bookingUrl={
              state.campaigns.find((c) => c.id === selected.campaignId)
                ?.bookingUrl || ""
            }
          />
        )}
        {tab === "Results" && (
          <>
            <div className="agency-two-col">
              <section className="agency-panel">
                <h2>Outcomes over activity</h2>
                <dl className="agency-results">
                  <dt>Positive reply rate</dt>
                  <dd>{replyRate}%</dd>
                  <dt>Meetings held</dt>
                  <dd>{metrics.held}</dd>
                  <dt>Recorded revenue</dt>
                  <dd>€{metrics.revenue.toLocaleString()}</dd>
                  <dt>Discovery / enrichment credits</dt>
                  <dd>{metrics.credits.toFixed(1)}</dd>
                </dl>
                <p className="agency-muted">
                  Emails sent means accepted by the sending mailbox, not
                  confirmed delivery. Replies, meetings, and revenue are
                  operator-recorded. Cancelled meetings are excluded from Calls
                  booked.
                </p>
              </section>
              <section className="agency-panel">
                <h2>Turn objections into content</h2>
                {scoped.prospects.filter((p) => p.replyKind === "objection")
                  .length ? (
                  scoped.prospects
                    .filter((p) => p.replyKind === "objection")
                    .map((p) => (
                      <article className="agency-learning" key={p.id}>
                        <strong>{p.company}</strong>
                        <p>{p.reply}</p>
                        {projectId && (
                          <Link href={`${base}/assets`}>
                            Open studio to address this objection →
                          </Link>
                        )}
                      </article>
                    ))
                ) : (
                  <Empty
                    title="Your next insight starts with a reply."
                    detail="Record objections in Outreach. Use the buyer’s language to improve your offer and content."
                  />
                )}
              </section>
            </div>
            <Activity events={scoped.events} />
          </>
        )}
        {tab === "Connections" && (
          <>
            <div className="agency-campaign-grid">
              {[
                [
                  "Buyer discovery",
                  connections.discovery,
                  "Treg routes people search, work-email finding, and a separate deliverability check. Requests use your connected Treg balance.",
                ],
                [
                  "AI drafting",
                  connections.drafting,
                  "Uses the brand, campaign offer, and buyer evidence. Without an AI connection, a clearly labeled template is available.",
                ],
                [
                  "Outbound mailbox",
                  connections.sending,
                  "SMTP submission for individual approved messages. No automatic follow-ups. Replies must be reviewed in your mailbox.",
                ],
                [
                  "Calendar & replies",
                  false,
                  "Add a booking link to each campaign. Record confirmed meeting times and outcomes manually; automatic calendar and inbox sync are not connected.",
                ],
              ].map(([title, ready, detail]) => (
                <article className="agency-panel" key={String(title)}>
                  <span className={`agency-pill ${ready ? "is-green" : ""}`}>
                    {demo
                      ? "Demo mode"
                      : ready
                        ? "Configured"
                        : "Manual / not connected"}
                  </span>
                  <h2>{title}</h2>
                  <p>{detail}</p>
                  {title === "Outbound mailbox" && connections.sender && (
                    <small>Sender: {connections.sender}</small>
                  )}
                </article>
              ))}
            </div>
            <section className="agency-panel">
              <div className="agency-section-heading">
                <div>
                  <p className="eyebrow">LEAD SOURCES</p>
                  <h2>Build the source stack.</h2>
                </div>
                <span className="agency-pill">Provider options</span>
              </div>
              <p>
                Treg is the live route for discovery and verification. Legacy
                campaign source preferences remain visible for existing data;
                Treg records the provider that served each request.
              </p>
              <p className="agency-muted">
                Calls run only on the server, with a configurable cost ceiling
                and project-level usage attribution.
              </p>
              <div className="lead-source-grid">
                {LEAD_SOURCES.map((source) => (
                  <article
                    className={`lead-source-card ${state.campaigns.some((campaign) => campaign.leadSource === source.slug) ? "is-selected" : ""}`}
                    key={source.slug}
                  >
                    <strong>{source.name}</strong>
                    <span>{source.note}</span>
                    <p>{source.detail}</p>
                    <small>
                      {source.slug === "treg" ? "Connector live" : "Legacy preference"}
                    </small>
                  </article>
                ))}
              </div>
            </section>
            <section className="agency-panel">
              <h2>What runs when you press a button</h2>
              <p>
                Discovery searches up to 10 people. Email verification checks
                one person. Sending submits one approved email. Provider actions
                require a signed-in owner. Nothing runs on a timer.
              </p>
              <p>
                Suppressed buyers cannot be contacted. Replies stop further
                outbound actions. A send interrupted by a connection error must
                be reconciled against the mailbox before any retry.
              </p>
              <p className="agency-muted">
                Connection setup is documented in the repository’s
                ACQUISITION_SETUP.md. Credentials stay on the server.
              </p>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="agency-empty">
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}
function BuyerTable({
  buyers,
  onOpen,
}: {
  buyers: Prospect[];
  onOpen: (p: Prospect) => void;
}) {
  return (
    <section className="agency-panel agency-table-wrap">
      {buyers.length ? (
        <table className="agency-table">
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Company</th>
              <th>Fit</th>
              <th>Stage</th>
              <th>Email</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {buyers.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  <small>{p.role}</small>
                </td>
                <td>{p.company}</td>
                <td>
                  <span className="agency-fit">{p.fit}/100</span>
                </td>
                <td>
                  <span className="agency-pill">{nice(p.status)}</span>
                </td>
                <td>{nice(p.emailStatus)}</td>
                <td>
                  <button onClick={() => onOpen(p)}>Review →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty
          title="No buyers in this view"
          detail="Create a campaign, add evidence-backed buyers, or change your filters."
        />
      )}
    </section>
  );
}
function Activity({ events }: { events: AcquisitionState["events"] }) {
  return (
    <section className="agency-panel">
      <div className="agency-section-heading">
        <h2>Activity & evidence</h2>
        <span className="agency-muted">Latest 12 events</span>
      </div>
      {events.length ? (
        <ol className="agency-activity">
          {events
            .slice(-12)
            .reverse()
            .map((e) => (
              <li key={e.id}>
                <span className="agency-activity-dot" />
                <div>
                  <strong>{nice(e.type)}</strong>
                  <p>{e.detail}</p>
                  <small>
                    {e.origin} · {date(e.at)}
                  </small>
                </div>
              </li>
            ))}
        </ol>
      ) : (
        <p className="agency-muted">
          Your campaign activity will appear here as you work.
        </p>
      )}
    </section>
  );
}
function BuyerDetail({
  buyer: p,
  busy,
  demo,
  connections,
  run,
  onClose,
  bookingUrl,
}: {
  buyer: Prospect;
  busy: boolean;
  demo: boolean;
  connections: Connections;
  run: (a: AcquisitionAction) => Promise<boolean>;
  onClose: () => void;
  bookingUrl: string;
}) {
  const [subject, setSubject] = useState(p.subject);
  const [body, setBody] = useState(p.body);
  const [confirmSend, setConfirmSend] = useState(false);
  const suppressed = p.status === "suppressed";
  const dirty = subject !== p.subject || body !== p.body;
  const uncertain = ["sending", "uncertain"].includes(p.draftStatus);
  return (
    <section
      className="agency-panel agency-buyer-detail"
      aria-label={`Review ${p.name}`}
    >
      <div className="agency-section-heading">
        <div>
          <p className="eyebrow">BUYER REVIEW</p>
          <h2>
            {p.name} <span className="agency-muted">/ {p.company}</span>
          </h2>
        </div>
        <button onClick={onClose}>Close</button>
      </div>
      <div className="agency-two-col">
        <div>
          <h3>Why this buyer?</h3>
          <p className="agency-evidence">{p.evidence}</p>
          <a href={p.sourceUrl} target="_blank" rel="noreferrer">
            Read the original source ↗
          </a>
          <p className="agency-muted">
            {p.source} · added {date(p.createdAt)} · fit {p.fit}/100
          </p>
          <p>
            {p.email || "No email found"}{" "}
            <span className="agency-pill">{nice(p.emailStatus)}</span>
          </p>
          <div className="agency-actions">
            <button
              disabled={busy || p.status !== "candidate"}
              onClick={() =>
                void run({ action: "approve_prospect", prospectId: p.id })
              }
            >
              Approve buyer
            </button>
            <button
              disabled={
                busy ||
                suppressed ||
                uncertain ||
                p.draftStatus === "sent" ||
                (!demo && !connections.discovery)
              }
              onClick={() => void run({ action: "enrich", prospectId: p.id })}
            >
              {demo ? "Simulate verification" : "Find verified email"}
            </button>
            <button
              disabled={busy || suppressed}
              onClick={() => void run({ action: "suppress", prospectId: p.id })}
            >
              Suppress contact
            </button>
          </div>
          {bookingUrl && (
            <p>
              <a href={bookingUrl} target="_blank" rel="noreferrer">
                Campaign booking page ↗
              </a>
            </p>
          )}
        </div>
        <div>
          <div className="agency-section-heading">
            <h3>Outreach draft</h3>
            <span className="agency-pill">{nice(p.draftStatus)}</span>
          </div>
          <button
            disabled={
              busy ||
              p.status !== "approved" ||
              uncertain ||
              p.draftStatus === "sent"
            }
            onClick={() => void run({ action: "draft", prospectId: p.id })}
          >
            {demo || !connections.drafting
              ? "Generate template draft"
              : "Generate AI draft"}
          </button>
          <label>
            Subject
            <input
              aria-label="Subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setConfirmSend(false);
              }}
              disabled={suppressed || uncertain || p.draftStatus === "sent"}
            />
          </label>
          <label>
            Message
            <textarea
              aria-label="Message"
              rows={9}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setConfirmSend(false);
              }}
              disabled={suppressed || uncertain || p.draftStatus === "sent"}
            />
          </label>
          <div className="agency-actions">
            <button
              disabled={
                busy ||
                !body.trim() ||
                !subject.trim() ||
                p.status !== "approved" ||
                uncertain ||
                p.draftStatus === "sent"
              }
              onClick={() =>
                void run({
                  action: "save_draft",
                  prospectId: p.id,
                  subject,
                  body,
                })
              }
            >
              Save edits
            </button>
            <button
              disabled={
                busy || dirty || p.draftStatus !== "draft" || suppressed
              }
              onClick={() =>
                void run({ action: "approve_draft", prospectId: p.id })
              }
            >
              Approve draft
            </button>
            <button
              className="agency-primary"
              disabled={
                busy ||
                dirty ||
                p.draftStatus !== "approved" ||
                p.emailStatus !== "valid" ||
                suppressed ||
                (!demo && !connections.sending)
              }
              onClick={() => setConfirmSend(true)}
            >
              {demo ? "Simulate send" : "Review send"}
            </button>
          </div>
          {dirty && (
            <p className="agency-muted">
              Save edits, then approve this version before sending.
            </p>
          )}
          {confirmSend && (
            <div className="agency-send-confirm">
              <strong>
                {demo ? "Simulate one email" : `Send one email to ${p.email}?`}
              </strong>
              <p>{subject}</p>
              <p>
                {demo
                  ? "No email will leave this browser."
                  : `From ${connections.sender}. The saved, approved message above will be sent now, with your sender address and opt-out footer.`}
              </p>
              <button
                className="agency-primary"
                disabled={busy || dirty}
                onClick={async () => {
                  if (await run({ action: "send", prospectId: p.id }))
                    setConfirmSend(false);
                }}
              >
                Confirm {demo ? "simulation" : "send"}
              </button>
              <button onClick={() => setConfirmSend(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
      {uncertain && (
        <form
          className="agency-form agency-alert"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run({
              action: "reconcile_send",
              prospectId: p.id,
              result: String(f.get("result")) as "sent" | "not_sent",
              evidence: String(f.get("evidence")),
            });
          }}
        >
          <h3>Reconcile this send</h3>
          <p>
            Check the mailbox’s Sent folder and provider logs first. Never retry
            while the outcome is unknown.
          </p>
          <label>
            Confirmed result
            <select name="result">
              <option value="sent">Message was sent</option>
              <option value="not_sent">Confirmed not sent</option>
            </select>
          </label>
          <label>
            Mailbox evidence
            <textarea
              required
              name="evidence"
              placeholder="Message ID, timestamp, or confirmed provider rejection"
            />
          </label>
          <button disabled={busy}>Record confirmed outcome</button>
        </form>
      )}
      {p.draftStatus === "sent" && !suppressed && (
        <div className="agency-two-col agency-followup">
          <form
            className="agency-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void run({
                action: "reply",
                prospectId: p.id,
                body: String(f.get("reply")),
                kind: String(f.get("kind")) as "interested",
              });
            }}
          >
            <h3>Record a reply from your mailbox</h3>
            <label>
              Reply text
              <textarea
                aria-label="Reply text"
                name="reply"
                required
                defaultValue={p.reply}
              />
            </label>
            <label>
              Classification
              <select name="kind" defaultValue={p.replyKind || "interested"}>
                {[
                  "interested",
                  "objection",
                  "not_now",
                  "wrong_person",
                  "unsubscribe",
                  "out_of_office",
                ].map((kind) => (
                  <option value={kind} key={kind}>
                    {nice(kind)}
                  </option>
                ))}
              </select>
            </label>
            <button disabled={busy}>Save reply</button>
          </form>
          <div>
            <form
              className="agency-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run({
                  action: "meeting",
                  prospectId: p.id,
                  at: new Date(String(f.get("at"))).toISOString(),
                  outcome: String(f.get("outcome")) as "booked",
                });
              }}
            >
              <h3>Record a confirmed meeting</h3>
              <p className="agency-muted">
                Manual record from your calendar. Booking links alone do not
                count.
              </p>
              <label>
                Meeting time
                <input name="at" type="datetime-local" required />
              </label>
              {p.meetingAt && (
                <small>
                  Current: {date(p.meetingAt)} · {nice(p.meetingOutcome)}
                </small>
              )}
              <label>
                Outcome
                <select
                  name="outcome"
                  aria-label="Outcome"
                  defaultValue={p.meetingOutcome || "booked"}
                >
                  {["booked", "held", "cancelled", "no_show"].map((outcome) => (
                    <option key={outcome} value={outcome}>
                      {nice(outcome)}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={busy || !p.reply}>Save meeting outcome</button>
            </form>
            <form
              className="agency-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run({
                  action: "won",
                  prospectId: p.id,
                  revenue: Number(f.get("revenue")),
                });
              }}
            >
              <label>
                Closed revenue (EUR)
                <input
                  name="revenue"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  required
                />
              </label>
              <button
                disabled={
                  busy || p.status !== "meeting" || p.meetingOutcome !== "held"
                }
              >
                Mark customer won
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
