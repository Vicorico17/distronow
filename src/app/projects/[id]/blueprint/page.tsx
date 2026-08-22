import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { MARKETING_BLUEPRINT_SECTIONS, SOURCE_MIGRATION_MAP } from "@/lib/marketing-blueprint";

type BlueprintPageProps = { params: Promise<{ id: string }> };

export default async function BlueprintPage({ params }: BlueprintPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const anonymousOwnerId = await getAnonymousOwnerId();
  const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);
  if (!workspace) notFound();

  const title = workspace.latestExtraction.title ?? workspace.project.name ?? workspace.project.domain;

  return (
    <main className="blueprint-page">
      <section className="project-hero">
        <nav>
          <Link href={`/projects/${id}/workspace`}>DistroNow</Link>
          <span className="nav-link-row">
            <Link className="nav-action" href={`/projects/${id}/content-library`}>Playbooks</Link>
            <Link className="nav-action" href={`/projects/${id}/operations`}>Operations</Link>
            <Link className="nav-action" href="/process">Process</Link>
          </span>
        </nav>
      </section>

      <section className="blueprint-shell">
        <div className="blueprint-heading">
          <div>
            <p className="eyebrow">{title} / product blueprint</p>
            <h1>What this marketing super app can become.</h1>
            <p>This is the full product map assembled from the current DistroNow app and the useful work found in the local content directory.</p>
          </div>
          <div className="blueprint-links">
            <Link className="primary-action" href={`/projects/${id}/workspace`}>Back to Marketing OS</Link>
            <Link className="secondary-action" href={`/projects/${id}/content-library`}>Open reusable playbooks</Link>
          </div>
        </div>

        <div className="blueprint-callout">
          <strong>One project. Two operating halves.</strong>
          <span>DistroNow Studio decides who to reach and what to create. accman distributes approved work, manages accounts, and learns from results. AutoGTM, ClipRO, AutoArt, and Streamwin connect as distinct categories.</span>
        </div>

        <div className="blueprint-sections">
          {MARKETING_BLUEPRINT_SECTIONS.map((section) => (
            <article className="blueprint-section" key={section.title}>
              <p className="eyebrow">{section.label}</p>
              <h2>{section.title}</h2>
              <p className="blueprint-summary">{section.summary}</p>
              <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>

        <section className="source-map">
          <div className="blueprint-section-heading">
            <p className="eyebrow">Migration record</p>
            <h2>Where the local material goes</h2>
            <p>Useful information is now represented in the product blueprint and Content Intelligence Library. Source code from Postiz is intentionally not copied.</p>
          </div>
          <div className="source-map-table">
            {SOURCE_MIGRATION_MAP.map((row) => (
              <div className="source-map-row" key={row.source}>
                <strong>{row.source}</strong>
                <span>{row.contribution}</span>
                <small>{row.destination}</small>
              </div>
            ))}
          </div>
        </section>

        <div className="blueprint-footer">
          <span>Review order: foundation → customer → strategy → creation → distribution → learning.</span>
          <Link href={`/projects/${id}/operations`}>Open shared operating records →</Link>
        </div>
      </section>
    </main>
  );
}
