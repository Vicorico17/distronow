import Link from "next/link";
import { MODULE_DIRECTORY } from "@/lib/module-directory";

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Start with an existing business",
    description:
      "Add a website you already have. DistroNow reads the business, offer, customers, language, and visual identity so the workspace starts with real context instead of a blank prompt.",
    output: "Brand foundation"
  },
  {
    number: "02",
    title: "Understand the best customer",
    description:
      "Leads Finder turns public customer signals, pains, objections, and buying triggers into a reviewed customer profile before it guides content or outreach.",
    output: "Customer intelligence"
  },
  {
    number: "03",
    title: "Choose the strategy",
    description:
      "Confirm the product information, marketing strategy, competitor context, brand voice, content pillars, offers, and channel roles. Every agent reads the same strategy.",
    output: "Strategy library"
  },
  {
    number: "04",
    title: "Create the work",
    description:
      "DistroNow creates platform-native posts, articles, scripts, carousels, images, UGC briefs, campaigns, and content from the selected audience and strategy.",
    output: "Drafts and assets"
  },
  {
    number: "05",
    title: "Review and approve",
    description:
      "Nothing important should disappear into an automation black box. Edit, regenerate, approve, reject, or schedule every piece with its source and reasoning visible.",
    output: "Approved content"
  },
  {
    number: "06",
    title: "Distribute and learn",
    description:
      "accman connects the approved work to accounts, schedules and publishes it, then measures what performs. Leads Finder finds prospects, while ClipRO, AutoArt, and Streamwin feed their specialist workflows.",
    output: "Performance learnings"
  }
] as const;

export default function ProcessPage() {
  return (
    <main className="process-page">
      <nav>
        <Link href="/" className="brand-mark">DistroNow</Link>
        <span className="nav-link-row">
          <Link className="nav-action" href="/">Start with a website</Link>
          <Link className="nav-action" href="/modules">Modules</Link>
          <Link className="nav-action" href="/projects">Projects</Link>
        </span>
      </nav>

      <section className="process-hero">
        <p className="eyebrow">How the marketing OS works</p>
        <h1>Make the right decisions before you make more content.</h1>
        <p>
          DistroNow starts with a real business, builds a shared understanding of its customers and strategy,
          then moves approved work through creation, acquisition, distribution, and measurement.
        </p>
      </section>

      <section className="process-steps" aria-label="DistroNow process">
        {PROCESS_STEPS.map((step) => (
          <article className="process-step" key={step.number}>
            <span className="process-number">{step.number}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
              <strong>{step.output}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="module-directory">
        <div className="section-heading">
          <div>
            <p className="eyebrow">One app, distinct tools</p>
            <h2>Open a category when you need that specialist job.</h2>
          </div>
          <p>Everything shares the same project, brand, customer, asset, and performance context.</p>
        </div>
        <div className="module-grid">
          {MODULE_DIRECTORY.map((module) => (
            <article className="module-card" key={module.slug}>
              <span className="module-card-name">{module.name}</span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <Link className="module-card-link" href={module.href}>Open module →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="process-cta">
        <div>
          <p className="eyebrow">Begin with what already exists</p>
          <h2>Bring the business. DistroNow builds the marketing system around it.</h2>
        </div>
        <Link className="primary-action" href="/">Add an existing business</Link>
      </section>
    </main>
  );
}
