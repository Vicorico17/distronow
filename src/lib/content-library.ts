export type ContentLibraryItem = {
  title: string;
  summary: string;
  details: string[];
  category: string;
  source: string;
};

export const CONTENT_LIBRARY: ContentLibraryItem[] = [
  {
    category: "Content strategy",
    title: "The 50 / 35 / 15 content mix",
    summary: "Balance discovery, trust, and conversion instead of making every post sell.",
    details: [
      "50% Growth: pain-specific hooks, result-first ideas, POVs, listicles, and stories that reach new people.",
      "35% Trust: frameworks, teardowns, demonstrations, proof, comparisons, and founder perspective.",
      "15% Conversion: testimonials, before/after stories, soft pitches, lead magnets, and clear next steps."
    ],
    source: "AI Marketing OS / Script Generation"
  },
  {
    category: "Hooks",
    title: "Hook patterns that earn the next second",
    summary: "Start with a specific lived pain, outcome, proof point, contradiction, or curiosity gap.",
    details: [
      "Pain specificity: name the exact moment the customer recognizes.",
      "Result first: lead with the change, then explain the mechanism.",
      "Contrarian position: challenge the belief keeping the audience stuck.",
      "Proof first: open with a result and unpack the workflow behind it.",
      "Before / after, cost of inaction, stop-doing-this, and nobody-tells-you patterns are reusable variants."
    ],
    source: "AI Marketing OS / Script Generation"
  },
  {
    category: "Angles",
    title: "Eight repeatable creative angles",
    summary: "Give every idea a point of view before asking an AI to write it.",
    details: [
      "Pain amplification, benefit stack, hidden mechanism, objection handling.",
      "Proof breakdown, old way versus new way, common mistake, and customer lens.",
      "Choose the angle from customer evidence, not from a random trend."
    ],
    source: "AI Marketing OS / Script Generation"
  },
  {
    category: "Formats",
    title: "A format library for channel-ready ideas",
    summary: "Match the idea to a production format that makes the proof easy to see.",
    details: [
      "UGC, POV, founder POV, screen demo, testimonial, comparison, listicle, and story.",
      "Every format needs one visual proof moment and one clear audience takeaway.",
      "Adapt the same idea per platform rather than blindly cross-posting it."
    ],
    source: "AI Marketing OS / Script Generation"
  },
  {
    category: "Virality",
    title: "The 30-day question-hook framework",
    summary: "Use a daily question or tension point to create a consistent discovery series.",
    details: [
      "Open with a sharp question tied to a real customer problem.",
      "Move through context, tension, one useful insight, and a simple payoff.",
      "Keep the first scene specific and the middle section focused on one idea.",
      "Use ragebait carefully: challenge an idea, never invent proof or mislead the audience."
    ],
    source: "AI Marketing OS / Virality"
  },
  {
    category: "Lead magnets",
    title: "Comment-to-email funnel",
    summary: "Turn a useful post into an owned-audience path with a real reason to respond.",
    details: [
      "Create one narrow guide that solves the problem the content opens.",
      "Use one keyword across the video, caption, and automation trigger.",
      "Send the DM to an email gate, deliver instantly, then nurture with value.",
      "Invite people to the offer only after the guide and follow-up have earned the next step."
    ],
    source: "Emailing Lead Magnet"
  },
  {
    category: "UGC production",
    title: "The eight-step UGC workflow",
    summary: "Turn a proven angle into a repeatable, reviewable production package.",
    details: [
      "Research the audience and competitors, choose an angle, and write three hook variations.",
      "Create a character or creator brief, then plan eight scenes with voiceover, b-roll, and overlays.",
      "Generate or capture the assets, edit for 9:16, review claims, and prepare platform variants.",
      "Ship the best version to accman for testing and record the result by hook and angle."
    ],
    source: "AI Marketing OS / UGC Videos"
  },
  {
    category: "Characters",
    title: "Consistent campaign characters",
    summary: "Build a recognizable creator persona with behavior and visual anchors that do not drift.",
    details: [
      "Define role, desire, fear, contradiction, audience read, voice, palette, wardrobe, and signature prop.",
      "Keep the core desire, silhouette, palette, speech rhythm, and do-not-change list stable.",
      "Generate variations only after testing the character in a script, image prompt, or scene."
    ],
    source: "Character Generation"
  },
  {
    category: "Slideshows",
    title: "Carousel and slideshow audit",
    summary: "Make every slide earn its place with one job, readable text, and a relevant image.",
    details: [
      "Hook with a specific pain, result, emotion, proof, or curiosity gap.",
      "Use one main text item per slide; aim for 5–12 words on the hook and 4–10 on body slides.",
      "Make the image show the pain, proof, product, process, before/after, or audience situation.",
      "End with a natural CTA tied to a real next step, not empty comment bait."
    ],
    source: "Slideshow Analysis Framework"
  },
  {
    category: "Niche research",
    title: "Untapped niche validation",
    summary: "Score a niche on audience urgency, buyer evidence, specificity, content depth, and monetization.",
    details: [
      "Start with a seed, then define the audience, pain, transformation, buyer proof, and possible offers.",
      "Validate with customer language, paid competitors, community questions, and review patterns.",
      "Record risks and claim boundaries; health, finance, and sensitive categories need extra review.",
      "Export a shortlist only after evidence supports both content demand and a plausible offer."
    ],
    source: "Untapped Niches"
  },
  {
    category: "Publishing",
    title: "Calendar-first distribution",
    summary: "Use Postiz-inspired operating principles inside accman without importing Postiz as a whole.",
    details: [
      "One composer creates a draft, then adapts it with platform-specific previews and validation.",
      "Support drafts, review, approved, scheduled, published, failed, and retry states.",
      "Add recurring posts, bulk scheduling, content sets, open-slot suggestions, and a searchable media library.",
      "Treat every platform as its own provider with limits, media rules, previews, OAuth health, and reconnect actions."
    ],
    source: "Postiz architecture review"
  },
  {
    category: "Operating system",
    title: "Agent feed and decision loop",
    summary: "Marketing becomes manageable when every recommendation explains what to do next and why.",
    details: [
      "Collect customer signals, strategy decisions, content output, publishing state, and performance in one project.",
      "Recommend the next action from evidence: create, revise, approve, publish, investigate, or stop.",
      "Feed winning hooks, formats, audiences, channels, and times back into future content plans.",
      "Keep human approval before external publishing, outreach, replies, and livestream agent actions."
    ],
    source: "Growth Agent Hub / Marketing OS prototype"
  },
  {
    category: "Acquisition",
    title: "Conversation campaigns",
    summary: "Extend content and outbound campaigns into qualified voice conversations without losing review controls.",
    details: [
      "Use voice agents for qualification, follow-up, support, and booking only when the contact and purpose are appropriate.",
      "Track intent, objections, calendar outcomes, and campaign economics alongside AutoGTM prospects.",
      "Require explicit limits, disclosures, human escalation, and a stop control before any call campaign goes live."
    ],
    source: "AI Marketing OS / MassCall concept"
  }
];

export const CONTENT_LIBRARY_CATEGORIES = [...new Set(CONTENT_LIBRARY.map((item) => item.category))];
