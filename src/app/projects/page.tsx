import Link from "next/link";
import { getBrandProjects } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const projects = await getBrandProjects(user?.id);

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

      <section className="projects-dashboard">
        <div className="selection-header">
          <div>
            <p className="eyebrow">{user ? "Your account" : "Anonymous projects"}</p>
            <h1>Brand workspaces</h1>
          </div>
          <Link className="primary-action" href="/">
            Add brand
          </Link>
        </div>

        <div className="project-list">
          {projects.length ? (
            projects.map((project) => (
              <Link className="project-list-card" href={`/projects/${project.id}`} key={project.id}>
                <span>{project.domain}</span>
                <strong>{project.name ?? project.domain}</strong>
                <small>
                  {project.language ? `${project.language} · ` : null}
                  Updated {formatDate(project.updatedAt)}
                </small>
              </Link>
            ))
          ) : (
            <div className="draft-empty">
              <div>
                <h3>No brand workspaces yet</h3>
                <p>Extract a website to create the first workspace.</p>
              </div>
              <Link className="primary-action" href="/">
                Add brand
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
