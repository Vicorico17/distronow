import Link from "next/link";
import { MODULE_DIRECTORY } from "@/lib/module-directory";

export default function ModulesPage() {
  return (
    <main className="process-page">
      <nav>
        <Link href="/" className="brand-mark">DistroNow</Link>
        <span className="nav-link-row">
          <Link className="nav-action" href="/process">Process</Link>
          <Link className="nav-action" href="/projects">Projects</Link>
        </span>
      </nav>
      <section className="process-hero modules-hero">
        <p className="eyebrow">DistroNow modules</p>
        <h1>One menu for every specialist tool.</h1>
        <p>
          Browse every module from the DistroNow process. Public utilities and
          demos open directly; project-aware tools connect to your brand workspace.
        </p>
      </section>
      <section className="module-directory">
        <div className="module-grid">
          {MODULE_DIRECTORY.map((module) => (
            <article className="module-card" key={module.slug}>
              <span className="module-card-name">{module.name}</span>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <small>{module.status}</small>
              <Link className="module-card-link" href={module.href}>Open module →</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
