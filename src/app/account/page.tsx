import Link from "next/link";
import { ClaimAnonymousProjectsButton, LogoutButton } from "@/components/account-actions";
import { getCurrentUser } from "@/lib/supabase/auth-server";

export default async function AccountPage() {
  const user = await getCurrentUser();

  return (
    <main>
      <section className="project-hero">
        <nav>
          <Link href="/">DistroNow</Link>
          <Link className="nav-action" href="/projects">
            Projects
          </Link>
          <Link className="nav-action" href="/">
            New brand
          </Link>
        </nav>
      </section>

      <section className="account-panel">
        <div className="selection-header">
          <div>
            <p className="eyebrow">Account settings</p>
            <h1>{user ? "Manage your workspace." : "Log in to manage your workspace."}</h1>
          </div>
          {user ? <LogoutButton /> : <Link className="primary-action" href="/login">Log in</Link>}
        </div>

        {user ? (
          <div className="account-grid">
            <section className="selection-panel">
              <div className="panel-title">
                <h3>Profile</h3>
                <span>Supabase Auth</span>
              </div>
              <div className="account-detail-list">
                <span>Email</span>
                <strong>{user.email ?? "No email"}</strong>
                <span>User ID</span>
                <code>{user.id}</code>
              </div>
            </section>

            <section className="selection-panel">
              <div className="panel-title">
                <h3>Anonymous projects</h3>
                <span>Ownership</span>
              </div>
              <p className="empty-copy">
                Claim public anonymous projects into this account so they follow the same ownership rules as new projects.
              </p>
              <ClaimAnonymousProjectsButton />
            </section>
          </div>
        ) : (
          <div className="draft-empty">
            <div>
              <h3>No active session</h3>
              <p>Use magic-link login before claiming anonymous projects.</p>
            </div>
            <Link className="primary-action" href="/login">
              Log in
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
