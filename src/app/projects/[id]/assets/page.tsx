import Link from "next/link";
import { notFound } from "next/navigation";
import { PostDraftPanel } from "@/components/post-draft-panel";
import { getBrandProjectWorkspace } from "@/lib/brand-store";

type AssetsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssetsPage({ params }: AssetsPageProps) {
  const { id } = await params;
  const workspace = await getBrandProjectWorkspace(id);

  if (!workspace) {
    notFound();
  }

  const { project, latestExtraction } = workspace;

  return (
    <main>
      <section className="project-hero">
        <nav>
          <Link href={`/projects/${project.id}`}>Brand kit</Link>
          <Link className="nav-action" href="/">
            New brand
          </Link>
        </nav>
      </section>

      <section className="asset-context">
        <div>
          <p className="eyebrow">Content workspace</p>
          <h1>{latestExtraction.title ?? project.name ?? project.domain}</h1>
          <p>{latestExtraction.description ?? "Generate and manage content drafts from the saved brand profile."}</p>
        </div>
        <div className="asset-context-meta">
          <span>{new URL(latestExtraction.sourceUrl).hostname}</span>
          {latestExtraction.language ? <span>{latestExtraction.language}</span> : null}
          <span>{workspace.postDrafts.length} drafts</span>
        </div>
      </section>

      <PostDraftPanel
        initialLanguage={project.language ?? latestExtraction.language ?? "Auto"}
        projectId={project.id}
        initialDrafts={workspace.postDrafts}
      />
    </main>
  );
}
