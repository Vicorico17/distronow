import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetSelectionPanel } from "@/components/asset-selection-panel";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandAudiences, getBrandProjectWorkspace, getCampaigns, getMarketingAssets } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

type AssetsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssetsPage({ params }: AssetsPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const anonymousOwnerId = await getAnonymousOwnerId();
  const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);

  if (!workspace) {
    notFound();
  }

  const { project, latestExtraction } = workspace;
  const [audiences, assets, campaigns] = await Promise.all([
    getBrandAudiences(project.id),
    getMarketingAssets(project.id),
    getCampaigns(project.id)
  ]);

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
          <Link className="nav-action" href="/account">
            Account
          </Link>
        </nav>
      </section>

      <AssetSelectionPanel
        draftCount={workspace.postDrafts.length}
        initialAssets={assets}
        initialAudiences={audiences}
        initialCampaigns={campaigns}
        initialDrafts={workspace.postDrafts}
        initialLanguage={project.language ?? latestExtraction.language ?? "Auto"}
        projectColors={workspace.project.brandColors}
        projectDescription={latestExtraction.description ?? "Generate and manage content drafts from the saved brand profile."}
        projectDomain={new URL(latestExtraction.sourceUrl).hostname}
        projectId={project.id}
        projectLanguage={latestExtraction.language}
        projectLogo={workspace.project.brandLogo}
        projectTitle={latestExtraction.title ?? project.name ?? project.domain}
      />
    </main>
  );
}
