create table if not exists public.post_drafts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  brand_extraction_id uuid references public.brand_extractions(id) on delete set null,
  channel text not null,
  intent text not null,
  headline text not null,
  body text not null,
  cta text,
  hashtags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists post_drafts_project_id_created_at_idx
  on public.post_drafts (project_id, created_at desc);

create index if not exists post_drafts_channel_intent_idx
  on public.post_drafts (channel, intent);

alter table public.post_drafts enable row level security;

drop policy if exists "Public can read post drafts" on public.post_drafts;

create policy "Public can read post drafts"
on public.post_drafts
for select
to anon, authenticated
using (true);

