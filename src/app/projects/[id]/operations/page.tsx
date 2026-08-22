import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationsDashboard } from "@/components/operations-dashboard";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

type OperationsPageProps = { params: Promise<{ id: string }> };

export default async function OperationsPage({ params }: OperationsPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const anonymousOwnerId = await getAnonymousOwnerId();
  const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);
  if (!workspace) notFound();
  return <main className="workspace-home"><section className="project-hero"><nav><Link href={`/projects/${id}/workspace`}>Marketing OS</Link><span className="nav-link-row"><Link className="nav-action" href="/process">Process</Link><Link className="nav-action" href="/projects">Projects</Link></span></nav></section><section className="workspace-home-shell"><div className="workspace-home-heading"><div><p className="eyebrow">Operations / {workspace.project.domain}</p><h1>Decide, track, and hand off.</h1><p>The first shared operating layer for strategy, customer intelligence, acquisition, and agent tasks.</p></div></div><OperationsDashboard projectId={id} /></section></main>;
}
