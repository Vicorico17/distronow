import Link from "next/link";
import { notFound } from "next/navigation";
import { MetadataReencoder } from "@/components/metadata-reencoder";
import { getMarketingModule } from "@/lib/module-catalog";

export default async function PublicModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  const marketingModule = getMarketingModule(slug);
  if (!marketingModule) notFound();
  const reencoder = slug === "metadata-reencoder";

  return (
    <main className="module-page">
      <section className="project-hero">
        <nav>
          <Link href="/">DistroNow</Link>
          <span className="nav-link-row">
            <Link className="nav-action" href="/modules">Modules</Link>
            <Link className="nav-action" href="/process">Process</Link>
            <Link className="nav-action" href="/projects">Projects</Link>
          </span>
        </nav>
      </section>
      <section className="module-shell">
        <div className="module-heading">
          <div>
            <p className="eyebrow">Modules / {marketingModule.name}</p>
            <h1>{marketingModule.title}</h1>
            <p>{marketingModule.description}</p>
          </div>
          <div className="module-heading-actions">
            <span className="module-status">{marketingModule.status}</span>
            <Link className="secondary-action" href="/modules">All modules</Link>
          </div>
        </div>
        <div className="module-records">
          {marketingModule.records.map((record, index) => <span key={record}><strong>0{index + 1}</strong>{record}</span>)}
        </div>
        {reencoder ? (
          <section id="module-tool"><MetadataReencoder /></section>
        ) : (
          <p className="workspace-notice">
            This module uses project brand and customer context. <Link href="/projects">Open a project to use its connected workspace →</Link>
          </p>
        )}
        <div className="module-workflows">
          {marketingModule.workflows.map((workflow) => (
            <article className="module-workflow" key={workflow.title}>
              <p className="eyebrow">Workflow</p>
              <h2>{workflow.title}</h2>
              <ol>{workflow.steps.map((step) => <li key={step}>{step}</li>)}</ol>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
