import { BrandExtraction } from "@/lib/brand";
import type { SavedBrandAudience } from "@/lib/brand-store";

type GeneratedAudience = Omit<SavedBrandAudience, "id" | "projectId" | "createdAt" | "updatedAt">;

const DEFAULT_MODEL = "gpt-4.1-mini";

function brandName(extraction: BrandExtraction) {
  return extraction.title?.split("|")[0].trim() || new URL(extraction.sourceUrl).hostname.replace(/^www\./, "");
}

function brandSummary(extraction: BrandExtraction) {
  return extraction.description?.replace(/\s+/g, " ").trim() || "A brand with a website and reusable positioning signals.";
}

function brandDomain(extraction: BrandExtraction) {
  return new URL(extraction.sourceUrl).hostname.replace(/^www\./, "");
}

function brandSignals(extraction: BrandExtraction) {
  return [
    extraction.title,
    extraction.description,
    extraction.rawMetadata ? JSON.stringify(extraction.rawMetadata).slice(0, 1800) : null,
    JSON.stringify(extraction.branding).slice(0, 1800)
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\s+/g, " ");
}

function isCybersecurityBrand(extraction: BrandExtraction) {
  return /\b(zero trust|cyber|security|soc|siem|iam|identity|network|endpoint|threat|managed detection|mdr)\b/i.test(
    brandSignals(extraction)
  );
}

function parseJsonArray(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const parsed = JSON.parse(fenced ?? trimmed) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Audience generation did not return an array.");
  }

  return parsed;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeAudience(value: unknown, index: number): GeneratedAudience {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    name: typeof item.name === "string" ? item.name : `Recommended audience ${index + 1}`,
    summary: typeof item.summary === "string" ? item.summary : "A likely high-fit customer segment for this brand.",
    painPoints: asStringArray(item.painPoints),
    goals: asStringArray(item.goals),
    buyingTriggers: asStringArray(item.buyingTriggers),
    objections: asStringArray(item.objections),
    channels: asStringArray(item.channels),
    contentAngles: asStringArray(item.contentAngles),
    isPrimary: index === 0,
    source: "ai"
  };
}

