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
```

When `OPENAI_API_KEY` is not set, draft generation uses the deterministic template fallback.

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

The API route `POST /api/brand/scrape` works without Supabase keys, but it only saves results when the server role key is configured.
