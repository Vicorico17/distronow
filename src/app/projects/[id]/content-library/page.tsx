import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { CONTENT_LIBRARY, CONTENT_LIBRARY_CATEGORIES } from "@/lib/content-library";

type ContentLibraryPageProps = { params: Promise<{ id: string }> };

export default async function ContentLibraryPage({ params }: ContentLibraryPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const anonymousOwnerId = await getAnonymousOwnerId();
  const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);
  if (!workspace) notFound();

  const title = workspace.latestExtraction.title ?? workspace.project.name ?? workspace.project.domain;

  return (
    <main className="content-library-page">
      <section className="project-hero">
        <nav>
          <Link href={`/projects/${id}/workspace`}>DistroNow</Link>
          <span className="nav-link-row">
            <Link className="nav-action" href={`/projects/${id}/assets`}>Studio</Link>
            <Link className="nav-action" href={`/projects/${id}/operations`}>Operations</Link>
            <Link className="nav-action" href="/process">Process</Link>
          </span>
        </nav>
      </section>

      <section className="content-library-shell">
        <div className="content-library-heading">
          <div>
            <p className="eyebrow">{title} / DistroNow Studio</p>
            <h1>Content Intelligence Library</h1>
            <p>Reusable strategies, formats, prompts, and review rules brought in from the local content workspace.</p>
          </div>
          <Link className="primary-action" href={`/projects/${id}/assets`}>Create from this library →</Link>
        </div>

        <div className="content-library-summary">
          <span><strong>{CONTENT_LIBRARY.length}</strong> playbooks</span>
          <span><strong>{CONTENT_LIBRARY_CATEGORIES.length}</strong> categories</span>
          <span>Feeds DistroNow creation and accman distribution</span>
        </div>

        <div className="content-library-grid">
          {CONTENT_LIBRARY.map((item) => (
            <article className="content-library-card" key={item.title}>
              <div className="content-library-card-top"><span>{item.category}</span><small>{item.source}</small></div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <ul>{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
            </article>
          ))}
        </div>

        <div className="content-library-footer">
          <p>These are starting rules, not autopilot. Confirm them against this brand, its customers, and its performance data.</p>
          <Link href={`/projects/${id}/workspace`}>Back to Marketing OS →</Link>
        </div>
      </section>
    </main>
  );
}