function fallbackAudiences(extraction: BrandExtraction): GeneratedAudience[] {
  const name = brandName(extraction);
  const summary = brandSummary(extraction);

  if (isCybersecurityBrand(extraction)) {
    return [
      {
        name: "CISO with Zero Trust board pressure",
        summary: `Security leader who has a mandate to prove Zero Trust progress but does not have enough internal bandwidth to design, deploy, and operate it alone. ${summary}`,
        painPoints: ["Board expects measurable Zero Trust progress", "Internal teams are overloaded", "Security tooling is fragmented"],
        goals: ["Reduce breach exposure", "Show progress quickly", "Move from architecture to operated controls"],
        buyingTriggers: ["Audit finding", "Board deadline", "Identity or network security incident"],
        objections: ["Needs operational proof", "Worries about vendor lock-in", "Must justify subscription spend"],
        channels: ["LinkedIn", "Search", "Webinars"],
        contentAngles: ["Zero Trust maturity checklist", "Board-ready risk reduction story", "Build versus subscription comparison"],
        isPrimary: true,
        source: "fallback"
      },
      {
        name: "IT director stuck between tools and outcomes",
        summary: `Technical buyer responsible for making security tools work together while keeping day-to-day operations stable for the business.`,
        painPoints: ["Too many point tools", "Limited specialist staff", "Hard handoff from design to operations"],
        goals: ["Simplify implementation", "Keep controls running 24/7", "Reduce manual security work"],
        buyingTriggers: ["Failed rollout", "New compliance requirement", "Team capacity gap"],
        objections: ["Needs integration details", "Needs clear implementation scope", "Needs proof of support quality"],
        channels: ["LinkedIn", "YouTube", "Search"],
        contentAngles: ["Deployment walkthrough", "Operations checklist", "What managed Zero Trust includes"],
        isPrimary: false,
        source: "fallback"
      },
      {
        name: "Compliance owner needing defensible controls",
        summary: `Risk or compliance stakeholder who needs evidence that security controls are not just documented, but deployed, monitored, and maintained.`,
        painPoints: ["Controls are hard to evidence", "Audit timelines are tight", "Security ownership is split across teams"],
        goals: ["Pass audits with less scramble", "Document control coverage", "Reduce unmanaged access risk"],
        buyingTriggers: ["Upcoming audit", "Customer security questionnaire", "Regulatory pressure"],
        objections: ["Needs reporting clarity", "Needs stakeholder buy-in", "Needs predictable cost"],
        channels: ["LinkedIn", "Search", "Email"],
        contentAngles: ["Audit evidence examples", "Control mapping guide", "Risk reduction proof points"],
        isPrimary: false,
        source: "fallback"
      }
    ];
  }

  return [
    {
      name: `${name} decision owner`,
      summary: `Person responsible for solving the problem ${name} addresses, with enough urgency to compare vendors and enough authority to start a buying conversation. ${summary}`,
      painPoints: ["Current workaround is slowing the team", "Existing options feel vague", "Needs a low-risk path to action"],
      goals: ["Understand fit quickly", "Prove value to stakeholders", "Choose a credible provider"],
      buyingTriggers: ["Internal deadline", "Budget planning", "Clear proof of outcome"],
      objections: ["Needs proof", "Needs implementation clarity", "Needs confidence in ROI"],
      channels: ["LinkedIn", "Search", "Email"],
      contentAngles: ["Decision checklist", "Outcome proof", "Implementation expectations"],
      isPrimary: true,
      source: "fallback"
    },
    {
      name: `${brandDomain(extraction)} evaluator`,
      summary: `Research-heavy prospect who is not ready for a sales call yet but is actively looking for proof, pricing signals, implementation detail, and alternatives.`,
      painPoints: ["Cannot tell vendors apart", "Needs specific examples", "Wants to avoid a bad recommendation"],
      goals: ["Compare approaches", "Build internal confidence", "Shortlist credible options"],
      buyingTriggers: ["Comparison guide", "Use-case walkthrough", "Customer proof"],
      objections: ["Needs more detail", "Needs credible proof", "Needs stakeholder alignment"],
      channels: ["Search", "LinkedIn", "YouTube"],
      contentAngles: ["Comparison framework", "FAQ", "Common mistakes"],
      isPrimary: false,
      source: "fallback"
    },
    {
      name: `${name} internal champion`,
      summary: `Practitioner who feels the pain directly and needs sharp content they can forward to a manager, founder, or budget owner.`,
      painPoints: ["Feels the daily operational pain", "Does not control the budget", "Needs simple language for leadership"],
      goals: ["Get buy-in", "Show urgency", "Make the solution easy to understand"],
      buyingTriggers: ["Shareable explainer", "ROI proof", "Before-and-after story"],
      objections: ["Needs approval", "Needs budget owner interest", "Needs simple proof"],
      channels: ["LinkedIn", "Email", "Instagram"],
      contentAngles: ["Forwardable explainer", "Cost of inaction", "Team pain story"],
      isPrimary: false,
      source: "fallback"
    }
  ];
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const response = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text)
    .find((text): text is string => typeof text === "string" && text.trim().length > 0);
}

export async function generateAudienceRecommendations(extraction: BrandExtraction): Promise<GeneratedAudience[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackAudiences(extraction);
  }

  try {
    const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              [
                "Return only valid JSON.",
                "Create exactly 3 sharp best-customer segments for marketing.",
                "Do not use generic names like high-intent buyer, research-first comparer, social proof responder, small business owner, or busy professional.",
                "Each segment must name a concrete role, buying situation, urgency, or job-to-be-done specific to the brand.",
                "Make the summaries specific enough that two segments cannot describe the same buyer.",
                "Use keys: name, summary, painPoints, goals, buyingTriggers, objections, channels, contentAngles."
              ].join(" ")
          },
          {
            role: "user",
            content: [
              `Brand: ${brandName(extraction)}`,
              `Website: ${extraction.sourceUrl}`,
              `Description: ${brandSummary(extraction)}`,
              `Language: ${extraction.language ?? "unknown"}`,
              `Brand signals: ${brandSignals(extraction).slice(0, 6000)}`,
              "For each segment, include: who they are, what event makes them buy now, what they fear, and which channels are plausible for this specific buyer.",
              "For B2B/security/technical brands, prefer role-based segments like CISO, IT director, compliance owner, founder, ops leader, or budget holder where appropriate."
            ].join("\n")
          }
        ],
        temperature: 0.4
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned HTTP ${response.status}.`);
    }

    const outputText = extractOutputText(await response.json());

    if (!outputText) {
      throw new Error("OpenAI returned no audience text.");
    }

    return parseJsonArray(outputText).slice(0, 3).map(normalizeAudience);
  } catch (error) {
    console.error(error);
    return fallbackAudiences(extraction);
  }
}
