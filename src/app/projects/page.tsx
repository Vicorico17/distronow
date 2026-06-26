import Link from "next/link";
import { ProjectDeleteButton } from "@/components/project-delete-button";
import { getBrandProjects } from "@/lib/brand-store";
import { getColorEntries } from "@/lib/brand";
import type { BrandColors } from "@/lib/brand";
import type { Json } from "@/lib/supabase/types";
import { getCurrentUser } from "@/lib/supabase/auth-server";

function colorEntries(colors: Json) {
  return getColorEntries(colors && typeof colors === "object" && !Array.isArray(colors) ? (colors as BrandColors) : {});
}

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
            projects.map((project) => {
              const colors = colorEntries(project.brandColors);

              return (
                <article className="project-list-card" key={project.id}>
                  <Link className="project-card-link" href={`/projects/${project.id}`}>
                    <span>{project.domain}</span>
                    <strong>{project.name ?? project.domain}</strong>
                    {colors.length ? (
                      <div className="project-color-row" aria-label="Saved brand colors">
                        {colors.slice(0, 6).map(([name, value]) => (
                          <i key={name} style={{ background: value }} title={`${name}: ${value}`} />
                        ))}
                      </div>
                    ) : null}
                    <small>
                      {project.language ? `${project.language} · ` : null}
                      Updated {formatDate(project.updatedAt)}
                    </small>
                  </Link>
                  <ProjectDeleteButton projectId={project.id} projectName={project.name ?? project.domain} />
                </article>
              );
            })
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
