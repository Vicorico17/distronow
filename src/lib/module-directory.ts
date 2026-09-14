import { MARKETING_MODULES } from "./module-catalog";

export const MODULE_DIRECTORY = [
  {
    slug: "content-studio",
    name: "Content Studio",
    title: "Website-to-Content Workspace",
    description:
      "Start with a business website, extract its brand context, and create campaigns, posts, scripts, images, and approved assets.",
    href: "/",
    status: "Available",
  },
  ...MARKETING_MODULES.map((module) => {
    return {
      slug: module.slug,
      name: module.name,
      title: module.title,
      description: module.description,
      href: `/modules/${module.slug}`,
      status: module.status,
    };
  }),
  {
    slug: "leads-finder",
    name: "Leads Finder",
    title: "Customer Research, Buyer Intelligence & Outreach",
    description:
      "Capture customer evidence, qualify signals and buyers, prepare personalized outreach, and track conversations.",
    href: "/leads-finder",
    status: "Demo available",
  },
] as const;
