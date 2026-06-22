import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandProfile } from "@/components/brand-profile";
import { getBrandProjectWorkspace } from "@/lib/brand-store";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

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
          <span>Project workspace</span>
        </nav>

        <div className="project-header">
          <div>
            <p className="eyebrow">Saved project</p>
            <h1>{project.name ?? project.domain}</h1>
            <p className="lede">{project.websiteUrl}</p>
          </div>

          <div className="project-actions">
            <Link href="/">New scrape</Link>
          </div>
        </div>
      </section>

      <section className="project-meta">
        <div>
          <span>Domain</span>
          <strong>{project.domain}</strong>
        </div>
        <div>
          <span>Provider</span>
          <strong>{latestExtraction.provider}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{formatDate(project.updatedAt)}</strong>
        </div>
      </section>

      <BrandProfile
        extraction={latestExtraction}
        projectLabel="Workspace brand kit"
        stored={{ projectId: project.id, extractionId: latestExtraction.id }}
      />
    </main>
  );
}
