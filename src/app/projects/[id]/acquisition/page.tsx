import { notFound } from "next/navigation";
import { AcquisitionWorkspace } from "@/components/acquisition-workspace";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getCurrentUser } from "@/lib/supabase/auth-server";

export default async function AcquisitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const workspace = await getBrandProjectWorkspace(
    id,
    user?.id,
    await getAnonymousOwnerId(),
  );
  if (!workspace) notFound();
  return (
    <AcquisitionWorkspace
      projectId={id}
      approvedContent={
        workspace.postDrafts.filter((p) => p.status === "approved").length
      }
      brand={{
        name: workspace.latestExtraction.title || workspace.project.domain,
        description: workspace.latestExtraction.description || "",
        website: workspace.project.websiteUrl,
        audience: workspace.project.audience || "",
      }}
    />
  );
}
