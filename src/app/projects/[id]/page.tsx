import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandProfile } from "@/components/brand-profile";
import { PostDraftPanel } from "@/components/post-draft-panel";
import { getBrandProjectWorkspace } from "@/lib/brand-store";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
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
          <Link href="/">DistroNow</Link>
          <Link className="nav-action" href="/">
            New brand
          </Link>
        </nav>

        <div className="project-header">
          <div>
            <p className="eyebrow">Brand workspace</p>
            <h1>{project.name ?? project.domain}</h1>
          </div>
        </div>
      </section>

      <PostDraftPanel projectId={project.id} initialDrafts={workspace.postDrafts} />

      <BrandProfile
        extraction={latestExtraction}
        projectLabel="Workspace brand kit"
        stored={{ projectId: project.id, extractionId: latestExtraction.id }}
      />
    </main>
  );
}
