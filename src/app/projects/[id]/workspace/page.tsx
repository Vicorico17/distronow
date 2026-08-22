import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { MARKETING_MODULES } from "@/lib/module-catalog";

const MODULES = [
  { name: "DistroNow", title: "Brand & Content Engine", description: "Create brand-aware posts, scripts, campaigns, images, videos, and approvals.", href: "assets", action: "Open studio", active: true },
  { name: "Content Library", title: "Strategies & Playbooks", description: "Use the imported hook, angle, format, UGC, lead-magnet, slideshow, niche, and publishing systems.", href: "content-library", action: "Open playbooks", active: true },
  { name: "Blueprint", title: "Marketing OS Blueprint", description: "Understand how every local prototype becomes one connected super app and what is still left to build.", href: "blueprint", action: "Review the blueprint", active: true },
  { name: "Migration", title: "Unified Data & Login", description: "Import the other apps’ source records into this authenticated DistroNow project.", href: "modules/migration", action: "Import module data", active: true },
  ...MARKETING_MODULES.map((module) => ({ name: module.name, title: module.title, description: module.description, href: `modules/${module.slug}`, action: module.primaryAction, active: true }))
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
          <Link href={`/projects/${id}/content-library`}>Open content playbooks →</Link>
          <Link href={`/projects/${id}/blueprint`}>Review full blueprint →</Link>
          <Link href={`/projects/${id}/assets`}>Open saved library →</Link>
        </div>
      </section>
    </main>
  );
}
