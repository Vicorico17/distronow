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
      </section>

      <BrandProfile
        extraction={latestExtraction}
        projectLabel="Workspace brand kit"
        showRawData={false}
        stored={{ projectId: project.id, extractionId: latestExtraction.id }}
      />

      <PostDraftPanel
        initialLanguage={project.language ?? latestExtraction.language ?? "Auto"}
        projectId={project.id}
        initialDrafts={workspace.postDrafts}
      />
    </main>
  );
}
