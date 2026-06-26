# DistroNow TODO

## Immediate Product Fixes

- [x] Improve draft display on the project page.
  - [x] Make drafts easier to scan and compare.
  - [x] Separate generated headline, body, CTA, and hashtags more clearly.
  - [x] Add copy actions for each section.
  - [x] Add a compact empty state that points users to the generator controls.

- [x] Detect and preserve brand language.
  - [x] Store detected language from Firecrawl metadata when available.
  - [x] Infer language from title, description, and page metadata when Firecrawl does not provide it.
  - [x] Generate drafts in the brand language by default.
  - [x] Let users override language per generation.

- [x] Replace template-only drafts with AI generation.
  - [x] Add an OpenAI-backed generation service behind the existing post draft API.
  - [x] Keep the current deterministic generator as a fallback.
  - [x] Pass brand profile, language, channel, intent, and tone into the prompt.
  - [x] Save prompt version and generation provider with each draft.

## Content Workspace

- [x] Add generation settings.
  - [x] Channel: LinkedIn, X, Instagram, Facebook, TikTok script.
  - [x] Intent: launch, educational, social proof, product benefit, promotion, community.
  - [x] Language: auto, Romanian, English, Spanish, French, German.
  - [x] Tone: auto, professional, playful, bold, luxury, technical.
  - [x] Length: short, medium, long.

- [x] Add draft lifecycle.
  - [x] Draft status: generated, edited, approved, published.
  - [x] Editable draft cards.
  - [x] Duplicate draft.
  - [x] Delete draft.
  - [x] Regenerate one draft.
  - [x] Save edited draft back to Supabase.

- Add campaign structure.
  - Group drafts into campaigns.
  - Generate a 7-day or 30-day content calendar.
  - Support multiple posts per channel.
  - Add campaign objective and audience.

- [x] Add asset selection screen.
  - [x] Show recommended audiences after brand extraction.
  - [x] Let users edit and add audiences.
  - [x] Show workflow cards for social content, slideshows/carousels, image assets, UGC, and video.
  - [x] Keep UGC and Seedance workflows visible as planned items.

- Add slideshow and carousel generation.
  - Generate Instagram/TikTok slideshow outlines.
  - Generate LinkedIn infographic carousel outlines.
  - Turn selected outlines into image prompts.

## Brand Profile

- Improve brand extraction review.
  - [x] Let users edit brand name, description, language, colors, fonts, and tone.
  - [x] Mark extracted values as confirmed or ignored.
  - Add a confidence indicator for extracted fields.

- Add brand assets.
  - Save logo and OG image references.
  - Add Supabase Storage or Vercel Blob for copied assets.
  - Generate platform-ready image sizes later.

- Add provider fallback chain.
  - Primary: Firecrawl branding.
  - Fallback: Brandfetch or Logo.dev.
  - Last resort: metadata scraper plus screenshot/color extraction.

## Accounts And Data

- Add authentication.
  - [x] Supabase Auth or Clerk.
  - [x] Associate projects with users.
  - [x] Lock projects and drafts behind row-level security.
  - Add logout and account settings.
  - Backfill or claim anonymous projects.

- Update database schema.
  - Add `language`, `tone`, and `audience` fields to projects or brand profiles.
  - Add `provider`, `model`, `prompt_version`, and `settings` to post drafts.
  - [x] Add audience/persona and marketing asset tables.
  - Add campaigns table.
  - [x] Add user ownership columns.

## Deployment And Operations

- Finish Vercel production setup.
  - Confirm all environment variables are set.
  - Add production Supabase URL/key configuration.
  - Confirm Firecrawl works from Vercel.
  - Confirm draft generation works from Vercel.

- [x] Add observability.
  - [x] Log scrape failures.
  - [x] Log generation failures.
  - [x] Show user-friendly error messages.
  - [x] Add basic rate limiting for scrape and generation endpoints.

## Later

- [x] Add image post generation.
  - [x] Generate branded post images from saved colors, logo, and tone.
  - [x] Store image outputs.
  - Export platform-specific sizes.

- Add Seedance video generation.
  - Add Seedance provider configuration.
  - Generate text-to-video and image-to-video assets.
  - Store video outputs in Supabase Storage.
  - Add polling/webhook handling for async jobs.

- Add compliant competitive inspiration workflows.
  - Analyze competitor websites and ad libraries for positioning, hooks, formats, offers, and visual patterns.
  - Generate original variants and briefs instead of copying protected creative.
  - Store inspiration sources, notes, and generated original directions.
  - Add review safeguards for trademark, copyright, and platform policy issues.

- Add publishing integrations.
  - LinkedIn.
  - X.
  - Instagram/Facebook via Meta.
  - Manual export before direct publishing.
