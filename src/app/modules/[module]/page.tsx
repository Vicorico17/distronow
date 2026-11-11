import Link from "next/link";
import { getDirectoryEntry, MODULE_DIRECTORY } from "@/lib/module-directory";
import { notFound } from "next/navigation";
import { MetadataReencoder } from "@/components/metadata-reencoder";
import { AccmanAccountVault } from "@/components/accman-account-vault";
import { getMarketingModule } from "@/lib/module-catalog";
import { getCurrentUser } from "@/lib/supabase/auth-server";

export default async function PublicModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  const marketingModule = getMarketingModule(slug);
  const entry = getDirectoryEntry(slug);
  if (!entry) notFound();
  const index = MODULE_DIRECTORY.findIndex((item) => item.slug === slug);
  const previous = MODULE_DIRECTORY[index - 1];
  const next = MODULE_DIRECTORY[index + 1];
  const reencoder = slug === "metadata-reencoder";
  const accman = slug === "accman";
  const user = accman ? await getCurrentUser() : null;

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
            <p className="eyebrow">Modules / {entry.name}</p>
            <h1>{entry.title}</h1>
            <p>{entry.description}</p>
          </div>
          <div className="module-heading-actions">
            <span className="module-status">{entry.status}</span>
            <Link className="secondary-action" href="/modules">All modules</Link>
          </div>
        </div>
        <section className="module-detail-grid" aria-label="Integration details">
          <article className="module-detail-card"><p className="eyebrow">{entry.category}</p><h2>What it contributes</h2><p>{entry.contribution}</p></article>
          <article className="module-detail-card"><p className="eyebrow">{entry.status}</p><h2>Current integration</h2><p>{entry.limitation}</p><p>Connected area: {entry.destination}</p></article>
        </section>
        <div className="module-records">
          {marketingModule?.records.map((record, index) => <span key={record}><strong>0{index + 1}</strong>{record}</span>)}
        </div>
        {accman ? (
          <section id="module-tool">{user ? <AccmanAccountVault /> : <p className="workspace-notice">Log in to manage your account vault. <Link href="/login">Log in →</Link></p>}</section>
        ) : reencoder ? (
          <section id="module-tool"><MetadataReencoder /></section>
        ) : (
          <p className="workspace-notice">
            <Link href={entry.destinationHref}>Open {entry.destination} →</Link>
          </p>
        )}
        <div className="module-workflows">
          {marketingModule?.workflows.map((workflow) => (
            <article className="module-workflow" key={workflow.title}>
              <p className="eyebrow">Workflow</p>
              <h2>{workflow.title}</h2>
              <ol>{workflow.steps.map((step) => <li key={step}>{step}</li>)}</ol>
            </article>
          ))}
        </div>
        <nav className="module-tour" aria-label="Browse modules">
          {previous ? <Link href={previous.href}>← {previous.name}</Link> : <span>First page</span>}
          <Link href="/modules">All categories · {index + 1} / {MODULE_DIRECTORY.length}</Link>
          {next ? <Link href={next.href}>{next.name} →</Link> : <span>Last page</span>}
        </nav>
      </section>
    </main>
  );
}
