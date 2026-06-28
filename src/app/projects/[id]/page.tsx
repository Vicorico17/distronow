import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandProfile } from "@/components/brand-profile";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const workspace = await getBrandProjectWorkspace(id, user?.id);

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
          <Link className="nav-action" href="/projects">
            Projects
          </Link>
          <Link className="nav-action" href="/account">
            Account
          </Link>
        </nav>
      </section>

      <BrandProfile
        action={{
          eyebrow: "Next step",
          title: "Create the first content drafts.",
          description: "Move into the focused content workspace and generate channel-ready marketing assets.",
          href: `/projects/${project.id}/assets`,
          label: "Generate drafts"
        }}
        extraction={latestExtraction}
        projectLabel="Workspace brand kit"
        showRawData={false}
        stored={{ projectId: project.id, extractionId: latestExtraction.id }}
        workspace={workspace}
      />
    </main>
  );
}
