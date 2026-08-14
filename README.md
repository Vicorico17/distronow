# DistroNow

DistroNow turns a website into a reusable brand profile for distribution workflows. The first pipeline uses Firecrawl branding extraction, then stores the result in Supabase for later social content generation.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required for scraping:

```bash
FIRECRAWL_API_KEY=fc-your-api-key
```

Optional for AI draft generation:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_TTS_MODEL=gpt-4o-mini-tts
```

When `OPENAI_API_KEY` is not set, draft generation uses the deterministic template fallback.

Product videos with audio additionally use [HyperFrames](https://hyperframes.video) to render a local MP4. The renderer needs a compatible Chrome/Chromium installation and FFmpeg available on the server that runs Next.js. The app generates voiceover with the same `OPENAI_API_KEY` and stores only the final MP4 in Supabase Storage.

Required for persistence:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://czxrhuuopbcujyeryxml.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in client code. It is only used by server routes.

## Database

Run the SQL migrations in `supabase/migrations/` against the Supabase project.

Current tables:

- `projects`: one row per website/domain.
- `brand_extractions`: append-only Firecrawl extraction history for each project.
- `post_drafts`: saved social post ideas generated from a project brand profile.
- `brand_audiences`: recommended and manually edited best-customer personas.
- `marketing_assets`: generated image/content asset records linked to projects and audiences.

The API route `POST /api/brand/scrape` works without Supabase keys, but it only saves results when the server role key is configured.
