import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getMarketingModule } from "@/lib/module-catalog";

type ModulePageProps = { params: Promise<{ id: string; module: string }> };

export default async function ModulePage({ params }: ModulePageProps) {
  const { id, module: moduleSlug } = await params;
  const user = await getCurrentUser();
  const anonymousOwnerId = await getAnonymousOwnerId();
  const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);
  const marketingModule = getMarketingModule(moduleSlug);
  if (!workspace || !marketingModule) notFound();

  const title = workspace.latestExtraction.title ?? workspace.project.name ?? workspace.project.domain;

  return (
    <main className="module-page">
      <section className="project-hero">
        <nav>
          <Link href={`/projects/${id}/workspace`}>DistroNow</Link>
          <span className="nav-link-row">
            <Link className="nav-action" href={`/projects/${id}/blueprint`}>Blueprint</Link>
            <Link className="nav-action" href={`/projects/${id}/operations`}>Operations</Link>
            <Link className="nav-action" href="/process">Process</Link>
          </span>
        </nav>
      </section>

      <section className="module-shell">
        <div className="module-heading">
          <div>
            <p className="eyebrow">{title} / {marketingModule.name}</p>
            <h1>{marketingModule.title}</h1>
            <p>{marketingModule.description}</p>
          </div>
          <div className="module-heading-actions">
            <span className="module-status">{marketingModule.status}</span>
            <Link className="primary-action" href={`/projects/${id}/operations`}>{marketingModule.primaryAction} →</Link>
          </div>
        </div>

        <div className="module-records">
          {marketingModule.records.map((record, index) => <span key={record}><strong>0{index + 1}</strong>{record}</span>)}
        </div>

        <div className="module-workflows">
          {marketingModule.workflows.map((workflow) => (
            <article className="module-workflow" key={workflow.title}>
              <p className="eyebrow">Workflow</p>
              <h2>{workflow.title}</h2>
              <ol>{workflow.steps.map((step) => <li key={step}>{step}</li>)}</ol>
            </article>
          ))}
        </div>

        <section className="module-detail-grid">
          <article className="module-detail-card">
            <p className="eyebrow">Imported from {marketingModule.source}</p>
            <h2>Capabilities brought into the super app</h2>
            <ul>{marketingModule.importedCapabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
          </article>
          <article className="module-detail-card module-handoff-card">
            <p className="eyebrow">Shared project connections</p>
            <h2>Where this module sends work</h2>
            <ul>{marketingModule.handoffs.map((handoff) => <li key={handoff}>{handoff}</li>)}</ul>
            <Link href={`/projects/${id}/workspace`}>See all categories →</Link>
          </article>
        </section>
      </section>
    </main>
  );
}
