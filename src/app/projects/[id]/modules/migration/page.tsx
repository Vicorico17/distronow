import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleMigrationDashboard } from "@/components/module-migration-dashboard";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

type MigrationPageProps = { params: Promise<{ id: string }> };

export default async function ModuleMigrationPage({ params }: MigrationPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const anonymousOwnerId = await getAnonymousOwnerId();
  const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);
  if (!workspace) notFound();
  return <main className="module-page"><section className="project-hero"><nav><Link href={`/projects/${id}/workspace`}>DistroNow</Link><span className="nav-link-row"><Link className="nav-action" href="/account">Account</Link><Link className="nav-action" href="/process">Process</Link></span></nav></section><section className="module-shell"><div className="module-heading"><div><p className="eyebrow">Unified data migration</p><h1>One login for the whole marketing app.</h1><p>Your DistroNow Supabase session owns the project. The other prototypes no longer need separate logins; their records become module records under this project.</p></div><Link className="secondary-action" href={`/projects/${id}/blueprint`}>Review blueprint →</Link></div><ModuleMigrationDashboard projectId={id} /></section></main>;
}
