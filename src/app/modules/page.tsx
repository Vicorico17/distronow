import Link from "next/link";
import { DIRECTORY_CATEGORIES, MODULE_DIRECTORY } from "@/lib/module-directory";

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
          Explore {MODULE_DIRECTORY.length} dedicated pages for product modules, contributing projects,
          and reference material. Each page explains its role and what is connected today.
        </p>
      </section>
      <nav className="directory-categories" aria-label="Module categories">
        {DIRECTORY_CATEGORIES.map((category, index) => <Link key={category} href={`#category-${index}`}>{category}</Link>)}
      </nav>
      {DIRECTORY_CATEGORIES.map((category, index) => <section className="module-directory directory-section" id={`category-${index}`} key={category} aria-labelledby={`category-heading-${index}`}>
        <h2 id={`category-heading-${index}`}>{category}</h2>
        <div className="module-grid">
          {MODULE_DIRECTORY.filter((module) => module.category === category).map((module) => (
            <article className="module-card" key={module.slug}>
              <span className="module-card-name">{module.name}</span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <small>{module.status}</small>
              <Link className="module-card-link" href={module.href}>Explore {module.name} →</Link>
            </article>
          ))}
        </div>
      </section>)}
    </main>
  );
}
