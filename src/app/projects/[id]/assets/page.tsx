import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetSelectionPanel } from "@/components/asset-selection-panel";
import { PostDraftPanel } from "@/components/post-draft-panel";
import { getBrandAudiences, getBrandProjectWorkspace, getMarketingAssets } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

type AssetsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssetsPage({ params }: AssetsPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const workspace = await getBrandProjectWorkspace(id, user?.id);

  if (!workspace) {
    notFound();
  }

  const { project, latestExtraction } = workspace;
  const [audiences, assets] = await Promise.all([getBrandAudiences(project.id), getMarketingAssets(project.id)]);

  return (
    <main>
      <section className="project-hero">
        <nav>
          <Link href={`/projects/${project.id}`}>Brand kit</Link>
          <Link className="nav-action" href="/">
            New brand
          </Link>
          <Link className="nav-action" href="/projects">
            Projects
          </Link>
          <Link className="nav-action" href="/login">
            Log in
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

      <AssetSelectionPanel initialAssets={assets} initialAudiences={audiences} projectId={project.id} />

      <div id="content-drafts">
      <PostDraftPanel
        initialLanguage={project.language ?? latestExtraction.language ?? "Auto"}
        projectId={project.id}
        initialDrafts={workspace.postDrafts}
      />
      </div>
    </main>
  );
}
