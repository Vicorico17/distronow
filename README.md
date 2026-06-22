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

Required for persistence:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://czxrhuuopbcujyeryxml.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in client code. It is only used by server routes.

## Database

Run the SQL in `supabase/migrations/20260622172000_create_brand_pipeline.sql` against the Supabase project.

Current tables:

- `projects`: one row per website/domain.
- `brand_extractions`: append-only Firecrawl extraction history for each project.

The API route `POST /api/brand/scrape` works without Supabase keys, but it only saves results when the server role key is configured.
