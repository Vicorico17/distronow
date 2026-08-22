import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

const MODULES = [
  { name: "DistroNow", title: "Brand & Content Engine", description: "Create brand-aware posts, scripts, campaigns, images, videos, and approvals.", href: "assets", action: "Open studio", active: true },
  { name: "AClienti", title: "Customer Intelligence", description: "Turn real signals into customer profiles, pains, objections, and content opportunities.", href: "operations", action: "Review intelligence", active: true },
  { name: "accman", title: "Account Manager", description: "Manage accounts, content plans, publishing queues, and performance analytics.", href: "#distribution", action: "Plan distribution", active: false },
  { name: "AutoGTM", title: "Customer Acquisition", description: "Find qualified prospects, prepare personalized outreach, and track replies and meetings.", href: "operations", action: "Prepare acquisition", active: true },
  { name: "ClipRO", title: "Video Repurposing", description: "Find the strongest moments in long videos and turn them into short clips.", href: "#repurpose", action: "Repurpose video", active: false },
  { name: "AutoArt", title: "Music Creation", description: "Create releases and send approved music promotion into account workflows.", href: "#music", action: "Open music link", active: false },
  { name: "Streamwin", title: "AI Livestream Chatters", description: "Deploy video-aware agents that understand the stream and participate in chat.", href: "#livestream", action: "Configure chatters", active: false }
] as const;

type WorkspacePageProps = { params: Promise<{ id: string }> };

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const anonymousOwnerId = await getAnonymousOwnerId();
  const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);
  if (!workspace) notFound();

  const title = workspace.latestExtraction.title ?? workspace.project.name ?? workspace.project.domain;
  const approvedCount = workspace.postDrafts.filter((draft) => draft.status === "approved").length;

  return (
    <main className="workspace-home">
      <section className="project-hero">
        <nav>
          <Link href={`/projects/${id}`}>DistroNow</Link>
          <span className="nav-link-row">
            <Link className="nav-action" href="/process">Process</Link>
            <Link className="nav-action" href="/projects">Projects</Link>
            <Link className="nav-action" href="/account">Account</Link>
          </span>
        </nav>
      </section>

      <section className="workspace-home-shell">
        <div className="workspace-home-heading">
          <div>
            <p className="eyebrow">Marketing OS / {workspace.project.domain}</p>
            <h1>{title}</h1>
            <p>One business workspace for deciding who to reach, what to create, where to publish, and what to learn.</p>
          </div>
          <div className="workspace-health">
            <span>Next decision</span>
            <strong>{approvedCount ? "Send approved work to accman" : "Create and approve the first content"}</strong>
          </div>
        </div>

        <div className="workspace-flow">
          <span>01 Brand</span><i>→</i><span>02 Customer</span><i>→</i><span>03 Strategy</span><i>→</i><span>04 Create</span><i>→</i><span>05 Approve</span><i>→</i><span>06 Distribute</span>
        </div>

        <section className="workspace-module-directory" aria-label="Marketing modules">
          {MODULES.map((module) => (
            <article className={`workspace-module-card ${module.active ? "is-active" : "is-planned"}`} id={module.href.startsWith("#") ? module.href.slice(1) : undefined} key={module.name}>
              <div className="workspace-module-top"><span>{module.name}</span><small>{module.active ? "Available" : "Module planned"}</small></div>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              {module.active ? <Link className="primary-action" href={`/projects/${id}/${module.href}`}>{module.action} →</Link> : <button className="secondary-action" type="button">{module.action} →</button>}
            </article>
          ))}
        </section>

        <div className="workspace-home-footer">
          <Link href="/process">Read the DistroNow process →</Link>
          <Link href={`/projects/${id}/assets`}>Open saved library →</Link>
        </div>
      </section>
    </main>
  );
}
