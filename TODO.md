# DistroNow TODO

## Immediate Product Fixes

- Improve draft display on the project page.
  - Make drafts easier to scan and compare.
  - Separate generated headline, body, CTA, and hashtags more clearly.
  - Add copy actions for each section.
  - Add a compact empty state that points users to the generator controls.

- Detect and preserve brand language.
  - Store detected language from Firecrawl metadata when available.
  - Infer language from title, description, and page metadata when Firecrawl does not provide it.
  - Generate drafts in the brand language by default.
  - Let users override language per project or per generation.

- Replace template-only drafts with AI generation.
  - Add an OpenAI-backed generation service behind the existing post draft API.
  - Keep the current deterministic generator as a fallback.
  - Pass brand profile, language, channel, intent, and tone into the prompt.
  - Save prompt version and generation provider with each draft.

## Content Workspace

- Add generation settings.
  - Channel: LinkedIn, X, Instagram, Facebook, TikTok script.
  - Intent: launch, educational, social proof, product benefit, promotion, community.
  - Language: auto, Romanian, English, Spanish, French, German.
  - Tone: auto, professional, playful, bold, luxury, technical.
  - Length: short, medium, long.

- Add draft lifecycle.
  - Draft status: generated, edited, approved, published.
  - Editable draft cards.
  - Duplicate draft.
  - Delete draft.
  - Regenerate one draft.
  - Save edited draft back to Supabase.

- Add campaign structure.
  - Group drafts into campaigns.
  - Generate a 7-day or 30-day content calendar.
  - Support multiple posts per channel.
  - Add campaign objective and audience.

## Brand Profile

- Improve brand extraction review.
  - Let users edit brand name, description, language, colors, fonts, and tone.
  - Mark extracted values as confirmed or ignored.
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
  - Supabase Auth or Clerk.
  - Associate projects with users.
  - Lock projects and drafts behind row-level security.

- Update database schema.
  - Add `language`, `tone`, and `audience` fields to projects or brand profiles.
  - Add `provider`, `model`, `prompt_version`, and `settings` to post drafts.
  - Add campaigns table.
  - Add user ownership columns.

## Deployment And Operations

- Finish Vercel production setup.
  - Confirm all environment variables are set.
  - Add production Supabase URL/key configuration.
  - Confirm Firecrawl works from Vercel.
  - Confirm draft generation works from Vercel.

- Add observability.
  - Log scrape failures.
  - Log generation failures.
  - Show user-friendly error messages.
  - Add basic rate limiting for scrape and generation endpoints.

## Later

- Add image post generation.
  - Generate branded post images from saved colors, logo, and tone.
  - Store image outputs.
  - Export platform-specific sizes.

- Add publishing integrations.
  - LinkedIn.
  - X.
  - Instagram/Facebook via Meta.
  - Manual export before direct publishing.

