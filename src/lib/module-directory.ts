import { MARKETING_MODULES } from "./module-catalog";

export const MODULE_DIRECTORY = [
  {
    slug: "distronow",
    name: "DistroNow",
    title: "Brand and Content Engine",
    description:
      "Turn brand and customer context into campaigns, posts, scripts, and assets.",
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
    title: "Buyer Intelligence & Outreach",
    description:
      "Find qualified prospects, prepare personalized outreach, and track conversations.",
    href: "/leads-finder",
    status: "Demo available",
  },
] as const;
